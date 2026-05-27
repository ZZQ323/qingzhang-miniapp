<script>
import { useLedger } from '@/store/ledger';
import {
  fenToYuan, monthOf, thisMonth, prevMonth, monthRange,
  recentMonths, inRange, todayStr
} from '@/utils/format';

export default {
  data() {
    return {
      range: 'this',          // this | last | custom
      customStart: todayStr(),
      customEnd: todayStr(),
      breakdownType: 1        // 构成饼图看哪类：1 支出, 2 收入
    };
  },
  computed: {
    store() {
      return useLedger();
    },
    // 当前筛选区间 [start,end]
    period() {
      if (this.range === 'last') return monthRange(prevMonth());
      if (this.range === 'custom') {
        return this.customStart <= this.customEnd
          ? [this.customStart, this.customEnd]
          : [this.customEnd, this.customStart];
      }
      return monthRange(thisMonth());
    },
    // 区间内的记录
    inPeriod() {
      const [s, e] = this.period;
      return this.store.visible.filter((r) => inRange(r.happenedAt, s, e));
    },
    summary() {
      let income = 0, expense = 0;
      this.inPeriod.forEach((r) => {
        if (r.type === 2) income += r.amount; else expense += r.amount;
      });
      return { income, expense, balance: income - expense };
    },
    // 按类别聚合（构成饼图的替代：排序后的占比条）
    breakdown() {
      const map = {};
      let total = 0;
      this.inPeriod.forEach((r) => {
        if (r.type !== this.breakdownType) return;
        map[r.category] = (map[r.category] || 0) + r.amount;
        total += r.amount;
      });
      return Object.keys(map)
        .map((cat) => ({
          cat,
          amount: map[cat],
          pct: total ? Math.round((map[cat] / total) * 100) : 0
        }))
        .sort((a, b) => b.amount - a.amount);
    },
    // 近 6 个月收支（柱状图）
    months() {
      const yms = recentMonths(6);
      const acc = {};
      yms.forEach((m) => { acc[m] = { income: 0, expense: 0 }; });
      this.store.visible.forEach((r) => {
        const m = monthOf(r.happenedAt);
        if (!acc[m]) return;
        if (r.type === 2) acc[m].income += r.amount; else acc[m].expense += r.amount;
      });
      const max = Math.max(1, ...yms.flatMap((m) => [acc[m].income, acc[m].expense]));
      return yms.map((m) => ({
        label: m.slice(5),
        income: acc[m].income,
        expense: acc[m].expense,
        incH: Math.round((acc[m].income / max) * 100),
        expH: Math.round((acc[m].expense / max) * 100)
      }));
    }
  },
  methods: {
    yuan: fenToYuan,
    onStart(e) { this.customStart = e.detail.value; },
    onEnd(e) { this.customEnd = e.detail.value; }
  }
};
</script>

<template>
  <view class="page">
    <!-- 时间筛选 -->
    <view class="seg">
      <view :class="['seg-item', range === 'this' && 'on']" @tap="range = 'this'">本月</view>
      <view :class="['seg-item', range === 'last' && 'on']" @tap="range = 'last'">上月</view>
      <view :class="['seg-item', range === 'custom' && 'on']" @tap="range = 'custom'">自定义</view>
    </view>
    <view v-if="range === 'custom'" class="custom">
      <picker mode="date" :value="customStart" @change="onStart">
        <text class="date">{{ customStart }}</text>
      </picker>
      <text class="tilde">~</text>
      <picker mode="date" :value="customEnd" @change="onEnd">
        <text class="date">{{ customEnd }}</text>
      </picker>
    </view>

    <!-- 汇总 -->
    <view class="card">
      <view class="sum">
        <view class="sum-item">
          <text class="sum-label">收入</text>
          <text class="sum-inc">¥{{ yuan(summary.income) }}</text>
        </view>
        <view class="sum-item">
          <text class="sum-label">支出</text>
          <text class="sum-exp">¥{{ yuan(summary.expense) }}</text>
        </view>
        <view class="sum-item">
          <text class="sum-label">结余</text>
          <text class="sum-bal">¥{{ yuan(summary.balance) }}</text>
        </view>
      </view>
    </view>

    <!-- 构成（类别占比） -->
    <view class="block">
      <view class="block-head">
        <text class="block-title">收支构成</text>
        <view class="mini-seg">
          <text :class="['mini', breakdownType === 1 && 'mon']" @tap="breakdownType = 1">支出</text>
          <text :class="['mini', breakdownType === 2 && 'mon']" @tap="breakdownType = 2">收入</text>
        </view>
      </view>
      <view v-if="breakdown.length === 0" class="empty">本区间无数据</view>
      <view v-for="b in breakdown" :key="b.cat" class="bd-row">
        <view class="bd-top">
          <text class="bd-cat">{{ b.cat }}</text>
          <text class="bd-amt">¥{{ yuan(b.amount) }} · {{ b.pct }}%</text>
        </view>
        <view class="bar-bg">
          <view class="bar-fill" :style="{ width: b.pct + '%' }"></view>
        </view>
      </view>
    </view>

    <!-- 近 6 月柱状 -->
    <view class="block">
      <text class="block-title">近 6 个月收支</text>
      <view class="chart">
        <view v-for="m in months" :key="m.label" class="col">
          <view class="bars">
            <view class="bar inc" :style="{ height: m.incH + '%' }"></view>
            <view class="bar exp" :style="{ height: m.expH + '%' }"></view>
          </view>
          <text class="col-label">{{ m.label }}</text>
        </view>
      </view>
      <view class="legend">
        <text class="lg lg-inc">■ 收入</text>
        <text class="lg lg-exp">■ 支出</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; padding: 24rpx 24rpx 60rpx; box-sizing: border-box; }
