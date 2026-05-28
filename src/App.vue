<script>
import { isLoggedIn } from '@/api/auth';
import { useLedger } from '@/store/ledger';

export default {
  onLaunch() {
    // 登录改为「我的」页手动点击触发，不再静默登录。
    // 已登录则启动时同步一次；未登录不打扰，离线仍可本地记账。
    if (isLoggedIn()) useLedger().init();
  },
  onShow() {
    if (isLoggedIn()) useLedger().init();
  }
};
</script>

<style>
page {
  background: #1c1c1e;
  color: #f2f2f7;
}
</style>
