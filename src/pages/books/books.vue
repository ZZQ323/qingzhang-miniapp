<script>
import { api } from '@/api/request';
import { isLoggedIn } from '@/api/auth';
import { useLedger } from '@/store/ledger';

export default {
  data() {
    return { books: [], currentBookId: 0, loading: false };
  },
  onShow() {
    if (!isLoggedIn()) {
      uni.showModal({
        title: '请先登录', content: '管理账本需要先登录', showCancel: false,
        success: () => uni.switchTab({ url: '/pages/mine/mine' })
      });
      return;
    }
    this.load();
  },
  methods: {
    async load() {
      try {
        const data = await api.listBooks();
        this.books = data.books || [];
        this.currentBookId = data.currentBookId;
        uni.setStorageSync('bookId', this.currentBookId);
      } catch (e) {}
    },
    async pick(b) {
      if (b.id === this.currentBookId || this.loading) return;
      this.loading = true;
      uni.showLoading({ title: '切换中...', mask: true });
      try {
        await api.switchBook(b.id);
        this.currentBookId = b.id;
        uni.setStorageSync('bookId', b.id);
        await useLedger().resetAndReload(); // 换账本：清本地、按新账本全量重拉
        uni.hideLoading();
        uni.showToast({ title: '已切换到「' + b.name + '」', icon: 'none' });
      } catch (e) {
        uni.hideLoading();
        uni.showToast({ title: e.message || '切换失败', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    create() {
      uni.showModal({
        title: '新建账本', editable: true, placeholderText: '账本名称（如 旅行、日常）',
        success: async (res) => {
          if (!res.confirm) return;
          const name = (res.content || '').trim();
          if (!name) return;
          try {
            await api.createBook(name);
            await this.load();                 // 新建后已切为当前
            await useLedger().resetAndReload();
            uni.showToast({ title: '已创建并切换', icon: 'none' });
          } catch (e) {
            uni.showToast({ title: e.message || '创建失败', icon: 'none' });
          }
        }
      });
    },
    copyInvite(b) {
      uni.setClipboardData({
        data: String(b.id),
        success: () => uni.showToast({ title: '邀请码已复制', icon: 'none' })
      });
    }
  }
};
</script>

<template>
  <view class="page">
    <view class="block">
      <text class="block-title">我的账本</text>
      <view v-for="b in books" :key="b.id" class="cell" @tap="pick(b)">
        <view class="left">
          <text class="name">{{ b.name }}</text>
          <text v-if="b.id === currentBookId" class="cur">当前</text>
        </view>
        <text class="invite" @tap.stop="copyInvite(b)">邀请码 {{ b.id }} ⧉</text>
      </view>
    </view>

    <view class="btn" @tap="create">＋ 新建账本</view>
    <text class="tip">把某个账本的邀请码发给好友，对方在「我的」页输入即可加入共记。</text>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; padding: 24rpx; box-sizing: border-box; }
.block { background: #2c2c2e; border-radius: 16rpx; overflow: hidden; margin-bottom: 32rpx; }
.block-title { display: block; color: #8e8e93; font-size: 24rpx; padding: 24rpx 28rpx 0; }
.cell {
  display: flex; justify-content: space-between; align-items: center;
  padding: 30rpx 28rpx; border-bottom: 1rpx solid #3a3a3c;
}
.cell:last-child { border-bottom: none; }
.left { display: flex; align-items: center; gap: 16rpx; }
.name { color: #f2f2f7; font-size: 32rpx; }
.cur { color: #1c1c1e; background: #d4af37; font-size: 20rpx; padding: 2rpx 14rpx; border-radius: 999rpx; }
.invite { color: #d4af37; font-size: 24rpx; }
.btn {
  background: #d4af37; color: #1c1c1e; font-weight: 600; font-size: 32rpx;
  text-align: center; padding: 26rpx 0; border-radius: 14rpx;
}
.tip { display: block; color: #5a5a5e; font-size: 22rpx; margin-top: 24rpx; padding: 0 8rpx; }
</style>
