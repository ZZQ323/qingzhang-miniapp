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

const p2 = (x) => String(x).padStart(2, '0');

// 上个月的 "YYYY-MM"
export function prevMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}`;
}

// 某个 "YYYY-MM" 的首日与末日（含），返回 [start, end] 的 YYYY-MM-DD
export function monthRange(ym) {
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return [`${y}-${p2(m)}-01`, `${y}-${p2(m)}-${p2(last)}`];
}

// 最近 n 个月（含本月）的 "YYYY-MM" 列表，从旧到新
export function recentMonths(n) {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const t = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${t.getFullYear()}-${p2(t.getMonth() + 1)}`);
  }
  return out;
}

// happenedAt(YYYY-MM-DD) 是否落在 [start,end] 闭区间内
export function inRange(dateStr, start, end) {
  if (!dateStr) return false;
  return dateStr >= start && dateStr <= end;
}
