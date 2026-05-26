// 登录流程：wx.login 拿 code → /api/auth/login → 持久化 token
import { api } from './request';

export function getToken() {
  return uni.getStorageSync('token');
}

export function getProfile() {
  return {
    userId: uni.getStorageSync('userId'),
    nickname: uni.getStorageSync('nickname'),
    bookId: uni.getStorageSync('bookId')
  };
}

export function logout() {
  ['token', 'userId', 'nickname', 'bookId'].forEach((k) => uni.removeStorageSync(k));
}

// 冷启动静默登录：已有 token 直接返回；否则换 code 登录
export async function silentLogin() {
  if (getToken()) return getProfile();

  let code = '';
  // #ifdef MP-WEIXIN
  const res = await uni.login({ provider: 'weixin' });
  code = res.code;
  // #endif
  // #ifndef MP-WEIXIN
  // 非微信端（H5 调试）：后端 DEV_MODE=1 时任意 code 均可登录
  code = 'dev_' + (uni.getStorageSync('devCode') || 'h5');
  // #endif

  const data = await api.login(code);
  uni.setStorageSync('token', data.token);
  uni.setStorageSync('userId', data.userId);
  uni.setStorageSync('nickname', data.nickname);
  uni.setStorageSync('bookId', data.bookId);
  return getProfile();
}
