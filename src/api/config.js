// 后端地址按环境区分：开发指向本机/测试，生产指向正式域名。
// uniapp 通过 process.env.NODE_ENV 区分 dev/prod（dev=运行 dev:* 脚本，prod=build）。
// 各端本地调试地址不同：
//   - H5：浏览器直接访问，用 localhost
//   - 微信开发者工具：需用本机局域网 IP（并在工具里勾选「不校验合法域名」）
const DEV_BASE = (() => {
  // #ifdef H5
  return 'http://localhost:8080';
  // #endif
  // #ifndef H5
  return 'http://127.0.0.1:8080'; // 真机调试请改成本机局域网 IP，如 http://192.168.1.10:8080
  // #endif
})();

const PROD_BASE = 'https://api.yourdomain.com'; // TODO: 换成你的正式后端域名

export const BASE = process.env.NODE_ENV === 'development' ? DEV_BASE : PROD_BASE;
