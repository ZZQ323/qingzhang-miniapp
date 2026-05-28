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

export function isLoggedIn() {
  return !!getToken();
}

// 手动登录：用户点击触发。各步骤抛出可读错误，调用方负责展示。
export async function login() {
  let code = '';
  // #ifdef MP-WEIXIN
  let res;
  try {
    res = await uni.login({ provider: 'weixin' });
  } catch (e) {
    throw new Error('微信授权失败，请重试');
  }
  if (!res || !res.code) throw new Error('未获取到微信登录凭证');
  code = res.code;
  // #endif
  // #ifndef MP-WEIXIN
  // 非微信端（H5 调试）：后端 DEV_MODE=1 时任意 code 均可登录
  code = 'dev_' + (uni.getStorageSync('devCode') || 'h5');
  // #endif

  // api.login 为 silent，错误在此处统一抛出（带后端 msg）
  const data = await api.login(code);
  uni.setStorageSync('token', data.token);
  uni.setStorageSync('userId', data.userId);
  uni.setStorageSync('nickname', data.nickname);
  uni.setStorageSync('bookId', data.bookId);
  return getProfile();
}
