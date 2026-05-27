// 类别预设。type: 1 支出, 2 收入
export const EXPENSE_CATEGORIES = [
  '餐饮', '交通', '购物', '居家', '娱乐', '医疗', '学习', '人情', '其他'
];

export const INCOME_CATEGORIES = [
  '工资', '兼职', '理财', '红包', '退款', '其他'
];

export function categoriesOf(type) {
  return type === 2 ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}
