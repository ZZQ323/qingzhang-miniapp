// 统一请求封装：自动带 token，401 自动跳登录
import { BASE } from './config';

// opt.silent=true 时不弹出错误提示（由调用方自行处理）
function request(opt) {
  const token = uni.getStorageSync('token');
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE + opt.url,
      method: opt.method || 'GET',
      data: opt.data || {},
      timeout: 10000,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      success: (res) => {
        // 401：token 失效，清掉本地登录态，错误带上业务消息
        if (res.statusCode === 401) {
          uni.removeStorageSync('token');
          fail(new Error(res.data?.msg || '登录已失效，请重新登录'), opt);
          reject(new Error(res.data?.msg || '登录已失效'));
          return;
        }
        const body = res.data;
        if (body && body.code === 0) {
          resolve(body.data);
          return;
        }
        // 业务错误：用后端返回的 msg
        const err = new Error(body?.msg || `请求失败(${res.statusCode})`);
        err.code = body?.code;
        fail(err, opt);
        reject(err);
      },
      // 网络层失败（断网、超时、域名拦截）：给出可读提示而非静默
      fail: (e) => {
        const msg = /timeout/i.test(e.errMsg || '') ? '请求超时，请检查网络' : '网络异常，请稍后重试';
        const err = new Error(msg);
        fail(err, opt);
        reject(err);
      }
    });
  });
}

// 统一错误反馈：默认弹 toast，调用方可传 silent 关闭
function fail(err, opt) {
  if (opt && opt.silent) return;
  uni.showToast({ title: err.message, icon: 'none', duration: 2500 });
}

export const api = {
  login: (code) => request({ url: '/api/auth/login', method: 'POST', data: { code }, silent: true }),
  pull: (since) => request({ url: '/api/sync/pull' + (since ? '?since=' + encodeURIComponent(since) : ''), silent: true }),
  push: (records) => request({ url: '/api/sync/push', method: 'POST', data: { records }, silent: true }),
  joinBook: (bookId) => request({ url: '/api/book/join', method: 'POST', data: { bookId } })
};
