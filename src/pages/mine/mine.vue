<script>
import { getProfile, logout, login, isLoggedIn } from '@/api/auth';
import { api } from '@/api/request';
import { useLedger } from '@/store/ledger';
import { exportCsv } from '@/utils/csv';

export default {
  data() {
    return {
      profile: { nickname: '', userId: '', bookId: '' },
      joinCode: '',
      logged: false,
      logging: false
    };
  },
  onShow() {
    this.profile = getProfile();
    this.logged = isLoggedIn();
  },
  computed: {
    store() {
      return useLedger();
    }
  },
  methods: {
    async doLogin() {
      if (this.logging) return;
      this.logging = true;
      uni.showLoading({ title: '登录中...', mask: true });
      try {
        await login();
        this.profile = getProfile();
        this.logged = true;
        uni.hideLoading();
        uni.showToast({ title: '登录成功', icon: 'success' });
        await this.store.init();
      } catch (e) {
        uni.hideLoading();
        // 登录失败给出明确原因 + 可重试，而非静默
        uni.showModal({
          title: '登录失败',
          content: e.message || '未知错误，请重试',
          showCancel: false,
          confirmText: '知道了'
        });
      } finally {
        this.logging = false;
      }
    },
    goImport() {
      uni.navigateTo({ url: '/pages/import/import' });
    },
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
            this.logged = false;
            this.joinCode = '';
            // 清空本地账本数据，避免残留上一个账号的记录
            this.store.resetLocal();
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
      <text class="nick">{{ logged ? (profile.nickname || '微信用户') : '未登录' }}</text>
      <text class="sub">{{ logged ? '当前账本：' + (profile.bookId || '-') : '登录后多设备同步、可与好友共记账本' }}</text>
      <view v-if="!logged" class="login-btn" :class="{ disabled: logging }" @tap="doLogin">
        {{ logging ? '登录中...' : '微信登录' }}
      </view>
    </view>

    <!-- 账本设置（登录后才显示） -->
    <template v-if="logged">
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
      <view class="cell" @tap="goImport">
        <text>导入账单（微信/支付宝）</text>
        <text class="arrow">›</text>
      </view>
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
    </template>
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
.login-btn {
  margin-top: 32rpx; align-self: flex-start;
  background: #d4af37; color: #1c1c1e; font-size: 30rpx; font-weight: 600;
  padding: 18rpx 56rpx; border-radius: 999rpx;
}
.login-btn.disabled { opacity: 0.6; }
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
