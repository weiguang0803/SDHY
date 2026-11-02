/**
 * 格式化时间为本地时区显示
 * @param {string|Date} dateStr ISO 或时间字符串
 * @param {boolean} includeSeconds 是否包含秒
 * @returns {string} 格式化后的本地时间字符串 YYYY-MM-DD HH:mm[:ss]
 */
export const formatDateTime = (dateStr, includeSeconds = false) => {
  if (!dateStr) return '-'
  
  try {
    // 兼容后端返回的标准 ISO 字符串
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hour = String(d.getHours()).padStart(2, '0')
      const minute = String(d.getMinutes()).padStart(2, '0')
      const second = String(d.getSeconds()).padStart(2, '0')
      return includeSeconds 
        ? `${year}-${month}-${day} ${hour}:${minute}:${second}`
        : `${year}-${month}-${day} ${hour}:${minute}`
    }
  } catch (e) {
    // Fallback
  }
  
  return dateStr.replace('T', ' ').substring(0, includeSeconds ? 19 : 16)
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  } catch (e) {}
  return dateStr.substring(0, 10)
}
