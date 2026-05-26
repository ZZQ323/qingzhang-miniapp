<script>
import { getProfile, logout } from '@/api/auth';
import { useLedger } from '@/store/ledger';

export default {
  data() {
    return { profile: { nickname: '', userId: '', bookId: '' } };
  },
  onShow() {
    this.profile = getProfile();
  },
  computed: {
    store() {
      return useLedger();
    }
  },
  methods: {
    sync() {
      this.store.init();
      uni.showToast({ title: '已同步', icon: 'success' });
    },
    doLogout() {
      uni.showModal({
        title: '退出登录',
        content: '退出后将清除本地登录状态',
        success: (res) => {
          if (res.confirm) {
            logout();
            this.profile = getProfile();
            uni.showToast({ title: '已退出', icon: 'none' });
          }
        }
      });
    }
  }
};
</script>

<template>
  <view class="page">
    <view class="card">
      <text class="nick">{{ profile.nickname || '未登录' }}</text>
      <text class="sub">账本邀请码：{{ profile.bookId || '-' }}</text>
    </view>

    <view class="list">
      <view class="cell" @tap="sync">
        <text>立即同步</text>
        <text class="arrow">›</text>
      </view>
      <view class="cell" @tap="doLogout">
        <text class="danger">退出登录</text>
        <text class="arrow">›</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; padding: 24rpx; box-sizing: border-box; }
.card {
  background: linear-gradient(135deg, #2c2c2e, #1c1c1e);
  border: 1rpx solid #3a3a3c; border-radius: 20rpx;
  padding: 48rpx 36rpx; margin-bottom: 32rpx; display: flex; flex-direction: column;
}
.nick { color: #f2f2f7; font-size: 40rpx; font-weight: 600; }
.sub { color: #8e8e93; font-size: 26rpx; margin-top: 12rpx; }
.list { background: #2c2c2e; border-radius: 16rpx; overflow: hidden; }
.cell {
  display: flex; justify-content: space-between; align-items: center;
  padding: 30rpx 28rpx; border-bottom: 1rpx solid #3a3a3c; color: #f2f2f7; font-size: 30rpx;
}
.cell:last-child { border-bottom: none; }
.arrow { color: #5a5a5e; }
.danger { color: #ff6b6b; }
</style>
