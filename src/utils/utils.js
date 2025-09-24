/**
 * =============================================================================
 * 🎨 圖標配置系統 (Icon Configuration System)
 * =============================================================================
 *
 * 統一管理應用程式中使用的所有圖標，支援多語言和 FontAwesome 圖標庫
 *
 * 特性：
 * - 🌍 多語言支援 (中文/英文)
 * - 🎯 類型安全的圖標定義
 * - 📦 統一的圖標管理
 * - 🔍 圖標查詢和驗證
 *
 * @author 長期照護資源分析系統團隊
 * @version 2.0.0
 */

/**
 * @typedef {Object} IconDefinition
 * @property {string} zh - 中文顯示名稱
 * @property {string} en - 英文顯示名稱
 * @property {string} icon - FontAwesome CSS 類名
 * @property {string} [category] - 圖標分類（可選）
 * @property {string} [description] - 圖標描述（可選）
 */

/**
 * 圖標配置對象
 * 按功能分類組織，便於維護和查找
 */
export const ICONS = Object.freeze({
  // =============================================================================
  // 🔧 基本操作圖標 (Basic Action Icons)
  // =============================================================================
  add: {
    zh: '新增',
    en: 'Add',
    icon: 'fas fa-plus',
    category: 'action',
    description: '新增項目或資料',
  },
  edit: {
    zh: '編輯',
    en: 'Edit',
    icon: 'fas fa-edit',
    category: 'action',
    description: '編輯現有項目',
  },
  delete: {
    zh: '刪除',
    en: 'Delete',
    icon: 'fas fa-trash',
    category: 'action',
    description: '刪除項目',
  },
  save: {
    zh: '儲存',
    en: 'Save',
    icon: 'fas fa-save',
    category: 'action',
    description: '儲存變更',
  },
  cancel: {
    zh: '取消',
    en: 'Cancel',
    icon: 'fas fa-times',
    category: 'action',
    description: '取消操作',
  },
  confirm: {
    zh: '確認',
    en: 'Confirm',
    icon: 'fas fa-check',
    category: 'action',
    description: '確認操作',
  },
  search: {
    zh: '搜尋',
    en: 'Search',
    icon: 'fas fa-search',
    category: 'action',
    description: '搜尋功能',
  },
  filter: {
    zh: '篩選',
    en: 'Filter',
    icon: 'fas fa-filter',
    category: 'action',
    description: '資料篩選',
  },
  sort: {
    zh: '排序',
    en: 'Sort',
    icon: 'fas fa-sort',
    category: 'action',
    description: '資料排序',
  },
  refresh: {
    zh: '重新整理',
    en: 'Refresh',
    icon: 'fas fa-sync-alt',
    category: 'action',
    description: '重新載入資料',
  },

  // =============================================================================
  // 📁 檔案操作圖標 (File Operation Icons)
  // =============================================================================
  upload: {
    zh: '上傳',
    en: 'Upload',
    icon: 'fas fa-upload',
    category: 'file',
    description: '上傳檔案',
  },
  download: {
    zh: '下載',
    en: 'Download',
    icon: 'fas fa-download',
    category: 'file',
    description: '下載檔案',
  },
  import: {
    zh: '匯入',
    en: 'Import',
    icon: 'fas fa-file-import',
    category: 'file',
    description: '匯入資料',
  },
  export: {
    zh: '匯出',
    en: 'Export',
    icon: 'fas fa-file-export',
    category: 'file',
    description: '匯出資料',
  },
  folder: {
    zh: '資料夾',
    en: 'Folder',
    icon: 'fas fa-folder',
    category: 'file',
    description: '檔案資料夾',
  },
  folder_open: {
    zh: '開啟資料夾',
    en: 'Open Folder',
    icon: 'fas fa-folder-open',
    category: 'file',
    description: '開啟的資料夾',
  },
  file: {
    zh: '檔案',
    en: 'File',
    icon: 'fas fa-file',
    category: 'file',
    description: '一般檔案',
  },

  // =============================================================================
  // 🧭 導航圖標 (Navigation Icons)
  // =============================================================================
  home: {
    zh: '首頁',
    en: 'Home',
    icon: 'fas fa-home',
    category: 'navigation',
    description: '返回首頁',
  },
  back: {
    zh: '返回',
    en: 'Back',
    icon: 'fas fa-arrow-left',
    category: 'navigation',
    description: '返回上一頁',
  },
  forward: {
    zh: '前進',
    en: 'Forward',
    icon: 'fas fa-arrow-right',
    category: 'navigation',
    description: '前往下一頁',
  },
  up: {
    zh: '向上',
    en: 'Up',
    icon: 'fas fa-arrow-up',
    category: 'navigation',
    description: '向上移動',
  },
  down: {
    zh: '向下',
    en: 'Down',
    icon: 'fas fa-arrow-down',
    category: 'navigation',
    description: '向下移動',
  },

  // =============================================================================
  // ⚠️ 狀態圖標 (Status Icons)
  // =============================================================================
  success: {
    zh: '成功',
    en: 'Success',
    icon: 'fas fa-check-circle',
    category: 'status',
    description: '操作成功',
  },
  error: {
    zh: '錯誤',
    en: 'Error',
    icon: 'fas fa-exclamation-circle',
    category: 'status',
    description: '發生錯誤',
  },
  warning: {
    zh: '警告',
    en: 'Warning',
    icon: 'fas fa-exclamation-triangle',
    category: 'status',
    description: '警告訊息',
  },
  info: {
    zh: '資訊',
    en: 'Info',
    icon: 'fas fa-info-circle',
    category: 'status',
    description: '資訊提示',
  },
  loading: {
    zh: '載入中',
    en: 'Loading',
    icon: 'fas fa-spinner',
    category: 'status',
    description: '載入狀態',
  },

  // =============================================================================
  // 👁️ 視圖控制圖標 (View Control Icons)
  // =============================================================================
  view: {
    zh: '檢視',
    en: 'View',
    icon: 'fas fa-eye',
    category: 'view',
    description: '顯示項目',
  },
  hide: {
    zh: '隱藏',
    en: 'Hide',
    icon: 'fas fa-eye-slash',
    category: 'view',
    description: '隱藏項目',
  },
  expand: {
    zh: '展開',
    en: 'Expand',
    icon: 'fas fa-expand',
    category: 'view',
    description: '展開視圖',
  },
  collapse: {
    zh: '收縮',
    en: 'Collapse',
    icon: 'fas fa-compress',
    category: 'view',
    description: '收縮視圖',
  },

  // =============================================================================
  // 📂 圖層和資料相關圖標 (Layer & Data Icons)
  // =============================================================================
  layer: {
    zh: '圖層',
    en: 'Layer',
    icon: 'fas fa-layer-group',
    category: 'data',
    description: '地圖圖層',
  },
  visible: {
    zh: '可見',
    en: 'Visible',
    icon: 'fas fa-eye',
    category: 'data',
    description: '可見狀態',
  },
  hidden: {
    zh: '隱藏',
    en: 'Hidden',
    icon: 'fas fa-eye-slash',
    category: 'data',
    description: '隱藏狀態',
  },
  data: {
    zh: '資料',
    en: 'Data',
    icon: 'fas fa-database',
    category: 'data',
    description: '資料庫資料',
  },
  table: {
    zh: '表格',
    en: 'Table',
    icon: 'fas fa-table',
    category: 'data',
    description: '資料表格',
  },

  // =============================================================================
  // 🗺️ 地圖相關圖標 (Map Icons)
  // =============================================================================
  map: {
    zh: '地圖',
    en: 'Map',
    icon: 'fas fa-map',
    category: 'map',
    description: '地圖視圖',
  },
  location: {
    zh: '位置',
    en: 'Location',
    icon: 'fas fa-map-marker-alt',
    category: 'map',
    description: '地理位置',
  },
  zoom_in: {
    zh: '放大',
    en: 'Zoom In',
    icon: 'fas fa-search-plus',
    category: 'map',
    description: '放大地圖',
  },
  zoom_out: {
    zh: '縮小',
    en: 'Zoom Out',
    icon: 'fas fa-search-minus',
    category: 'map',
    description: '縮小地圖',
  },
  center: {
    zh: '居中',
    en: 'Center',
    icon: 'fas fa-crosshairs',
    category: 'map',
    description: '地圖居中',
  },

  // =============================================================================
  // 📊 分析和統計圖標 (Analysis & Statistics Icons)
  // =============================================================================
  chart: {
    zh: '圖表',
    en: 'Chart',
    icon: 'fas fa-chart-bar',
    category: 'analysis',
    description: '圖表展示',
  },
  statistics: {
    zh: '統計',
    en: 'Statistics',
    icon: 'fas fa-chart-line',
    category: 'analysis',
    description: '統計分析',
  },
  dashboard: {
    zh: '儀表板',
    en: 'Dashboard',
    icon: 'fas fa-tachometer-alt',
    category: 'analysis',
    description: '資料儀表板',
  },
  analysis: {
    zh: '分析',
    en: 'Analysis',
    icon: 'fas fa-analytics',
    category: 'analysis',
    description: '資料分析',
  },

  // =============================================================================
  // 🏥 醫療相關圖標 (Medical Icons)
  // =============================================================================
  hospital: {
    zh: '醫院',
    en: 'Hospital',
    icon: 'fas fa-hospital',
    category: 'medical',
    description: '醫院機構',
  },
  clinic: {
    zh: '診所',
    en: 'Clinic',
    icon: 'fas fa-clinic-medical',
    category: 'medical',
    description: '診所機構',
  },
  pharmacy: {
    zh: '藥局',
    en: 'Pharmacy',
    icon: 'fas fa-pills',
    category: 'medical',
    description: '藥局機構',
  },
  elderly_care: {
    zh: '長照',
    en: 'Elderly Care',
    icon: 'fas fa-hands-helping',
    category: 'medical',
    description: '長期照護',
  },
  medical: {
    zh: '醫療',
    en: 'Medical',
    icon: 'fas fa-user-md',
    category: 'medical',
    description: '醫療服務',
  },

  // =============================================================================
  // 👥 人口和社會圖標 (Population & Social Icons)
  // =============================================================================
  population: {
    zh: '人口',
    en: 'Population',
    icon: 'fas fa-users',
    category: 'social',
    description: '人口資料',
  },
  demographics: {
    zh: '人口統計',
    en: 'Demographics',
    icon: 'fas fa-user-friends',
    category: 'social',
    description: '人口統計資料',
  },
  community: {
    zh: '社區',
    en: 'Community',
    icon: 'fas fa-home',
    category: 'social',
    description: '社區資訊',
  },

  // =============================================================================
  // 💰 經濟相關圖標 (Economic Icons)
  // =============================================================================
  income: {
    zh: '收入',
    en: 'Income',
    icon: 'fas fa-dollar-sign',
    category: 'economic',
    description: '收入資料',
  },
  tax: {
    zh: '稅收',
    en: 'Tax',
    icon: 'fas fa-file-invoice-dollar',
    category: 'economic',
    description: '稅收資料',
  },

  // =============================================================================
  // 🎛️ 操作和控制圖標 (Control & Action Icons)
  // =============================================================================
  drag: {
    zh: '拖拉',
    en: 'Drag',
    icon: 'fa-solid fa-grip-lines-vertical',
    category: 'control',
    description: '拖拽控制',
  },
  move_up: {
    zh: '上移',
    en: 'Move Up',
    icon: 'fas fa-arrow-up',
    category: 'control',
    description: '向上移動',
  },
  move_down: {
    zh: '下移',
    en: 'Move Down',
    icon: 'fas fa-arrow-down',
    category: 'control',
    description: '向下移動',
  },
  reset: {
    zh: '重設',
    en: 'Reset',
    icon: 'fas fa-undo',
    category: 'control',
    description: '重設設定',
  },

  // =============================================================================
  // ⚙️ 設定和配置圖標 (Settings & Configuration Icons)
  // =============================================================================
  settings: {
    zh: '設定',
    en: 'Settings',
    icon: 'fas fa-cog',
    category: 'settings',
    description: '系統設定',
  },
  sort_up: {
    zh: '升序',
    en: 'Sort Ascending',
    icon: 'fas fa-sort-up',
    category: 'settings',
    description: '升序排列',
  },
  sort_down: {
    zh: '降序',
    en: 'Sort Descending',
    icon: 'fas fa-sort-down',
    category: 'settings',
    description: '降序排列',
  },

  // =============================================================================
  // 📱 介面元素圖標 (UI Element Icons)
  // =============================================================================
  menu: {
    zh: '選單',
    en: 'Menu',
    icon: 'fas fa-bars',
    category: 'ui',
    description: '選單按鈕',
  },
  close: {
    zh: '關閉',
    en: 'Close',
    icon: 'fas fa-times',
    category: 'ui',
    description: '關閉按鈕',
  },
});

