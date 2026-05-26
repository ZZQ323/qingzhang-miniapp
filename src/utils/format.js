// 金额全程以「分」(int) 存储与传输，仅展示/输入时换算
export function fenToYuan(fen) {
  return ((fen || 0) / 100).toFixed(2);
}

// 用户输入的元（字符串或数字）转成分，四舍五入避免浮点误差
export function yuanToFen(yuan) {
  const n = Number(yuan);
  if (!isFinite(n)) return 0;
  return Math.round(n * 100);
}

// "2026-05-26" -> 当天，本地时区
export function todayStr() {
  const d = new Date();
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 取 happenedAt 的「YYYY-MM」用于按月聚合
export function monthOf(dateStr) {
  return (dateStr || '').slice(0, 7);
}

export function thisMonth() {
  return todayStr().slice(0, 7);
}
