// 类别预设。type: 1 支出, 2 收入
export const EXPENSE_CATEGORIES = [
  '餐饮', '交通', '购物', '居家', '娱乐', '医疗', '学习', '人情'
];

export const INCOME_CATEGORIES = [
  '工资', '兼职', '理财', '红包', '退款'
];

const LS_CUSTOM = 'qz_custom_cats'; // { "1": [...], "2": [...] }

function loadCustom() {
  try { return JSON.parse(uni.getStorageSync(LS_CUSTOM)) || {}; } catch { return {}; }
}

export function customOf(type) {
  return loadCustom()[type] || [];
}

// 返回：预设 + 用户自定义 + 末尾固定「其他」，去重
export function categoriesOf(type) {
  const base = type === 2 ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const merged = [...base, ...customOf(type)];
  const uniq = merged.filter((c, i) => merged.indexOf(c) === i && c !== '其他');
  return [...uniq, '其他'];
}

// 新增一个自定义类别，返回是否新增成功（重复/空返回 false）
export function addCustomCategory(type, name) {
  name = (name || '').trim();
  if (!name) return false;
  if (categoriesOf(type).includes(name)) return false;
  const all = loadCustom();
  all[type] = [...(all[type] || []), name];
  uni.setStorageSync(LS_CUSTOM, JSON.stringify(all));
  return true;
}