// =================================================================================
// 🛠️ 圖標系統輔助函數 (Icon System Helper Functions)
// =================================================================================

/**
 * 根據鍵名獲取圖標資訊
 *
 * @param {string} iconKey - 圖標鍵名
 * @param {('zh'|'en')} [lang='zh'] - 語言代碼
 * @returns {{text: string, icon: string, category?: string, description?: string}} 圖標資訊物件
 *
 * @example
 * // 獲取中文圖標
 * const icon = getIcon('add', 'zh');
 * // 返回: { text: '新增', icon: 'fas fa-plus', category: 'action', description: '新增項目或資料' }
 */
export function getIcon(iconKey, lang = 'zh') {
  const iconInfo = ICONS[iconKey];

  if (!iconInfo) {
    console.warn(`🎨 找不到圖標定義: ${iconKey}`);
    return {
      text: iconKey,
      icon: 'fas fa-question-circle',
      category: 'unknown',
      description: `未定義的圖標: ${iconKey}`,
    };
  }

  return {
    text: iconInfo[lang] || iconInfo.zh,
    icon: iconInfo.icon,
    category: iconInfo.category,
    description: iconInfo.description,
  };
}

/**
 * 檢查圖標是否存在
 *
 * @param {string} iconKey - 圖標鍵名
 * @returns {boolean} 是否存在該圖標
 */
