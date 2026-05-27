<script>
import { silentLogin } from '@/api/auth';
import { useLedger } from '@/store/ledger';

export default {
  async onLaunch() {
    const ledger = useLedger();
    try {
      await silentLogin();        // 静默登录，token 持久化
    } catch (e) {
      // 登录失败（无网/后端未起）静默容错，离线仍可记账，联网后自动补登
      console.warn('silentLogin failed:', e);
    }
    await ledger.init();          // 先推待发队列，再拉增量
  },
  onShow() {
    // 回到前台时补一次同步
    useLedger().init();
  }
};
</script>

<style>
page {
  background: #1c1c1e;
  color: #f2f2f7;
}
</style>
