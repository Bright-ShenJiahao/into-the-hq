// 小工具：内容文件共用
export const V = (u, a, b) => (u ? b : a);           // 升级前 / 升级后的数值
export const pick = (r, a) => a[Math.floor(r() * a.length)];
