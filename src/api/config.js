// 后端地址按环境区分：开发指向本机/测试，生产指向正式域名。
// uniapp 通过 process.env.NODE_ENV 区分 dev/prod（dev=运行 dev:* 脚本，prod=build）。
// 各端本地调试地址不同：
//   - H5：浏览器直接访问，用 localhost
//   - 微信开发者工具：需用本机局域网 IP（并在工具里勾选「不校验合法域名」）
const DEV_BASE = (() => {
  // #ifdef H5
  return 'http://localhost:8080'; // H5 浏览器调试连本地后端（配 DEV_MODE=1）
  // #endif
  // #ifndef H5
  // 小程序（开发者工具/真机）走 https + Nginx 的 /bookkeeping 前缀，
  // 与微信后台 request 合法域名 https://zzq323.top 一致，否则请求被拦/超时
  return 'https://zzq323.top/bookkeeping';
  // #endif
})();

const PROD_BASE = 'https://zzq323.top/bookkeeping';

export const BASE = process.env.NODE_ENV === 'development' ? DEV_BASE : PROD_BASE;
