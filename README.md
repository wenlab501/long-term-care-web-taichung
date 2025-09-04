# 長照韌性社區 - 台中市長期照護資源供需空間配置分析系統

## 專案概述

這是一個基於 Vue.js 3 +
Leaflet.js 開發的互動式地理資訊系統，專門用於分析台中市長期照護資源的供需配置和空間分佈。系統整合了服務人員軌跡、服務點位、服務項目等多維度數據，提供直觀的視覺化分析工具。

## 🌟 主要功能

### 1. 互動式地圖展示

- **多圖層管理**：支援同時顯示多個數據圖層
- **動態顏色配置**：使用 D3.js
  category20b 色彩方案，提供 20 種視覺上易於區分的顏色
- **響應式設計**：支援桌面版和行動裝置

### 2. 服務人員軌跡分析

- **路線視覺化**：顯示服務人員的移動路徑
- **服務點標記**：根據服務時間動態調整圓圈大小（1小時 = 25px×25px×π 的面積比例）
- **時間序列分析**：按日期篩選和分析服務記錄

### 3. 資料互動功能

- **Tooltip**：滑鼠懸停時顯示完整的個案詳細資訊
- **詳細面板**：點擊後在右側面板顯示服務項目清單
- **表格檢視**：底部面板提供數據的表格形式展示

### 4. 空間分析工具

- **距離分析**：計算服務點之間的距離
- **等時圈分析**：分析特定時間範圍內的服務覆蓋區域
- **路徑規劃**：最佳化服務路線規劃

## 🔧 技術架構

### 前端技術棧

- **Vue.js 3**：使用 Composition API 構建響應式用戶介面
- **Leaflet.js**：地圖展示和地理資訊操作
- **Pinia**：狀態管理，處理圖層數據和用戶選擇
- **Bootstrap 5**：響應式 UI 組件庫
- **D3.js 色彩方案**：category20b 色彩配置

### 項目結構

```
src/
├── assets/          # 靜態資源
│   ├── css/         # 樣式文件
│   │   ├── variables.css    # CSS 變數定義（顏色、字體等）
│   │   └── common.css       # 通用樣式
│   └── logo.png     # 應用程式圖標
├── components/      # 可重用組件
│   ├── DatePicker.vue       # 日期選擇器
│   ├── DetailItem.vue       # 詳細資訊展示組件
│   └── LoadingOverlay.vue   # 載入遮罩
├── data/           # 範例數據文件
├── router/         # Vue Router 路由配置
├── stores/         # Pinia 狀態管理
│   ├── dataStore.js         # 主要數據狀態管理
│   ├── defineStore.js       # 地圖設定狀態管理
│   └── mapStore.js          # 地圖操作狀態管理
├── tabs/           # 頁籤組件
│   ├── DashboardTab.vue     # 儀表板頁籤
│   ├── DataTableTab.vue     # 數據表格頁籤
│   ├── LayersTab.vue        # 圖層管理頁籤
│   ├── MapTab.vue           # 地圖展示頁籤
│   └── PropertiesTab.vue    # 屬性面板頁籤
├── utils/          # 工具函數
│   ├── dataProcessor.js     # 數據處理和載入
│   └── utils.js             # 通用工具函數
├── views/          # 頁面組件
│   ├── HomeView.vue         # 主頁面
│   ├── LeftView.vue         # 左側面板
│   ├── MiddleView.vue       # 中間面板
│   ├── RightView.vue        # 右側面板
│   ├── UpperView.vue        # 上方面板
│   ├── BottomView.vue       # 下方面板
│   └── ResponsiveLowerView.vue  # 響應式下方面板
├── App.vue         # 根組件
└── main.js         # 應用程式入口點
```

## 📊 數據結構

### 服務記錄數據格式

