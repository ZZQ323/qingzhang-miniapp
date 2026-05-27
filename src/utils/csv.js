import { fenToYuan } from './format';

// 把记录列表转成 CSV 文本（金额展示为元）。断网也能用，纯本地数据。
export function recordsToCsv(records) {
  const header = ['日期', '类型', '类别', '金额(元)', '备注', '账户', '收支人员', '记账人'];
  const lines = [header.join(',')];
  const esc = (v) => {
    const s = String(v == null ? '' : v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  records
    .slice()
    .sort((a, b) => (b.happenedAt || '').localeCompare(a.happenedAt || ''))
    .forEach((r) => {
      lines.push([
        r.happenedAt || '',
        r.type === 2 ? '收入' : '支出',
        r.category || '',
        fenToYuan(r.amount),
        r.note || '',
        r.account || '',
        r.counterparty || '',
        r.recorderName || ''
      ].map(esc).join(','));
    });
  return lines.join('\n');
}

// 跨端导出：H5 触发下载；小程序写临时文件后打开/分享；并统一复制到剪贴板兜底。
export function exportCsv(records, filename = 'qingzhang.csv') {
  const csv = '﻿' + recordsToCsv(records); // BOM，Excel 正确识别 UTF-8

  // #ifdef H5
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return;
  // #endif

  // #ifndef H5
  const fs = uni.getFileSystemManager();
  const path = `${uni.env.USER_DATA_PATH}/${filename}`;
  fs.writeFile({
    filePath: path,
    data: csv,
    encoding: 'utf8',
    success: () => {
      uni.openDocument({
        filePath: path,
        showMenu: true, // 允许右上角转发/保存
        fail: () => {
          uni.setClipboardData({ data: csv });
          uni.showToast({ title: '已复制到剪贴板', icon: 'none' });
        }
      });
    },
    fail: () => {
      uni.setClipboardData({ data: csv });
      uni.showToast({ title: '已复制到剪贴板', icon: 'none' });
    }
  });
  // #endif
}
