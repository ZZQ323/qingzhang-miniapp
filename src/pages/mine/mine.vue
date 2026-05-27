<script>
import { getProfile, logout } from '@/api/auth';
import { api } from '@/api/request';
import { useLedger } from '@/store/ledger';
import { exportCsv } from '@/utils/csv';

export default {
  data() {
    return {
      profile: { nickname: '', userId: '', bookId: '' },
      joinCode: ''
    };
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
    copyCode() {
      uni.setClipboardData({
        data: String(this.profile.bookId || ''),
        success: () => uni.showToast({ title: '邀请码已复制', icon: 'none' })
      });
    },
    async join() {
      const id = Number(this.joinCode);
      if (!id || id <= 0) {
        uni.showToast({ title: '请输入邀请码', icon: 'none' });
        return;
      }
      if (id === Number(this.profile.bookId)) {
        uni.showToast({ title: '已在该账本', icon: 'none' });
        return;
      }
      try {
        const data = await api.joinBook(id);
        uni.setStorageSync('bookId', data.bookId);
        this.profile = getProfile();
        this.joinCode = '';
        await this.store.resetAndReload();   // 切账本：清本地、全量重拉
        uni.showToast({ title: '已加入账本', icon: 'success' });
      } catch (e) {
        uni.showToast({ title: e.message || '加入失败', icon: 'none' });
      }
    },
    doExport() {
      const recs = this.store.visible;
      if (recs.length === 0) {
        uni.showToast({ title: '暂无数据', icon: 'none' });
        return;
      }
      exportCsv(recs, `qingzhang-${this.profile.bookId || ''}.csv`);
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
      <text class="sub">当前账本：{{ profile.bookId || '-' }}</text>
    </view>

    <!-- 账本设置 -->
    <view class="block">
      <text class="block-title">账本设置</text>
      <view class="cell" @tap="copyCode">
        <text>我的邀请码</text>
        <text class="code">{{ profile.bookId || '-' }} ⧉</text>
      </view>
      <view class="cell">
        <text>加入账本</text>
        <view class="join">
          <input class="join-input" v-model="joinCode" type="number" placeholder="输入邀请码" placeholder-class="ph" />
          <text class="join-btn" @tap="join">加入</text>
        </view>
      </view>
      <text class="tip">把邀请码发给好友，对方输入后即可共记一个账本</text>
    </view>

    <view class="block">
      <view class="cell" @tap="doExport">
        <text>导出 CSV</text>
        <text class="arrow">›</text>
      </view>
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
.block { background: #2c2c2e; border-radius: 16rpx; overflow: hidden; margin-bottom: 32rpx; }
.block-title { display: block; color: #8e8e93; font-size: 24rpx; padding: 24rpx 28rpx 0; }
.cell {
  display: flex; justify-content: space-between; align-items: center;
  padding: 30rpx 28rpx; border-bottom: 1rpx solid #3a3a3c; color: #f2f2f7; font-size: 30rpx;
}
.cell:last-child { border-bottom: none; }
.code { color: #d4af37; font-size: 30rpx; }
.arrow { color: #5a5a5e; }
.danger { color: #ff6b6b; }
.join { display: flex; align-items: center; gap: 16rpx; }
.join-input { width: 220rpx; text-align: right; color: #f2f2f7; font-size: 30rpx; }
.ph { color: #5a5a5e; }
.join-btn { background: #d4af37; color: #1c1c1e; font-size: 28rpx; padding: 10rpx 28rpx; border-radius: 999rpx; }
.tip { display: block; color: #5a5a5e; font-size: 22rpx; padding: 12rpx 28rpx 24rpx; }
</style>
