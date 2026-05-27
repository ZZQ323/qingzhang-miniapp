<script>
import { useLedger } from '@/store/ledger';
import RecordSheet from '@/components/RecordSheet.vue';
import { fenToYuan, monthOf, thisMonth } from '@/utils/format';

export default {
  components: { RecordSheet },
  data() {
    return { sheetOpen: false, editing: null };
  },
  computed: {
    store() {
      return useLedger();
    },
    myNickname() {
      return uni.getStorageSync('nickname') || '';
    },
    // 本月收入/支出/结余（分）
    monthStat() {
      const m = thisMonth();
      let income = 0, expense = 0;
      this.store.visible.forEach((r) => {
        if (monthOf(r.happenedAt) !== m) return;
        if (r.type === 2) income += r.amount; else expense += r.amount;
      });
      return { income, expense, balance: income - expense };
    },
    // 按日期分组，每组带当日收支小计
    groups() {
      const byDay = {};
      this.store.visible.forEach((r) => {
        const d = r.happenedAt || '';
        (byDay[d] = byDay[d] || []).push(r);
      });
      return Object.keys(byDay)
        .sort((a, b) => b.localeCompare(a))
        .map((date) => {
          const items = byDay[date];
          let income = 0, expense = 0;
          items.forEach((r) => { if (r.type === 2) income += r.amount; else expense += r.amount; });
          return { date, items, income, expense };
        });
    }
  },
  methods: {
    yuan: fenToYuan,
    openAdd() {
      this.editing = null;
      this.sheetOpen = true;
    },
    openEdit(rec) {
      this.editing = rec;
      this.sheetOpen = true;
    },
    confirmDelete(rec) {
      uni.showModal({
        title: '删除记录',
        content: '确定删除这笔记录？',
        success: (res) => {
          if (res.confirm) this.store.remove(rec.id);
        }
      });
    }
  }
};
</script>

<template>
  <view class="page">
    <!-- 结余卡 -->
    <view class="card">
      <text class="card-title">本月结余</text>
      <text class="balance">¥{{ yuan(monthStat.balance) }}</text>
      <view class="card-foot">
        <view class="foot-item">
          <text class="foot-label">收入</text>
          <text class="foot-inc">¥{{ yuan(monthStat.income) }}</text>
        </view>
        <view class="foot-item">
          <text class="foot-label">支出</text>
          <text class="foot-exp">¥{{ yuan(monthStat.expense) }}</text>
        </view>
      </view>
    </view>

    <!-- 明细列表 -->
    <view v-if="groups.length === 0" class="empty">
      <text>还没有记录，点右下角记一笔吧</text>
    </view>

    <view v-for="g in groups" :key="g.date" class="day">
      <view class="day-head">
        <text class="day-date">{{ g.date }}</text>
        <text class="day-sum">
          <text v-if="g.income">收 ¥{{ yuan(g.income) }}</text>
          <text v-if="g.expense" class="sp">支 ¥{{ yuan(g.expense) }}</text>
        </text>
      </view>
      <view
        v-for="r in g.items"
        :key="r.id"
        class="row"
        @tap="openEdit(r)"
        @longpress="confirmDelete(r)"
      >
        <view class="row-left">
          <view class="row-cat-line">
            <text class="row-cat">{{ r.category }}</text>
            <text v-if="r.recorderName && r.recorderName !== myNickname" class="recorder">{{ r.recorderName }}</text>
          </view>
          <text v-if="r.note" class="row-note">{{ r.note }}</text>
        </view>
        <text :class="['row-amt', r.type === 2 ? 'inc' : 'exp']">
          {{ r.type === 2 ? '+' : '-' }}¥{{ yuan(r.amount) }}
        </text>
      </view>
    </view>

    <!-- 记账入口 -->
    <view class="fab" @tap="openAdd">＋</view>

    <RecordSheet :visible="sheetOpen" :record="editing" @close="sheetOpen = false" />
  </view>
</template>

<style scoped>
.page { min-height: 100vh; padding: 24rpx 24rpx 160rpx; box-sizing: border-box; }
.card {
  background: linear-gradient(135deg, #2c2c2e, #1c1c1e);
  border: 1rpx solid #3a3a3c;
  border-radius: 20rpx; padding: 36rpx; margin-bottom: 24rpx;
}
.card-title { color: #aeaeb2; font-size: 28rpx; }
.balance { display: block; color: #d4af37; font-size: 72rpx; font-weight: 700; margin: 12rpx 0 24rpx; }
.card-foot { display: flex; gap: 64rpx; }
.foot-item { display: flex; flex-direction: column; }
.foot-label { color: #8e8e93; font-size: 24rpx; }
.foot-inc { color: #34c759; font-size: 32rpx; margin-top: 6rpx; }
.foot-exp { color: #ff6b6b; font-size: 32rpx; margin-top: 6rpx; }
.empty { text-align: center; color: #8e8e93; padding: 120rpx 0; font-size: 28rpx; }
.day { margin-bottom: 24rpx; }
.day-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12rpx 8rpx; color: #8e8e93; font-size: 24rpx;
}
.day-sum .sp { margin-left: 20rpx; }
.row {
  display: flex; justify-content: space-between; align-items: center;
  background: #2c2c2e; border-radius: 14rpx; padding: 26rpx 24rpx; margin-bottom: 12rpx;
}
.row-left { display: flex; flex-direction: column; }
.row-cat-line { display: flex; align-items: center; gap: 12rpx; }
.row-cat { color: #f2f2f7; font-size: 32rpx; }
.recorder { color: #d4af37; font-size: 20rpx; background: #1c1c1e; padding: 2rpx 14rpx; border-radius: 999rpx; }
.row-note { color: #8e8e93; font-size: 24rpx; margin-top: 6rpx; }
.row-amt { font-size: 34rpx; font-weight: 600; }
.row-amt.inc { color: #34c759; }
.row-amt.exp { color: #f2f2f7; }
.fab {
  position: fixed; right: 40rpx; bottom: 60rpx; z-index: 40;
  width: 108rpx; height: 108rpx; border-radius: 50%;
  background: #d4af37; color: #1c1c1e;
  font-size: 60rpx; line-height: 104rpx; text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.4);
}
</style>