```json
{
  "服務人員身分證": "Z067499219",
  "服務日期(請輸入7碼)": 1140701,
  "hour_start": 9,
  "min_start": 26,
  "hour_end": 16,
  "min_end": 4,
  "time_total": 398,
  "route": {
    "type": "FeatureCollection",
    "features": [...]
  },
  "service_items": [
    {
      "row_id": 2309,
      "身分證字號": "Y526809406",
      "服務項目代碼": "BA07",
      "服務類別\n1.補助\n2.自費": 1,
      "數量\n僅整數": 1,
      "單價": 325,
      "hour_start": 9,
      "min_start": 26,
      "hour_end": 10,
      "min_end": 3,
      "time_total": 37
    }
  ],
  "datail": {
    "編號": 141,
    "姓名": "周詠晴",
    "性別": "男性",
    "個案戶籍縣市": "臺中市",
    "鄉鎮區": "大肚區",
    "里別": "大東里",
    "個案居住地址": "臺中市大肚區大東里005鄰沙田路二段470巷43號",
    "Lat": 24.1477078,
    "Lon": 120.547411
  }
}
```

## 🎨 視覺設計

### 顏色系統

系統使用 D3.js category20b 色彩方案，提供 20 種不同的顏色：

**藍色系列**：

- `#3182bd` - 深藍
- `#6baed6` - 中藍
- `#9ecae1` - 淺藍
- `#c6dbef` - 極淺藍

**橘色系列**：

- `#e6550d` - 深橘
- `#fd8d3c` - 中橘
- `#fdae6b` - 淺橘
- `#fdd0a2` - 極淺橘

**綠色系列**：

- `#31a354` - 深綠
- `#74c476` - 中綠
- `#a1d99b` - 淺綠
- `#c7e9c0` - 極淺綠

**紫色系列**：

- `#756bb1` - 深紫
- `#9e9ac8` - 中紫
- `#bcbddc` - 淺紫
- `#dadaeb` - 極淺紫

**灰色系列**：

- `#636363` - 深灰
- `#969696` - 中灰
- `#bdbdbd` - 淺灰
- `#d9d9d9` - 極淺灰

### 服務點視覺表示

- **圓圈大小**：根據服務總時間計算，面積公式為 `時間(小時) × (25px)² × π`
- **字體大小**：統一使用 12px，確保可讀性
- **顏色分配**：使用確定性哈希算法，確保相同服務人員在不同日期使用相同顏色

## 🚀 安裝與運行

### 系統需求

- Node.js 16.0 或更高版本
- npm 8.0 或更高版本

### 安裝步驟

```bash
# 1. 克隆專案
git clone [repository-url]
cd long-term-care-web-taichung

# 2. 安裝相依套件
npm install

# 3. 開發模式運行
npm run serve

# 4. 建置生產版本
npm run build
```

### 開發伺服器

```bash
npm run serve
```

應用程式將在 `http://localhost:8080` 運行

### 建置部署

```bash
npm run build
```

建置後的檔案將在 `dist/` 目錄中

## 💡 使用指南

### 基本操作

1. **載入數據**：在左側面板選擇要顯示的圖層
2. **地圖導航**：使用滑鼠拖拽平移，滾輪縮放
3. **查看詳情**：
   - 滑鼠懸停：顯示 tooltip 快速預覽
   - 點擊服務點：在右側面板顯示詳細的服務項目
   - 底部表格：瀏覽所有數據記錄

### 進階功能

1. **日期篩選**：在圖層名稱中包含日期資訊進行自動篩選
2. **多圖層分析**：同時顯示多個服務人員的資料進行比較
3. **空間分析**：使用分析工具計算距離和等時圈

### 響應式布局

- **桌面版**：三欄式布局（左側控制、中間地圖、右側詳情、底部表格）
- **平板/手機版**：上下堆疊布局，支援頁籤切換

## 🔍 核心組件說明

### MapTab.vue

地圖展示的核心組件，負責：

- Leaflet 地圖初始化和管理
- GeoJSON 圖層渲染
- 服務點的視覺化（大小根據時間計算）
- 用戶互動處理（點擊、懸停）
- Tooltip 和 Popup 的顯示

### DataStore.js

主要的狀態管理中心，管理：

- 圖層數據的載入和儲存
- 用戶選擇狀態
- 顏色映射關係
- 服務項目數據處理