export function hasIcon(iconKey) {
  return Object.prototype.hasOwnProperty.call(ICONS, iconKey);
}

/**
 * 根據分類獲取圖標清單
 *
 * @param {string} category - 圖標分類
 * @returns {Array<{key: string, ...IconDefinition}>} 該分類的所有圖標
 */
export function getIconsByCategory(category) {
  return Object.entries(ICONS)
    .filter(([, iconInfo]) => iconInfo.category === category)
    .map(([key, iconInfo]) => ({ key, ...iconInfo }));
}

/**
 * 獲取所有圖標分類
 *
 * @returns {Array<string>} 所有分類名稱
 */
export function getIconCategories() {
  const categories = new Set();
  Object.values(ICONS).forEach((iconInfo) => {
    if (iconInfo.category) {
      categories.add(iconInfo.category);
    }
  });
  return Array.from(categories).sort();
}

// =================================================================================
// 🔧 通用工具函數 (General Utility Functions)
// =================================================================================

/**
 * 深度複製物件
 *
 * @param {any} obj - 要複製的物件
 * @returns {any} 深度複製後的物件
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item));
  }

  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }

  return obj;
}

/**
 * 防抖函數
 *
 * @param {Function} func - 要執行的函數
 * @param {number} wait - 延遲時間（毫秒）
 * @param {boolean} [immediate=false] - 是否立即執行第一次
 * @returns {Function} 防抖處理後的函數
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(this, args);
  };
}

/**
 * 節流函數
 *
 * @param {Function} func - 要執行的函數
 * @param {number} limit - 時間間隔（毫秒）
 * @returns {Function} 節流處理後的函數
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 格式化數字，添加千分位分隔符
 *
 * @param {number|string} num - 要格式化的數字
 * @param {string} [separator=','] - 分隔符
 * @returns {string} 格式化後的數字字串
 */