.seg { display: flex; background: #2c2c2e; border-radius: 12rpx; padding: 6rpx; }
.seg-item { flex: 1; text-align: center; padding: 16rpx 0; border-radius: 10rpx; color: #aeaeb2; font-size: 28rpx; }
.seg-item.on { background: #d4af37; color: #1c1c1e; font-weight: 600; }
.custom { display: flex; align-items: center; justify-content: center; gap: 24rpx; padding: 24rpx 0; color: #f2f2f7; }
.date { background: #2c2c2e; padding: 12rpx 24rpx; border-radius: 10rpx; font-size: 28rpx; }
.tilde { color: #8e8e93; }
.card { background: #2c2c2e; border-radius: 18rpx; padding: 32rpx; margin: 24rpx 0; }
.sum { display: flex; justify-content: space-between; }
.sum-item { display: flex; flex-direction: column; align-items: center; flex: 1; }
.sum-label { color: #8e8e93; font-size: 24rpx; }
.sum-inc { color: #34c759; font-size: 34rpx; margin-top: 8rpx; }
.sum-exp { color: #ff6b6b; font-size: 34rpx; margin-top: 8rpx; }
.sum-bal { color: #d4af37; font-size: 34rpx; margin-top: 8rpx; }
.block { background: #2c2c2e; border-radius: 18rpx; padding: 28rpx; margin-bottom: 24rpx; }
.block-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.block-title { color: #f2f2f7; font-size: 30rpx; font-weight: 600; }
.mini-seg { display: flex; gap: 8rpx; }
.mini { padding: 6rpx 20rpx; border-radius: 999rpx; color: #aeaeb2; font-size: 24rpx; background: #1c1c1e; }
.mini.mon { background: #d4af37; color: #1c1c1e; }
.empty { color: #8e8e93; font-size: 26rpx; text-align: center; padding: 40rpx 0; }
.bd-row { margin-top: 20rpx; }
.bd-top { display: flex; justify-content: space-between; margin-bottom: 8rpx; }
.bd-cat { color: #f2f2f7; font-size: 28rpx; }
.bd-amt { color: #8e8e93; font-size: 24rpx; }
.bar-bg { height: 14rpx; background: #1c1c1e; border-radius: 999rpx; overflow: hidden; }
.bar-fill { height: 100%; background: linear-gradient(90deg, #d4af37, #f0d579); border-radius: 999rpx; }
.chart { display: flex; align-items: flex-end; justify-content: space-between; height: 280rpx; margin-top: 16rpx; }
.col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.bars { flex: 1; display: flex; align-items: flex-end; gap: 6rpx; }
.bar { width: 18rpx; border-radius: 6rpx 6rpx 0 0; min-height: 4rpx; }
.bar.inc { background: #34c759; }
.bar.exp { background: #ff6b6b; }
.col-label { color: #8e8e93; font-size: 22rpx; margin-top: 10rpx; }
.legend { display: flex; gap: 32rpx; justify-content: center; margin-top: 16rpx; }
.lg { font-size: 24rpx; }
.lg-inc { color: #34c759; }
.lg-exp { color: #ff6b6b; }
</style>