### DataProcessor.js

數據處理核心，負責：

- JSON 數據載入和解析
- GeoJSON 格式轉換
- 顏色分配算法
- 空間數據處理

## 🎯 特色功能詳解

### 1. 動態圓圈大小計算

服務點的圓圈大小根據服務時間動態計算：

```javascript
// 面積計算公式：1小時 = 25px × 25px × π
const timeInHours = timeTotal / 60;
const areaPerHour = Math.PI * 25 * 25;
const totalArea = timeInHours * areaPerHour;
const radius = Math.sqrt(totalArea / Math.PI);
const size = Math.max(radius * 2, 20); // 最小直徑 20px
```

### 2. 確定性顏色分配

使用哈希算法確保相同服務人員總是使用相同顏色：

```javascript
function getColorForServiceProvider(serviceProviderId) {
  let hash = 0;
  for (let i = 0; i < serviceProviderId.length; i++) {
    hash = (hash << 5) - hash + serviceProviderId.charCodeAt(i);
    hash = hash & hash;
  }
  const colorIndex = Math.abs(hash) % CATEGORY20B_COLORS.length;
  return CATEGORY20B_COLORS[colorIndex];
}
```

### 3. 響應式布局系統

根據螢幕大小自動調整布局：

```javascript
const isDesktop = computed(() => window.innerWidth >= 768);
const isMobile = computed(() => window.innerWidth < 768);
```

## 🔧 自定義與擴展

### 添加新的顏色主題

在 `src/assets/css/variables.css` 中添加新的顏色變數：

```css
--my-color-custom-1: #yourcolor;
--my-color-custom-1-hover: #yourcolorhover;
```

### 添加新的數據源

1. 在 `src/utils/dataProcessor.js` 中添加新的載入函數
2. 在 `src/stores/dataStore.js` 中註冊新的數據類型
3. 更新相關的 UI 組件以支援新數據

### 自定義地圖樣式

在 `src/stores/defineStore.js` 中修改底圖配置：

```javascript
basemaps: [
  { name: '自定義地圖', value: 'custom', url: 'your-tile-server-url' },
];
```

## 📝 API 文檔

### 主要方法

#### dataStore.getAllLayers()

獲取所有可用圖層的清單

#### dataStore.setSelectedFeature(feature)

設定當前選中的地圖要素

#### dataStore.createServiceItemsData(feature, layer)

創建服務項目數據結構

## 🐛 故障排除

### 常見問題

1. **地圖無法載入**：檢查網路連線和底圖服務是否可用
2. **數據不顯示**：確認 JSON 數據格式正確且路徑可訪問
3. **顏色不一致**：清除瀏覽器快取，重新載入應用程式

### 除錯工具

- 瀏覽器開發者工具的 Console 面板會顯示詳細的除錯資訊
- 在地圖操作時會輸出詳細的日誌資訊

## 📈 效能最佳化

### 建議設定

- 大數據集建議使用分頁載入
- 啟用圖層快取以提升渲染效能
- 使用 Web Workers 處理複雜的空間計算

## 🤝 貢獻指南

### 開發流程

1. Fork 此專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 編碼規範

- 使用 ESLint 進行程式碼檢查
- 遵循 Vue.js 官方風格指南
- 添加適當的註解和文檔

## 📄 授權資訊

此專案採用 MIT 授權條款 - 詳見 LICENSE 檔案

## 👥 開發團隊

- **專案負責人**：[姓名]
- **前端開發**：[姓名]
- **數據分析**：[姓名]
- **UI/UX 設計**：[姓名]

## 📞 聯絡資訊

如有問題或建議，請聯絡：

- Email: [email@example.com]
- 專案網址: [project-url]
- 問題回報: [issues-url]

## 🔄 版本歷史

### v1.0.0 (2024-01-01)

- 初始版本發布
- 基本地圖功能
- 服務記錄視覺化

### v1.1.0 (2024-02-01)

- 添加響應式設計
- 新增空間分析工具
- 效能最佳化

---

**更新日期**: 2024-02-01 **文檔版本**: 1.1.0
