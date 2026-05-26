<script>
import { useLedger } from '@/store/ledger';
import { categoriesOf } from '@/utils/categories';
import { yuanToFen, fenToYuan, todayStr } from '@/utils/format';

function blankForm() {
  return {
    id: null,
    type: 1,            // 1 支出, 2 收入
    amountInput: '',    // 元，字符串
    category: '',
    note: '',
    account: '',
    counterparty: '',
    happenedAt: todayStr()
  };
}

export default {
  name: 'RecordSheet',
  props: {
    visible: { type: Boolean, default: false },
    // 传入则为编辑模式（来自 store 的记录，金额为分）
    record: { type: Object, default: null }
  },
  emits: ['close'],
  data() {
    return { form: blankForm() };
  },
  computed: {
    categories() {
      return categoriesOf(this.form.type);
    },
    isEdit() {
      return !!(this.record && this.record.id);
    }
  },
  watch: {
    visible(v) {
      if (v) this.reset();
    }
  },
  methods: {
    reset() {
      if (this.record) {
        this.form = {
          id: this.record.id,
          type: this.record.type || 1,
          amountInput: fenToYuan(this.record.amount),
          category: this.record.category || '',
          note: this.record.note || '',
          account: this.record.account || '',
          counterparty: this.record.counterparty || '',
          happenedAt: this.record.happenedAt || todayStr()
        };
      } else {
        this.form = blankForm();
      }
    },
    setType(t) {
      this.form.type = t;
      // 切换收支后清掉不属于该类的类别
      if (!this.categories.includes(this.form.category)) this.form.category = '';
    },
    onDate(e) {
      this.form.happenedAt = e.detail.value;
    },
    close() {
      this.$emit('close');
    },
    save() {
      const fen = yuanToFen(this.form.amountInput);
      if (fen <= 0) {
        uni.showToast({ title: '请输入金额', icon: 'none' });
        return;
      }
      if (!this.form.category) {
        uni.showToast({ title: '请选择类别', icon: 'none' });
        return;
      }
      const rec = {
        type: this.form.type,
        amount: fen,                       // 存为分
        category: this.form.category,
        note: this.form.note,
        account: this.form.account,
        counterparty: this.form.counterparty,
        happenedAt: this.form.happenedAt,
        isDeleted: 0
      };
      if (this.isEdit) rec.id = this.form.id;
      useLedger().upsert(rec);             // 先写本地、秒回，后台异步 push
      uni.showToast({ title: '已保存', icon: 'success' });
      this.close();
    }
  }
};
</script>

<template>
  <view v-if="visible" class="mask" @tap="close">
    <view class="sheet" @tap.stop>
      <view class="grabber"></view>

      <!-- 收支切换 -->
      <view class="seg">
        <view :class="['seg-item', form.type === 1 && 'active-exp']" @tap="setType(1)">支出</view>
        <view :class="['seg-item', form.type === 2 && 'active-inc']" @tap="setType(2)">收入</view>
      </view>

      <!-- 金额 -->
      <view class="amount-row">
        <text class="cny">¥</text>
        <input
          class="amount-input"
          type="digit"
          v-model="form.amountInput"
          placeholder="0.00"
          placeholder-class="ph"
          focus
        />
      </view>

      <!-- 类别 -->
      <view class="cats">
        <view
          v-for="c in categories"
          :key="c"
          :class="['cat', form.category === c && 'cat-on']"
          @tap="form.category = c"
        >{{ c }}</view>
      </view>

      <!-- 其它字段 -->
      <view class="field">
        <text class="label">日期</text>
        <picker mode="date" :value="form.happenedAt" @change="onDate">
          <text class="val">{{ form.happenedAt }}</text>
        </picker>
      </view>
      <view class="field">
        <text class="label">备注</text>
        <input class="val-input" v-model="form.note" placeholder="选填" placeholder-class="ph" />
      </view>
      <view class="field">
        <text class="label">账户</text>
        <input class="val-input" v-model="form.account" placeholder="选填" placeholder-class="ph" />
      </view>
      <view class="field">
        <text class="label">收支人员</text>
        <input class="val-input" v-model="form.counterparty" placeholder="选填" placeholder-class="ph" />
      </view>

      <button class="save-btn" @tap="save">{{ isEdit ? '保存修改' : '记一笔' }}</button>
    </view>
  </view>
</template>

<style scoped>
.mask {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-end;
}
.sheet {
  width: 100%;
  background: #2c2c2e;
  border-radius: 20px 20px 0 0;
  padding: 16rpx 32rpx 48rpx;
  box-sizing: border-box;
}
.grabber {
  width: 72rpx; height: 8rpx; border-radius: 4rpx;
  background: #5a5a5e; margin: 8rpx auto 24rpx;
}
.seg {
  display: flex; background: #1c1c1e; border-radius: 12rpx; padding: 6rpx; margin-bottom: 24rpx;
}
.seg-item {
  flex: 1; text-align: center; padding: 16rpx 0; border-radius: 10rpx; color: #aeaeb2; font-size: 30rpx;
}
.active-exp { background: #d4af37; color: #1c1c1e; font-weight: 600; }
.active-inc { background: #34c759; color: #1c1c1e; font-weight: 600; }
.amount-row {
  display: flex; align-items: baseline; padding: 16rpx 8rpx 24rpx; border-bottom: 1rpx solid #3a3a3c;
}
.cny { color: #d4af37; font-size: 48rpx; margin-right: 12rpx; }
.amount-input { flex: 1; font-size: 64rpx; color: #f2f2f7; }
.ph { color: #5a5a5e; }
.cats { display: flex; flex-wrap: wrap; gap: 16rpx; padding: 24rpx 0; }
.cat {
  padding: 12rpx 28rpx; background: #1c1c1e; border-radius: 999rpx; color: #aeaeb2; font-size: 28rpx;
}
.cat-on { background: #d4af37; color: #1c1c1e; font-weight: 600; }
.field {
  display: flex; align-items: center; justify-content: space-between;
  padding: 22rpx 0; border-top: 1rpx solid #3a3a3c;
}
.label { color: #aeaeb2; font-size: 30rpx; }
.val { color: #f2f2f7; font-size: 30rpx; }
.val-input { text-align: right; color: #f2f2f7; font-size: 30rpx; flex: 1; margin-left: 24rpx; }
.save-btn {
  margin-top: 32rpx; background: #d4af37; color: #1c1c1e; font-weight: 600;
  border-radius: 14rpx; font-size: 32rpx;
}
</style>