export function formatNumber(num, separator = ',') {
  if (num === null || num === undefined || num === '') {
    return '';
  }

  const numStr = String(num);
  const [integerPart, decimalPart] = numStr.split('.');

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

/**
 * 將數字轉換為百分比格式
 *
 * @param {number} num - 數值 (0-1 或 0-100)
 * @param {number} [decimals=1] - 小數位數
 * @param {boolean} [isPercent=false] - 輸入是否已經是百分比格式
 * @returns {string} 百分比字串
 */
export function formatPercentage(num, decimals = 1, isPercent = false) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0%';
  }

  const value = isPercent ? num : num * 100;
  return `${value.toFixed(decimals)}%`;
}

// =================================================================================
// 📅 日期時間工具函數 (Date & Time Utilities)
// =================================================================================

/**
 * 格式化日期
 *
 * @param {Date|string|number} date - 日期物件、字串或時間戳
 * @param {string} [format='YYYY-MM-DD'] - 日期格式
 * @returns {string} 格式化後的日期字串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 計算兩個日期間的天數差
 *
 * @param {Date|string} startDate - 開始日期
 * @param {Date|string} endDate - 結束日期
 * @returns {number} 天數差
 */
export function daysDifference(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

// =================================================================================
// 🎨 UI 工具函數 (UI Utilities)
// =================================================================================

/**
 * 生成隨機 ID
 *
 * @param {string} [prefix=''] - ID 前綴
 * @param {number} [length=8] - 隨機部分長度
 * @returns {string} 隨機 ID
 */
export function generateId(prefix = '', length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + result;
}

/**
 * 安全地解析 JSON
 *
 * @param {string} jsonString - JSON 字串
 * @param {any} [defaultValue=null] - 解析失敗時的預設值
 * @returns {any} 解析結果或預設值
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('🔧 JSON 解析失敗:', error.message);
    return defaultValue;
  }
}

/**
 * 將物件轉換為 URL 參數字串
 *
 * @param {Object} params - 參數物件
 * @returns {string} URL 參數字串
 */
export function objectToUrlParams(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

/**
 * 檢查值是否為空（null, undefined, '', [], {}）
 *
 * @param {any} value - 要檢查的值
 * @returns {boolean} 是否為空
 */
export function isEmpty(value) {
  if (value === null || value === undefined || value === '') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }

  return false;
}

// =================================================================================
// 📍 地理空間工具函數 (Geospatial Utilities)
// =================================================================================

/**
 * 使用 Haversine 公式計算兩點間距離
 *
 * @param {number} lat1 - 第一個點的緯度
 * @param {number} lng1 - 第一個點的經度
 * @param {number} lat2 - 第二個點的緯度
 * @param {number} lng2 - 第二個點的經度
 * @returns {number} 距離（公尺）
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 地球半徑（公尺）
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 角度轉弧度
 *
 * @param {number} degrees - 角度
 * @returns {number} 弧度
 */
export function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * 弧度轉角度
 *
 * @param {number} radians - 弧度
 * @returns {number} 角度
 */
export function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * 格式化距離顯示
 *
 * @param {number} meters - 距離（公尺）
 * @param {number} [decimals=1] - 小數位數
 * @returns {string} 格式化的距離字串
 */
export function formatDistance(meters, decimals = 1) {
  if (meters < 1000) {
    return `${Math.round(meters)} 公尺`;
  } else {
    return `${(meters / 1000).toFixed(decimals)} 公里`;
  }
}
