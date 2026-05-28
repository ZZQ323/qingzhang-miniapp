<script>
import { api } from '@/api/request';
import { isLoggedIn } from '@/api/auth';
import { useLedger } from '@/store/ledger';

export default {
  data() {
    return {
      source: 'wx', // wx | alipay
      importing: false
    };
  },
  onShow() {
    // 限制登录后使用
    if (!isLoggedIn()) {
      uni.showModal({
        title: '请先登录',
        content: '导入账单需要先登录',
        showCancel: false,
        success: () => uni.switchTab({ url: '/pages/mine/mine' })
      });
    }
  },
  computed: {
    guide() {
      return this.source === 'wx'
        ? ['微信 我 → 服务 → 钱包 → 账单 → 右上角「常见问题」→ 下载账单 → 用于个人对账',
           '收到邮件后下载并解压（密码为你设置的）',
           '把解压出的 .csv 发到「文件传输助手」',
           '回到这里点「选择文件导入」']
        : ['支付宝 我的 → 账单 → 右上角「…」→ 开具交易流水证明 → 用于个人对账',
           '邮件收到压缩包，解压（密码默认身份证后6位或自定义）',
           '把解压出的 .csv 发到「文件传输助手」',
           '回到这里点「选择文件导入」'];
    }
  },
  methods: {
    pick() {
      if (this.importing) return;
      // #ifndef MP-WEIXIN
      uni.showModal({ title: '提示', content: '请在微信小程序中使用文件导入', showCancel: false });
      return;
      // #endif
      // #ifdef MP-WEIXIN
      uni.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['csv'],
        success: (res) => {
          const file = res.tempFiles && res.tempFiles[0];
          if (!file) return;
          this.readAndUpload(file.path);
        },
        fail: () => {}
      });
      // #endif
    },
    readAndUpload(path) {
      this.importing = true;
      uni.showLoading({ title: '导入中...', mask: true });
      uni.getFileSystemManager().readFile({
        filePath: path,
        encoding: 'base64', // 原样字节，保留支付宝 GBK
        success: async (r) => {
          try {
            const data = await api.importBill(this.source, r.data);
            await useLedger().syncPull();
            uni.hideLoading();
            uni.showModal({
              title: '导入完成',
              content: `成功 ${data.imported} 条，跳过重复 ${data.skipped} 条`,
              showCancel: false
            });
          } catch (e) {
            uni.hideLoading();
            uni.showModal({ title: '导入失败', content: e.message || '解析失败', showCancel: false });
          } finally {
            this.importing = false;
          }
        },
        fail: () => {
          uni.hideLoading();
          this.importing = false;
          uni.showToast({ title: '读取文件失败', icon: 'none' });
        }
      });
    }
  }
};
</script>

<template>
  <view class="page">
    <view class="seg">
      <view :class="['seg-item', source === 'wx' && 'on']" @tap="source = 'wx'">微信账单</view>
      <view :class="['seg-item', source === 'alipay' && 'on']" @tap="source = 'alipay'">支付宝账单</view>
    </view>

    <view class="guide">
      <text class="g-title">导入步骤</text>
      <view v-for="(g, i) in guide" :key="i" class="g-row">
        <text class="g-no">{{ i + 1 }}</text>
        <text class="g-txt">{{ g }}</text>
      </view>
      <text class="g-tip">仅支持解压后的 .csv 文件；重复的交易会自动跳过，可放心多次导入。</text>
    </view>

    <view class="btn" :class="{ disabled: importing }" @tap="pick">
      {{ importing ? '导入中...' : '选择文件导入' }}
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; padding: 24rpx; box-sizing: border-box; }
.seg { display: flex; background: #1c1c1e; border-radius: 12rpx; padding: 6rpx; margin-bottom: 32rpx; }
.seg-item { flex: 1; text-align: center; padding: 18rpx 0; border-radius: 10rpx; color: #aeaeb2; font-size: 30rpx; }
.seg-item.on { background: #d4af37; color: #1c1c1e; font-weight: 600; }
.guide { background: #2c2c2e; border-radius: 16rpx; padding: 28rpx; margin-bottom: 40rpx; }
.g-title { color: #f2f2f7; font-size: 30rpx; font-weight: 600; }
.g-row { display: flex; align-items: flex-start; margin-top: 20rpx; }
.g-no {
  flex-shrink: 0; width: 36rpx; height: 36rpx; line-height: 36rpx; text-align: center;
  background: #d4af37; color: #1c1c1e; border-radius: 50%; font-size: 22rpx; margin-right: 16rpx;
}
.g-txt { color: #c7c7cc; font-size: 26rpx; line-height: 36rpx; flex: 1; }
.g-tip { display: block; color: #8e8e93; font-size: 22rpx; margin-top: 24rpx; }
.btn {
  background: #d4af37; color: #1c1c1e; font-weight: 600; font-size: 32rpx;
  text-align: center; padding: 28rpx 0; border-radius: 14rpx;
}
.btn.disabled { opacity: 0.6; }
</style>
