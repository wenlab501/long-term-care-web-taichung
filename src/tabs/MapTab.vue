<script>
  /**
   * MapTab.vue
   *
   * Purpose:
   * - Owns the Leaflet map lifecycle, rendering, interactions, and feature layers.
   * - Binds popups for service routes and service points.
   * - For maintainability, this file is organized into clearly labeled sections.
   *
   * Notes:
   * - Do NOT change logic, UI, or data flows in this file during refactors.
   * - Add comments and section headers only to improve readability.
   * - Keep function names and signatures unchanged.
   */
  // 🔧 Vue Composition API 引入 (Vue Composition API Imports)
  import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'; // 引入 Vue 3 響應式 API
  import L from 'leaflet'; // 引入 Leaflet 地圖庫
  import 'leaflet/dist/leaflet.css'; // 引入 Leaflet 預設樣式
  import { useDataStore } from '@/stores/dataStore.js'; // 引入資料存儲
  import { useDefineStore } from '@/stores/defineStore.js'; // 引入定義存儲

  // 🔧 修復 Leaflet 預設圖標問題 (Fix Leaflet Default Icon Issues)
  import icon from 'leaflet/dist/images/marker-icon.png'; // 引入標準標記圖標
  import iconShadow from 'leaflet/dist/images/marker-shadow.png'; // 引入標記陰影圖標
  import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'; // 引入高解析度標記圖標

  // 刪除預設圖標 URL 獲取方法，避免 webpack 打包問題
  delete L.Icon.Default.prototype._getIconUrl;
  // 重新設定 Leaflet 預設圖標配置
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetina, // 高解析度圖標 URL
    iconUrl: icon, // 標準圖標 URL
    shadowUrl: iconShadow, // 陰影圖標 URL
  });

  export default {
    name: 'MapTab', // 組件名稱

    // 🔧 組件屬性定義 (Component Props Definition)
    props: {
      zoomLevel: { type: Number, default: 11 }, // 地圖縮放等級，預設為 11
      isPanelDragging: { type: Boolean, default: false }, // 面板是否正在拖曳，預設為 false
    },

    // 📡 組件事件定義 (Component Events Definition)
    emits: [
      'update:zoomLevel',
      'update:currentCoords',
      'update:activeMarkers',
      'show-service-point-detail',
    ],

    // 🔧 組件設定函數 (Component Setup Function)
    setup(props, { emit }) {
      // 📦 資料存儲實例 (Data Store Instance)
      const dataStore = useDataStore(); // 獲取 Pinia 資料存儲實例
      const mapStore = useDefineStore(); // 獲取地圖存儲實例

      // 🗺️ 地圖相關變數 (Map Related Variables)
      const mapContainer = ref(null); // 地圖容器 DOM 元素引用
      let mapInstance = null; // 地圖實例，使用普通變數而非 ref 避免響應式開銷
      let currentTileLayer = null; // 當前底圖圖層實例
      let layerGroups = {}; // 存放所有圖層群組的物件
      // 注意：路徑規劃和路徑優化點擊模式相關變數已移除

      // 🖱️ 右鍵菜單相關變數 (Context Menu Related Variables)
      const contextMenu = ref(null); // 右鍵菜單 DOM 引用
      const showContextMenu = ref(false); // 是否顯示右鍵菜單
      const contextMenuPosition = ref({ x: 0, y: 0 }); // 右鍵菜單位置
      const selectedAnalysisFeature = ref(null); // 選中的分析要素

      // 🎛️ 地圖控制狀態 (Map Control States)
      const isMapReady = ref(false); // 地圖是否已準備就緒的狀態標記
      /** 🗺️ 動態地圖容器 ID（避免多實例衝突） */
      const mapContainerId = ref(`leaflet-map-${Math.random().toString(36).substr(2, 9)}`);

      // 🎯 地圖視圖狀態管理 (Map View State Management)
      let previousViewState = null; // 保存高亮前的視圖狀態

      // 移除高亮相關邏輯，因為現在使用 time_total 來決定大小

      // =============================================================
      // Popup Content Helpers
      // =============================================================
      // 🎯 創建簡化的 popup 內容函數，只顯示案號、姓名、居住地址
      const createServicePointContent = (props) => {
        // 處理姓名顯示
        const name = props.姓名 || props.name || '';

        return `
          <div>
            <div class="pb-2">
              <div class="my-title-xs-gray pb-1">案號</div>
              <div class="my-content-sm-black pb-1">${props.案號 || props.id}</div>
            </div>
            <div class="pb-2">
              <div class="my-title-xs-gray pb-1">姓名</div>
              <div class="my-content-sm-black pb-1"><span>${name}</span></div>
            </div>
            <div class="pb-2">
              <div class="my-title-xs-gray pb-1">居住地址</div>
              <div class="my-content-sm-black pb-1">${props.居住地址 || props.address}</div>
            </div>
          </div>`;
      };

      // =============================================================
      // Computed Flags & Basic Utilities
      // =============================================================
      // 📊 計算屬性：檢查是否有任何圖層可見 (Computed Property: Check if Any Layer is Visible)
      const isAnyLayerVisible = computed(
        () => dataStore.getAllLayers().some((l) => l.visible && l.geoJsonData) // 檢查所有圖層中是否有可見且有資料的圖層
      );

      // 🏗️ 創建地圖實例函數 (Create Map Instance Function)
      const createMap = () => {
        // 檢查地圖容器是否存在
        if (!mapContainer.value) {
          console.error('[MapTab] 地圖容器不存在，無法創建地圖');
          return false;
        }

        // 檢查是否已經有地圖實例存在，避免重複創建
        if (mapInstance) {
          console.warn('[MapTab] 地圖實例已存在，跳過創建');
          return true;
        }

        // 檢查容器尺寸是否有效
        const rect = mapContainer.value.getBoundingClientRect(); // 獲取容器的邊界矩形

        // 如果寬度或高度為零，無法創建有效的地圖
        if (rect.width === 0 || rect.height === 0) {
          console.error('[MapTab] 容器尺寸無效，無法創建地圖', {
            width: rect.width,
            height: rect.height,
          });
          return false;
        }

        // 檢查 Leaflet 是否可用
        if (typeof L === 'undefined') {
          console.error('[MapTab] Leaflet 庫未載入');
          return false;
        }

        try {
          // 創建 Leaflet 地圖實例，使用 mapStore 中保存的視圖狀態
          mapInstance = L.map(mapContainer.value, {
            center: mapStore.mapView.center, // 使用保存的地圖中心點
            zoom: mapStore.mapView.zoom, // 使用保存的縮放等級
            zoomControl: false, // 禁用預設縮放控制項
            attributionControl: false, // 禁用預設版權資訊控制項
            fadeAnimation: true, // 啟用淡入淡出動畫
            zoomAnimation: true, // 啟用縮放動畫
          });

          // 綁定地圖事件處理器
          mapInstance.on('zoomend', handleZoomEnd); // 縮放結束事件
          mapInstance.on('moveend', handleMoveEnd); // 移動結束事件

          // 綁定地圖點擊事件 - 點擊空白處清除選取
          mapInstance.on('click', function (e) {
            if (!e.originalEvent.target.closest('.leaflet-interactive')) {
              // 如果點擊的是地圖空白處，清除所有選取和高亮顯示
              // 刪除地圖上的任何臨時標記
              mapInstance.eachLayer((layer) => {
                if (
                  layer.options &&
                  layer.options.icon &&
                  (layer.options.icon.options?.className === 'first-service-point-marker' ||
                    layer.options.icon.options?.className === 'highlight-service-point-marker')
                ) {
                  mapInstance.removeLayer(layer);
                }
              });
              // 清除選中狀態和重設所有圖層樣式
              dataStore.setSelectedFeature(null);
              resetAllLayerStyles();
            }
          });

          // 設定 popup 面板的 z-index
          const popupPane = mapInstance.getPane('popupPane');
          if (popupPane) {
            popupPane.style.zIndex = 2200;
          }

          // 設定地圖準備就緒狀態
          isMapReady.value = true; // 標記地圖已準備就緒

          // 如果已經處於點擊模式，確保樣式正確應用
          // 注意：路徑規劃點擊模式相關代碼已移除

          return true; // 返回成功狀態
        } catch (error) {
          console.error('[MapTab] 地圖創建失敗:', error);

          // 清理失敗的地圖實例
          if (mapInstance) {
            try {
              mapInstance.remove();
            } catch (cleanupError) {
              console.warn('[MapTab] 清理失敗的地圖實例時發生錯誤:', cleanupError);
            }
            mapInstance = null;
          }

          return false; // 返回失敗狀態
        }
      };

      // 📡 地圖事件處理函數 (Map Event Handler Functions)

      // 處理縮放結束事件
      const handleZoomEnd = () => {
        if (mapInstance) {
          // 確保地圖實例存在
          const zoom = mapInstance.getZoom();
          const center = mapInstance.getCenter();
          // 保存地圖視圖狀態到 mapStore
          mapStore.setMapView([center.lat, center.lng], zoom);
          emit('update:zoomLevel', zoom); // 發送縮放等級更新事件
        }
      };

      // 處理移動結束事件
      const handleMoveEnd = () => {
        if (mapInstance) {
          // 確保地圖實例存在
          const center = mapInstance.getCenter();
          const zoom = mapInstance.getZoom();
          // 保存地圖視圖狀態到 mapStore
          mapStore.setMapView([center.lat, center.lng], zoom);
          emit('update:currentCoords', center); // 發送座標更新事件
        }
      };

      // 🗺️ 設定底圖函數 (Set Basemap Function)
      const setBasemap = () => {
        // 檢查地圖實例和準備狀態
        if (!mapInstance || !isMapReady.value) return;

        // 步驟一：無論如何，都先移除舊的底圖圖層
        // 這樣可以確保在切換到「無底圖」時，舊的地圖會被正確清除。
        if (currentTileLayer) {
          mapInstance.removeLayer(currentTileLayer);
          currentTileLayer = null;
        }

        // 步驟二：查找新的底圖設定
        const config = mapStore.basemaps.find((b) => b.value === mapStore.selectedBasemap);

        // 步驟三：只有在找到設定檔(config)且 URL 不是空值(falsy)時，才加入新的圖層
        // 由於空字串 '' 是 falsy 值，這個判斷式會自動過濾掉 url 為 '' 的情況。
        if (config && config.url) {
          currentTileLayer = L.tileLayer(config.url, { attribution: '' });
          currentTileLayer.addTo(mapInstance);
        }

        // 動態設定地圖容器背景色
        const mapContainerElement = mapContainer.value;
        if (mapContainerElement) {
          if (mapStore.selectedBasemap === 'blank') {
            // 空白地圖時設為白色背景
            mapContainerElement.style.backgroundColor = 'var(--my-color-white)';
          } else if (mapStore.selectedBasemap === 'black') {
            // 全黑底圖時設為黑色背景
            mapContainerElement.style.backgroundColor = 'var(--my-color-gray-800)';
          } else {
            // 其他底圖時設為透明，讓底圖顯示
            mapContainerElement.style.backgroundColor = 'transparent';
          }
        }
      };

      // 🎨 創建要素圖層函數 (Create Feature Layer Function)
      const createFeatureLayer = (layer) => {
        // 檢查圖層是否有資料
        if (!layer.geoJsonData) return null;

        // 解構圖層屬性
        const { layerName, colorName, type } = layer; // 獲取圖層名稱、顏色和類型
        const storeLayerId = layer.layerId; // 保存 store 圖層 ID 供事件處理使用
        const storeLayerName = layer.layerName; // 保存 store 圖層名稱

        // 創建 GeoJSON 圖層
        const geoJsonLayer = L.geoJSON(layer.geoJsonData, {
          // 點要素轉換函數
          pointToLayer: (feature, latlng) => {
            // 分析圖層的特殊處理
            if (layer.isAnalysisLayer) {
              if (feature.properties.type === 'point-analysis') {
                // 分析點：綠色加號標記
                const icon = L.divIcon({
                  html: `
                  <div class="d-flex align-items-center justify-content-center my-color-green my-font-size-sm">
                    <i class="fas fa-plus"></i>
                  </div>
                  `,
                  className: 'analysis-point-icon',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                  popupAnchor: [0, -8],
                });
                const marker = L.marker(latlng, { icon });

                return marker;
              } else if (feature.properties.type === 'circle-analysis') {
                // 分析圓圈：2公里半徑
                const circle = L.circle(latlng, {
                  radius: feature.properties.radius,
                  color: 'var(--my-color-green)',
                  weight: 1,
                  opacity: 0.8,
                  fillColor: 'var(--my-color-green)',
                  fillOpacity: 0.2,
                });

                return circle;
              }
            } else if (layer.isRoutePlanningLayer) {
              if (feature.properties.type === 'route-planning-point') {
                // 路徑規劃點：橘色數字標記
                const order = feature.properties.order || 1;
                const isCompleted = feature.properties.status === 'completed';

                // 根據完成狀態選擇不同的樣式
                const backgroundColor = isCompleted
                  ? 'var(--my-color-gray-500)'
                  : 'var(--my-color-orange)';
                const borderColor = isCompleted ? 'var(--my-color-gray-400)' : 'white';
                const textColor = isCompleted
                  ? 'var(--my-color-gray-200)'
                  : 'var(--my-color-white)';

                const icon = L.divIcon({
                  html: `
                  <div class="d-flex align-items-center justify-content-center my-font-size-xs fw-bold"
                       style="background: ${backgroundColor}; color: ${textColor}; border-radius: 50%; width: 20px; height: 20px; border: 2px solid ${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    ${order}
                  </div>
                  `,
                  className: `route-planning-point-icon ${isCompleted ? 'completed' : 'active'}`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                  popupAnchor: [0, -12],
                });
                const marker = L.marker(latlng, { icon });

                return marker;
              }
            } else if (layer.isRouteOptimizationLayer) {
              if (feature.properties.type === 'optimization-point') {
                // 路徑優化點：紫色數字標記
                const order = feature.properties.order || 1;
                const isCompleted = feature.properties.status === 'completed';

                // 根據完成狀態選擇不同的樣式
                const backgroundColor = isCompleted
                  ? 'var(--my-color-gray-500)'
                  : 'var(--my-color-purple)';
                const borderColor = isCompleted ? 'var(--my-color-gray-400)' : 'white';
                const textColor = isCompleted
                  ? 'var(--my-color-gray-200)'
                  : 'var(--my-color-white)';

                const icon = L.divIcon({
                  html: `
                  <div class="d-flex align-items-center justify-content-center my-font-size-xs fw-bold"
                       style="background: ${backgroundColor}; color: ${textColor}; border-radius: 50%; width: 20px; height: 20px; border: 2px solid ${borderColor}; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    ${order}
                  </div>
                  `,
                  className: `route-optimization-point-icon ${isCompleted ? 'completed' : 'active'}`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                  popupAnchor: [0, -12],
                });
                const marker = L.marker(latlng, { icon });

                return marker;
              }
            } else if (type === 'point') {
              // 一般點類型
              // 檢查是否為路線中心點
              if (feature.properties.type === 'route-center-point') {
                // ============================================
                // 路線中心點：星形標記，較小尺寸
                // ============================================
                // 優先使用feature.properties中的顏色，如果沒有則使用layer的colorName
                let pointColor = `var(--my-color-${colorName})`; // 預設使用layer顏色

                if (feature.properties.fillColor) {
                  pointColor = `var(--my-color-${feature.properties.fillColor})`;
                } else if (feature.properties.routeColor) {
                  pointColor = `var(--my-color-${feature.properties.routeColor})`;
                }

                // 準備交通時間標籤（從屬性取得，若無則以分鐘轉換為 h/m）
                const trafficTimeLabel = (() => {
                  const label = feature.properties.traffic_time_label;
                  if (label) return label;
                  const minutes = feature.properties.traffic_time_minutes;
                  if (typeof minutes === 'number') {
                    const hours = Math.floor(minutes / 60);
                    const mins = minutes % 60;
                    return hours > 0 ? `${hours}h${mins}m` : `${mins}m`;
                  }
                  return '';
                })();

                const icon = L.divIcon({
                  html: `
                  <div style="transform: translate(-50%, -50%); background: ${pointColor}; color: #fff; display: inline-block; padding: 2px 6px; font-weight: 700; line-height: 1; white-space: nowrap; border-radius: 8px; font-size: 12px;">
                    ${trafficTimeLabel}
                  </div>
                  `,
                  className: 'route-center-point-icon',
                  iconAnchor: [0, 0],
                  popupAnchor: [0, -10],
                });

                const marker = L.marker(latlng, { icon });

                // 不綁定 hover tooltip（需求：不需要 hover 功能）

                return marker;
              } else if (feature.properties.routeOrder) {
                // ============================================
                // 新基準中央服務紀錄點位：根據 time_total 決定大小
                // ============================================
                const routeOrder = feature.properties.routeOrder; // 服務順序編號
                const timeTotal = feature.properties.time_total || 0; // 服務總服務時間（分鐘）

                // ============================================
                // 圓面積計算邏輯：1小時 = 10px × 10px × π
                // ============================================
                // 數學原理：
                // - 圓面積公式：A = π × r²
                // - 半徑計算：r = √(A/π)
                // - 直徑計算：d = 2r
                // - 標準：1小時 = π × 10² = 314.16 平方像素
                const timeInHours = timeTotal / 60; // 將分鐘轉換為小時
                const areaPerHour = Math.PI * 10 * 10; // 每小時對應的標準面積
                const totalArea = timeInHours * areaPerHour; // 總面積 = 時間 × 標準面積
                const radius = Math.sqrt(totalArea / Math.PI); // 計算半徑
                const size = Math.max(radius * 2, 20); // 直徑，最小 20px 確保可見性
                const fontSize = 12; // 固定字體大小 12px，確保所有數字清晰可讀

                // 調試信息

                // 優先使用feature.properties中的顏色，如果沒有則使用layer的colorName
                let pointColor = `var(--my-color-${colorName})`; // 預設使用layer顏色

                if (feature.properties.fillColor) {
                  // 如果fillColor是顏色名稱，轉換為CSS變數
                  pointColor = `var(--my-color-${feature.properties.fillColor})`;
                } else if (feature.properties.routeColor) {
                  // 如果有routeColor，使用它
                  pointColor = `var(--my-color-${feature.properties.routeColor})`;
                }

                const icon = L.divIcon({
                  html: `
                  <div class="d-flex align-items-center justify-content-center fw-bold"
                       style="background: ${pointColor}; color: white; border-radius: 50%; width: ${size}px; height: ${size}px; font-size: ${fontSize}px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    ${routeOrder}
                  </div>
                  `,
                  className: 'service-route-point-icon',
                  iconSize: [size, size],
                  iconAnchor: [size / 2, size / 2],
                  popupAnchor: [0, -size / 2],
                });

                const marker = L.marker(latlng, { icon });

                // 移除 tooltip 功能（不需要 hover tooltip）

                return marker;
              } else {
                // 一般點類型
                // 優先使用feature.properties中的顏色，如果沒有則使用layer的colorName
                let pointColor = `var(--my-color-${colorName})`; // 預設使用layer顏色

                if (feature.properties.fillColor) {
                  // 如果fillColor是顏色名稱，轉換為CSS變數
                  pointColor = `var(--my-color-${feature.properties.fillColor})`;
                } else if (feature.properties.routeColor) {
                  // 如果有routeColor，使用它
                  pointColor = `var(--my-color-${feature.properties.routeColor})`;
                }
                const icon = L.divIcon({
                  html: `<div
                  class="rounded-circle"
                  style="
                     background-color: ${pointColor};
                     width: 8px;
                     height: 8px;
                   ">
                   </div>`, // HTML 內容：圓形標記
                  className: '', // 移除不必要的 CSS 類名
                  iconSize: [8, 8], // 圖標尺寸
                  iconAnchor: [4, 4], // 圖標錨點
                  popupAnchor: [0, -4], // 彈窗錨點
                });
                return L.marker(latlng, { icon }); // 返回標記實例
              }
            }
            return null; // 非點類型返回 null
          },
          // 樣式設定函數
          style: (feature) => {
            // 新基準中央服務紀錄路線的特殊樣式處理
            if (feature.properties.layerName && feature.properties.layerName.includes('路線')) {
              // 優先使用routeColor，如果沒有則使用strokeColor（顏色名稱），否則使用預設色
              let routeColor = 'var(--my-color-orange)'; // 預設顏色

              if (feature.properties.routeColor) {
                // 如果有routeColor（顏色名稱），轉換為CSS變數
                routeColor = `var(--my-color-${feature.properties.routeColor})`;
              } else if (feature.properties.strokeColor) {
                // 如果有strokeColor（顏色名稱），轉換為CSS變數
                routeColor = `var(--my-color-${feature.properties.strokeColor})`;
              }

              return {
                color: routeColor,
                weight: feature.properties.strokeWidth || 3, // 路線粗細
                opacity: feature.properties.strokeOpacity || 0.8, // 路線透明度
                lineCap: 'round', // 線條端點樣式
                lineJoin: 'round', // 線條連接樣式
                dashArray: null, // 實線
              };
            }
            // 路徑規劃路線的特殊樣式處理
            if (layer.isRoutePlanningLayer && feature.properties.type === 'route-line') {
              // 使用圖層的顏色，如果沒有則使用預設色
              const routeColor =
                feature.properties.routeColor || feature.properties.strokeColor || 'orange';
              return {
                color: routeColor.startsWith('--my-color-')
                  ? routeColor
                  : `var(--my-color-${routeColor})`,
                weight: 4, // 路線粗細
                opacity: 0.8, // 路線透明度
                lineCap: 'round', // 線條端點樣式
                lineJoin: 'round', // 線條連接樣式
                dashArray: null, // 實線
              };
            }
            // 路徑優化路線的特殊樣式處理
            if (
              layer.isRouteOptimizationLayer &&
              feature.properties.type === 'optimized-route-line'
            ) {
              // 使用與圖層相同的顏色系統
              const routeColor = feature.properties.routeColor || 'purple'; // 預設使用 purple
              return {
                color: `var(--my-color-${routeColor})`, // 使用動態顏色
                weight: 4, // 路線粗細
                opacity: 0.8, // 路線透明度
                lineCap: 'round', // 線條端點樣式
                lineJoin: 'round', // 線條連接樣式
                dashArray: null, // 實線
              };
            }
            // 只有polygon返回預設樣式物件
            if (layer.type == 'polygon') {
              //if (feature.properties.fillColor) {
              return {
                fillColor: feature.properties.fillColor, // 填充顏色
                weight: 1, // 邊框粗細
                opacity: 1, // 邊框透明度
                color: feature.properties.color || 'white', // 邊框顏色
                fillOpacity: feature.properties.fillColor ? 0.6 : 0, // 填充透明度
              };
            }
          },
          // 每個要素的處理函數
          onEachFeature: (feature, layer) => {
            // 創建彈窗內容 HTML
            // const properties = Object.entries(feature.properties.popupData) // 獲取彈窗資料項目
            //   .map(
            //     ([key, value]) =>
            //       `<div class="pb-2">
            //          <div class="my-title-xs-gray pb-1">${key}</div>
            //          <div class="my-content-sm-black pb-1">${value}</div>
            //        </div>` // 格式化每個資料項目
            //   )
            //   .join(''); // 合併所有項目

            // 綁定彈窗到圖層
            // layer.bindPopup(`
            //   <div class="p-2">
            //     <div class="my-title-sm-gray pb-2">${layerName}</div>
            //     ${properties}
            //   </div>
            // `);

            // 為分析圖層設定特殊的 popup 配置
            if (layer.isAnalysisLayer) {
              layer.bindPopup(
                `
                <div class="">
                  <div class="my-title-xs-gray pb-2">${layerName}</div>
                  <div class="my-content-sm-black">${feature.properties.name}</div>
                </div>
              `,
                {
                  className: 'analysis-popup',
                  offset: [0, -5], // 調整偏移量
                  closeButton: true,
                  autoClose: false,
                  closeOnClick: false,
                }
              );
            } else if (
              feature.properties.layerName &&
              feature.properties.layerName.includes('路線')
            ) {
              // 新基準中央服務紀錄路線的彈出視窗
              layer.bindPopup(
                `
                  <div class="">
                    <div class="my-title-xs-gray pb-2">${feature.properties.layerName}</div>
                    <div class="my-content-sm-black">${feature.properties.name}</div>
                    <div class="my-content-xs-gray pt-1">服務人員: ${feature.properties.serviceProviderId}</div>
                    <div class="my-content-xs-gray">服務日期: ${dataStore.selectedServiceDate}</div>
                    <div class="my-content-xs-gray">服務點數: ${feature.properties.pointCount} 個</div>
                  </div>
                `,
                {
                  className: 'service-route-popup',
                  offset: [0, -5],
                  closeButton: true,
                  autoClose: false,
                  closeOnClick: false,
                }
              );
            } else if (layer.isRoutePlanningLayer) {
              // 根據要素類型設定不同的彈出視窗
              if (feature.properties.type === 'route-planning-point') {
                // 路徑規劃點的彈出視窗
                const isCompleted = feature.properties.status === 'completed';
                const popupContent = isCompleted
                  ? `
                  <div class="">
                    <div class="my-title-xs-gray pb-2">${layerName}</div>
                    <div class="my-content-sm-black">${feature.properties.name}</div>
                    <div class="my-content-xs-gray pt-1">順序: ${feature.properties.order}</div>
                    <div class="my-content-xs-gray">所屬路線: 路線 ${feature.properties.routeNumber}</div>
                    <div class="my-content-xs-gray">狀態: 已完成</div>
                  </div>
                `
                  : `
                  <div class="">
                    <div class="my-title-xs-gray pb-2">${layerName}</div>
                    <div class="my-content-sm-black">${feature.properties.name}</div>
                    <div class="my-content-xs-gray pt-1">順序: ${feature.properties.order}</div>
                    <div class="my-content-xs-gray">狀態: 規劃中</div>
                  </div>
                `;

                layer.bindPopup(popupContent, {
                  className: `route-planning-popup ${isCompleted ? 'completed' : 'active'}`,
                  offset: [0, -5],
                  closeButton: true,
                  autoClose: false,
                  closeOnClick: false,
                });
              } else if (feature.properties.type === 'route-line') {
                // 路徑規劃路線的彈出視窗
                layer.bindPopup(
                  `
                  <div class="">
                    <div class="my-title-xs-gray pb-2">${layerName}</div>
                    <div class="my-content-sm-black">${feature.properties.name}</div>
                    <div class="my-content-xs-gray pt-1">總距離: ${feature.properties.distance} km</div>
                    <div class="my-content-xs-gray">預估時間: ${feature.properties.duration} m</div>
                    <div class="my-content-xs-gray">路徑點數: ${feature.properties.waypoints}</div>
                  </div>
                `,
                  {
                    className: 'route-planning-popup route-line-popup',
                    offset: [0, -5],
                    closeButton: true,
                    autoClose: false,
                    closeOnClick: false,
                  }
                );
              }
            } else {
              // 檢查是否為新基準中央服務紀錄點位
              if (feature.properties.routeOrder && feature.properties.propertyData) {
                // 新基準中央服務紀錄點位的彈窗（使用簡化的服務點內容）
                const popupContent = createServicePointContent(feature.properties);
                layer.bindPopup(popupContent, {
                  className: 'service-point-popup',
                  offset: [0, -5],
                  closeButton: true,
                  autoClose: true,
                  closeOnClick: true,
                });
              } else {
                // 一般點類型的彈窗
                layer.bindPopup(`
                  <div class="">
                    <div class="my-title-xs-gray pb-2">${layerName}</div>
                    <div class="my-content-sm-black">${feature.properties.name}</div>
                  </div>
                `);
              }
            }

            // 只綁定點擊事件 - 移除所有 highlight 和 tooltip 功能
            layer.on({
              // 移除所有滑鼠懸停和離開事件 - 不需要任何 highlight 效果
              // 點擊事件
              click: function () {
                // 注意：路徑規劃點擊模式相關代碼已移除

                // 注意：路徑優化點擊模式相關代碼已移除

                // 分析點不參與選擇，直接返回
                if (
                  (layer.isAnalysisLayer || feature.properties.layerId === 'analysis-layer') &&
                  feature.properties.type === 'point-analysis'
                ) {
                  return;
                }

                // 服務點點擊：打開現有的 popup
                if (feature.properties.routeOrder && feature.properties.propertyData) {
                  // 首先關閉地圖上所有現有的 popup，確保同一時間只有一個popup
                  mapInstance.closePopup();

                  // 直接打開已經綁定的 popup
                  if (this.openPopup) {
                    this.openPopup();
                  }
                  return;
                }

                // 路線中心點簡單處理：顯示基本信息
                if (feature.properties.type === 'route-center-point') {
                  // 清除之前的選取
                  dataStore.setSelectedFeature(null);
                  resetAllLayerStyles();

                  // 創建路線中心點特徵物件
                  const routeCenterFeature = {
                    type: 'Feature',
                    properties: {
                      ...feature.properties,
                      type: 'route-center-point-selected',
                    },
                  };

                  // 設置到dataStore中
                  dataStore.setSelectedFeature(routeCenterFeature);

                  // 移除縮放功能 - 不再自動縮放到點擊位置

                  return;
                }

                // 檢查是否為服務人員圖層的點擊（以 feature.properties.layerId 為準）
                const isServiceProviderLayer =
                  storeLayerId && String(storeLayerId).startsWith('service-provider-');

                // 檢查是否已絗選取了相同的要素
                const isSameFeature =
                  dataStore.selectedFeature &&
                  dataStore.selectedFeature.properties &&
                  dataStore.selectedFeature.properties.id === feature.properties.id;

                if (isSameFeature) {
                  // 如果點擊的是已經選取的要素，清除選取並回到預設視圖
                  dataStore.setSelectedFeature(null);
                  resetAllLayerStyles();
                  showFullCity();
                  return;
                }

                if (
                  isServiceProviderLayer ||
                  (feature.properties?.service_items &&
                    Array.isArray(feature.properties.service_items) &&
                    feature.properties.service_items.length > 0)
                ) {
                  // 清除之前的選取，確保單一選擇
                  dataStore.setSelectedFeature(null);
                  resetAllLayerStyles();

                  // 找到對應的圖層資訊
                  const storeLayer = dataStore.findLayerById(storeLayerId) ||
                    dataStore.findLayerById(feature.properties.layerId) || {
                      layerId: storeLayerId,
                      layerName: storeLayerName,
                    };

                  // 應用地圖上的高亮樣式
                  this._originalStyle = {
                    weight: this.options?.weight,
                    color: this.options?.color,
                    fillOpacity: this.options?.fillOpacity,
                  };

                  // 完全移除高亮顯示

                  // 將圖層置於最前方
                  if (this.bringToFront) {
                    this.bringToFront();
                  }

                  // 使用共用的工具函數創建服務項目資料
                  try {
                    const { serviceItemsData } = dataStore.createServiceItemsData(
                      feature,
                      storeLayer
                    );

                    // 創建完整的服務項目特徵物件，這將觸發右側面板顯示
                    const serviceItemsFeature = {
                      type: 'Feature',
                      properties: {
                        ...serviceItemsData.servicePoint,
                        serviceItems: serviceItemsData.serviceItems,
                        servicePointInfo: serviceItemsData.servicePointInfo,
                        filename: serviceItemsData.filename, // 添加 filename 欄位
                        id: feature.properties.id,
                        type: 'service-items', // 關鍵：設置類型為service-items
                        layerId: storeLayerId,
                        layerName: storeLayerName,
                      },
                    };

                    // 設置到dataStore中，這會觸發右側面板更新
                    dataStore.setSelectedFeature(serviceItemsFeature);

                    // 同時發送事件到父組件，確保事件鏈完整
                    emit('show-service-point-detail', serviceItemsData);

                    // 移除縮放和 popup 功能 - 只保留選擇功能
                  } catch (error) {
                    console.error('❌ MapTab: 創建服務項目資料時發生錯誤:', error);

                    // 即使出錯也要保持基本的選擇功能
                    const basicFeature = {
                      type: 'Feature',
                      properties: {
                        ...feature.properties,
                        layerId: layer.layerId,
                        layerName: layer.layerName,
                      },
                    };
                    dataStore.setSelectedFeature(basicFeature);
                  }
                } else {
                  // 清除之前的選取，確保單一選擇
                  dataStore.setSelectedFeature(null);
                  resetAllLayerStyles();

                  // 設定新的選取
                  dataStore.setSelectedFeature(feature); // 設定選中的要素到資料存儲
                  emit('feature-selected', feature); // 發送要素選中事件

                  // 移除縮放功能 - 不再自動縮放到點擊位置
                }
              },
              // 右鍵點擊事件
              contextmenu: function (e) {
                // 只有分析圖層的圓圈才顯示右鍵菜單
                if (
                  (layer.isAnalysisLayer || feature.properties.layerId === 'analysis-layer') &&
                  feature.properties.type === 'circle-analysis'
                ) {
                  showAnalysisContextMenu(e.originalEvent, feature);
                }
              },
            });
          },
        });

        return geoJsonLayer; // 返回創建的 GeoJSON 圖層
      };

      // 🎯 保存當前視圖狀態函數 (Save Current View State Function)
      const saveCurrentViewState = () => {
        if (mapInstance) {
          const center = mapInstance.getCenter();
          const zoom = mapInstance.getZoom();
          previousViewState = {
            center: [center.lat, center.lng],
            zoom: zoom,
          };
        }
      };

      // 🎯 恢復之前的視圖狀態函數 (Restore Previous View State Function)
      const restorePreviousViewState = () => {
        if (mapInstance && previousViewState) {
          mapInstance.setView(previousViewState.center, previousViewState.zoom);
          // 同時更新 mapStore 中的值，保持一致性
          mapStore.setMapView(previousViewState.center, previousViewState.zoom);
          previousViewState = null; // 清除保存的狀態
        }
      };

      // 🔄 重設所有圖層樣式函數 (Reset All Layer Styles Function)
      const resetAllLayerStyles = () => {
        // 刪除地圖上的任何臨時標記
        if (mapInstance) {
          // 確保 mapInstance 存在
          mapInstance.eachLayer((layer) => {
            if (
              layer.options &&
              layer.options.icon &&
              (layer.options.icon.options?.className === 'first-service-point-marker' ||
                layer.options.icon.options?.className === 'highlight-service-point-marker')
            ) {
              mapInstance.removeLayer(layer);
            }
          });
        }

        // 重設圖層群組中的每個圖層
        Object.values(layerGroups).forEach((layerGroup) => {
          if (layerGroup) {
            layerGroup.eachLayer((layer) => {
              const feature = layer.feature;
              if (feature) {
                const layerData = dataStore.findLayerById(feature.properties.layerId);
                const type = layerData?.type;

                // 分析圖層的特殊處理
                if (layerData?.isAnalysisLayer || feature.properties.layerId === 'analysis-layer') {
                  if (feature.properties.type === 'point-analysis') {
                    // 分析點不需要特殊處理
                    return;
                  } else if (feature.properties.type === 'circle-analysis') {
                    // 分析圓圈重設
                    if (layer._originalStyle) {
                      layer.setStyle(layer._originalStyle);
                    }
                  }
                } else if (type === 'point') {
                  // 一般點類型不需要特殊處理，因為大小是固定的
                } else if (type === 'polygon') {
                  // 多邊形類型處理
                  if (layer._originalStyle) {
                    layer.setStyle(layer._originalStyle);
                  } else if (layerGroup.resetStyle) {
                    layerGroup.resetStyle(layer);
                  }
                }

                // 關閉所有打開的彈出視窗和提示
                if (layer.closePopup) {
                  layer.closePopup();
                }
                // 移除 tooltip 相關功能
              }
            });
          }
        });
      };

      // 🔄 同步圖層函數 (Sync Layers Function)
      const syncLayers = () => {
        // 檢查地圖實例和準備狀態
        if (!mapInstance || !isMapReady.value) return;

        // 獲取資料存儲中的所有圖層
        const storeLayers = dataStore.getAllLayers();
        // 獲取當前地圖上的圖層 ID 列表
        const currentLayerIds = Object.keys(layerGroups);
        // 篩選出可見且有資料的圖層（分析圖層總是有空的 features 數組）
        const visibleLayers = storeLayers.filter((l) => l.visible && l.geoJsonData);
        const visibleLayerIds = visibleLayers.map((l) => l.layerId);

        // 找出新增的圖層（不在當前地圖上但在可見列表中的圖層）
        const newLayerIds = visibleLayerIds.filter((id) => !currentLayerIds.includes(id));
        // 找出需要移除的圖層（在當前地圖上但不在可見列表中的圖層）
        const layersToRemove = currentLayerIds.filter((id) => !visibleLayerIds.includes(id));

        // 只移除不可見的圖層，避免不必要的重新渲染
        layersToRemove.forEach((layerId) => {
          if (layerGroups[layerId]) {
            mapInstance.removeLayer(layerGroups[layerId]);
            delete layerGroups[layerId];
          }
        });

        // 檢查是否有分析圖層需要更新
        const hasAnalysisLayerUpdate = visibleLayers.some((layer) => layer.isAnalysisLayer);

        // 如果有分析圖層更新，需要重新渲染所有圖層以保持正確順序
        if (hasAnalysisLayerUpdate) {
          // 移除所有現有圖層
          Object.keys(layerGroups).forEach((layerId) => {
            if (layerGroups[layerId]) {
              mapInstance.removeLayer(layerGroups[layerId]);
              delete layerGroups[layerId];
            }
          });
        }

        // 用於收集新添加的圖層，以便後續自動縮放
        const newAddedLayers = [];

        // 按照 layers 的反轉順序處理所有可見圖層（這樣第一個圖層會在最底層）
        visibleLayers
          .slice()
          .reverse()
          .forEach((layer) => {
            const { layerId } = layer;

            // 如果有分析圖層更新，所有圖層都需要重新創建
            // 否則只有不存在的圖層才創建
            const shouldCreateLayer = hasAnalysisLayerUpdate || !layerGroups[layerId];

            if (!shouldCreateLayer) return;

            try {
              const newLayer = createFeatureLayer(layer);
              if (newLayer) {
                if (layer.isAnalysisLayer) {
                  newLayer.isAnalysisLayer = true;
                }
                newLayer.addTo(mapInstance);
                layerGroups[layerId] = newLayer;

                // 如果是新添加的圖層，收集起來用於自動縮放（分析圖層不需要縮放）
                if (newLayerIds.includes(layerId) && !layer.isAnalysisLayer) {
                  newAddedLayers.push(newLayer);
                }
              }
            } catch (error) {
              console.error(`添加圖層 "${layer.layerName}" 時發生錯誤:`, error);
            }
          });

        // 只有在有新添加的非分析圖層時才自動縮放
        if (newAddedLayers.length > 0) {
          const bounds = new L.LatLngBounds();
          let hasValidBounds = false;

          newAddedLayers.forEach((layer) => {
            if (layer && layer.getBounds) {
              const layerBounds = layer.getBounds();
              if (layerBounds.isValid()) {
                bounds.extend(layerBounds);
                hasValidBounds = true;
              }
            }
          });

          if (hasValidBounds) {
            setTimeout(() => {
              mapInstance.fitBounds(bounds, { padding: [50, 50] });
            }, 200); // 稍微延遲確保圖層完全載入
          }
        }

        // 計算並更新標記總數
        const totalMarkers = Object.values(layerGroups).reduce(
          (acc, layer) => acc + (layer.getLayers ? layer.getLayers().length : 0), // 累加每個圖層的要素數量
          0 // 初始值為 0
        );
        emit('update:activeMarkers', totalMarkers); // 發送標記數量更新事件
      };

      // 🔍 顯示全部要素函數 (Show All Features Function) - 顯示圖面所有資料
      const showAllFeatures = () => {
        // 檢查地圖實例、準備狀態和圖層可見性
        if (!mapInstance || !isMapReady.value || !isAnyLayerVisible.value) return;

        // 創建邊界框物件用於計算所有要素的範圍
        const bounds = new L.LatLngBounds(); // 初始化 Leaflet 邊界框
        let hasValidBounds = false; // 標記是否有有效的邊界

        // 遍歷所有圖層群組計算邊界
        Object.values(layerGroups).forEach((layer) => {
          if (layer && layer.getBounds) {
            // 檢查圖層是否有 getBounds 方法
            const layerBounds = layer.getBounds(); // 獲取圖層邊界
            if (layerBounds.isValid()) {
              // 檢查邊界是否有效
              bounds.extend(layerBounds); // 擴展總邊界框
              hasValidBounds = true; // 標記有有效邊界
            }
          }
        });

        // 如果有有效邊界，調整地圖視圖以包含所有要素
        if (hasValidBounds) {
          mapInstance.fitBounds(bounds, { padding: [50, 50] }); // 設定地圖視圖並添加內邊距
        }
      };

      // 🌍 顯示全市函數 (Show Full City Function) - 回到預設地圖範圍
      const showFullCity = () => {
        // 檢查地圖實例和準備狀態
        if (!mapInstance || !isMapReady.value) return;

        // 使用固定的台中市預設範圍，不依賴當前存儲的值
        const defaultCenter = [24.1477, 120.6736]; // 台中市政府
        const defaultZoom = 11; // 適合台中市的縮放等級

        // 回到預設的地圖中心和縮放等級
        mapInstance.setView(defaultCenter, defaultZoom);

        // 同時更新 mapStore 中的值，保持一致性
        mapStore.setMapView(defaultCenter, defaultZoom);
      };

      // 🎯 高亮顯示特定要素函數 (Highlight Specific Feature Function)
      const highlightFeature = (highlightData) => {
        // 檢查地圖是否準備就緒
        if (!mapInstance || !isMapReady.value) {
          console.warn('⚠️ 地圖尚未準備就緒，延遲執行高亮顯示'); // 輸出警告訊息
          setTimeout(() => highlightFeature(highlightData), 200); // 延遲 200ms 後重試
          return;
        }

        // 檢查是否有圖層群組
        if (!layerGroups || Object.keys(layerGroups).length === 0) {
          console.warn('⚠️ 圖層群組尚未載入，延遲執行高亮顯示'); // 輸出警告訊息
          setTimeout(() => highlightFeature(highlightData), 200); // 延遲 200ms 後重試
          return;
        }

        // 解析高亮資料
        let targetLayerId, targetFeatureId; // 宣告目標圖層 ID 和要素 ID

        // 檢查是否為服務人員高亮事件
        if (highlightData.type === 'service-provider') {
          // 將地圖中心移動到第一個服務點
          if (highlightData.firstServicePoint) {
            const { lat, lon } = highlightData.firstServicePoint;

            // 只有當有座標時才移動地圖和創建標記
            if (lat && lon) {
              mapInstance.setView([lat, lon], 15); // 縮放到 15 級別

              // 清除所有現有樣式和標記
              resetAllLayerStyles();

              // 創建一個臨時的標記來標示第一個服務點
              const firstPointMarker = L.marker([lat, lon], {
                icon: L.divIcon({
                  className: 'first-service-point-marker',
                  html: '<div style="background-color: #ff6b6b; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">1</div>',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                }),
              }).addTo(mapInstance);

              // 添加彈出視窗
              firstPointMarker
                .bindPopup(
                  `
                <div style="font-size: 14px;">
                  <strong>第一個服務點</strong><br>
                  姓名: ${highlightData.firstServicePoint.name}<br>
                  地址: ${highlightData.firstServicePoint.address}<br>
                  時間: ${highlightData.firstServicePoint.time}
                </div>
              `
                )
                .openPopup();
            } else {
              // 如果沒有座標，只顯示提示訊息
            }

            // 設置選中的特徵到資料存儲（用於右側面板顯示）
            dataStore.setSelectedFeature({
              type: 'Feature',
              properties: {
                type: 'service-provider',
                serviceProviderId: highlightData.serviceProviderId,
                layerId: highlightData.layerId,
                layerName: highlightData.layerName,
                allServicePoints: highlightData.allServicePoints,
                firstServicePoint: highlightData.firstServicePoint,
              },
            });
          }

          return; // 確保退出函數
        }

        // 檢查是否為清除高亮事件
        if (
          typeof highlightData === 'object' &&
          highlightData !== null &&
          highlightData.id === null
        ) {
          // 清除所有圖層的樣式
          resetAllLayerStyles();
          // 回到預設視圖
          showFullCity();
          return;
        }

        // 檢查是否為服務項目高亮（從底部面板點擊）
        if (highlightData.type === 'service-item-highlight') {
          // 清除所有圖層的樣式
          resetAllLayerStyles();

          // 關閉所有現有的 popup，確保同一時間只有一個popup
          mapInstance.closePopup();

          // 從座標信息獲取位置
          const coordinates = highlightData.coordinates;
          const lat = coordinates?.lat;
          const lon = coordinates?.lon;

          if (lat && lon) {
            // 移動地圖視圖到服務點位置（底部面板選擇時縮放到中心）
            saveCurrentViewState();
            mapInstance.setView([lat, lon], 16);

            // 尋找現有的服務點標記並為其添加 popup
            let foundAndHighlighted = false;
            const targetLayerGroup = layerGroups[highlightData.layerId];

            if (targetLayerGroup) {
              targetLayerGroup.eachLayer((layer) => {
                if (foundAndHighlighted) return; // 找到第一個就停止

                const feature = layer.feature;
                if (feature && feature.properties && feature.geometry) {
                  // 使用緯度和經度來匹配對應的服務點
                  const featureLat = feature.geometry.coordinates[1];
                  const featureLon = feature.geometry.coordinates[0];

                  // 檢查座標是否匹配（允許小數點差異）
                  if (Math.abs(featureLat - lat) < 0.0001 && Math.abs(featureLon - lon) < 0.0001) {
                    // 只添加 popup，不修改樣式
                    const props = highlightData.item || {};
                    const popupContent = createServicePointContent(props);

                    // 顯示 popup（完整的 detail 內容）
                    if (layer.bindPopup) {
                      layer.bindPopup(popupContent, {
                        closeButton: true,
                        autoClose: true,
                        closeOnClick: true,
                        className: 'service-point-popup',
                        opacity: 0.9,
                      });
                      layer.openPopup && layer.openPopup();
                    }

                    foundAndHighlighted = true;
                  }
                }
              });
            }

            // 如果沒有找到現有服務點，創建臨時 popup
            if (!foundAndHighlighted) {
              // 創建一個不可見的臨時標記來承載 popup
              const item = highlightData.item;
              const tempMarker = L.marker([lat, lon], {
                opacity: 0, // 完全透明，不影響地圖顯示
                icon: L.divIcon({
                  className: 'temp-popup-marker',
                  html: '',
                  iconSize: [1, 1],
                  iconAnchor: [0, 0],
                }),
              }).addTo(mapInstance);

              // 添加彈出視窗
              const props = item;
              const popupContent = createServicePointContent(props);
              tempMarker
                .bindPopup(popupContent, {
                  closeButton: true,
                  autoClose: true,
                  closeOnClick: true,
                  className: 'service-point-popup',
                  opacity: 0.9,
                })
                .openPopup();
            }

            // 移除重複的 popup 創建邏輯

            // 自動復原：若這只是高亮而非選取，短時間後恢復
            setTimeout(() => {
              if (!dataStore.selectedFeature) {
                restorePreviousViewState();
                // 移除臨時標記（不可見的 popup 承載標記）
                mapInstance.eachLayer((layer) => {
                  if (
                    layer.options &&
                    layer.options.icon &&
                    (layer.options.icon.options.className === 'temp-popup-marker' ||
                      layer.options.icon.options.className === 'highlight-service-point-marker')
                  ) {
                    mapInstance.removeLayer(layer);
                  }
                });
              }
            }, 1500);
          } else {
            console.warn('⚠️ MapTab: 服務項目沒有有效的座標信息');
          }

          return; // 完成高亮處理，退出函數
        }

        // 檢查高亮資料是否為物件格式
        if (typeof highlightData === 'object' && highlightData !== null) {
          targetLayerId = highlightData.layerId; // 從物件中獲取圖層 ID
          targetFeatureId = highlightData.id; // 從物件中獲取要素 ID
        } else {
          targetFeatureId = highlightData; // 直接使用作為要素 ID
        }

        // 執行高亮顯示的核心邏輯函數
        const performHighlight = () => {
          // 重置所有圖層樣式
          resetAllLayerStyles();

          // 初始化目標要素搜尋變數
          let targetLayer = null; // 目標圖層實例
          let targetFeature = null; // 目標要素物件

          // 如果指定了圖層 ID，在特定圖層中搜尋
          if (targetLayerId && layerGroups[targetLayerId]) {
            const specificLayerGroup = layerGroups[targetLayerId]; // 獲取指定圖層群組

            // 遍歷圖層中的每個要素
            specificLayerGroup.eachLayer((layer) => {
              const feature = layer.feature; // 獲取要素物件
              if (feature && feature.properties) {
                // 檢查要素是否有屬性
                // 獲取要素 ID（與 DataTableTab.vue 中的邏輯保持一致）
                const featureId =
                  feature.properties.id || feature.properties['#'] || feature.properties.案號;

                // 比較要素 ID（轉換為字串進行比較）
                if (String(featureId) === String(targetFeatureId)) {
                  targetLayer = layer; // 設定目標圖層
                  targetFeature = feature; // 設定目標要素
                  return;
                }
              }
            });
          } else {
            // 在所有圖層中尋找要素
            for (const [layerId, layerGroup] of Object.entries(layerGroups)) {
              // 遍歷圖層中的每個要素
              layerGroup.eachLayer((layer) => {
                const feature = layer.feature; // 獲取要素物件
                if (feature && feature.properties) {
                  // 檢查要素是否有屬性
                  // 獲取要素 ID（與 DataTableTab.vue 中的邏輯保持一致）
                  const featureId =
                    feature.properties.id || feature.properties['#'] || feature.properties.案號;

                  // 比較要素 ID（轉換為字串進行比較）
                  if (String(featureId) === String(targetFeatureId)) {
                    targetLayer = layer; // 設定目標圖層
                    targetFeature = feature; // 設定目標要素
                    targetLayerId = layerId; // 設定目標圖層 ID
                    return;
                  }
                }
              });
              if (targetLayer) break; // 如果找到目標圖層，跳出迴圈
            }
          }

          // 如果找到目標圖層和要素，執行高亮顯示
          if (targetLayer && targetFeature) {
            // 僅做視覺高亮，不改變 store 選取狀態（避免非選取情境無法自動復原）

            // 根據要素類型執行不同的高亮效果
            if (targetLayer.feature?.geometry?.type === 'Point') {
              // 點要素處理
              const element = targetLayer.getElement(); // 獲取 DOM 元素
              if (element) {
                // 找到圖標內部的樣式 div
                const innerIconDiv = element.querySelector('div');
                if (innerIconDiv) {
                  innerIconDiv.style.transition = 'transform 0.04s ease-in-out'; // 設定過渡動畫
                  innerIconDiv.style.transform = 'scale(1.6)'; // 放大效果
                }
                // 設定最高層級確保圖標在最上方
                element.style.zIndex = 1000;
              }
            } else {
              // 面要素處理
              // 面要素高亮 - 只對有 setStyle 方法的圖層調用
              if (targetLayer.setStyle) {
                if (targetLayer.feature?.properties?.fillColor) {
                  targetLayer.setStyle({
                    weight: 4, // 增加邊框粗細
                    color: 'white', // 設定邊框顏色
                    fillOpacity: 0.8, // 增加填充透明度
                  });
                } else {
                  targetLayer.setStyle({
                    weight: 4, // 增加邊框粗細
                  });
                }
              }
            }

            // 將圖層置於最前方
            if (targetLayer.bringToFront) {
              // 檢查圖層是否有置前方法
              targetLayer.bringToFront(); // 將圖層移到最前方
            }

            // 定位到要素位置
            let bounds; // 宣告邊界變數
            if (targetLayer.getBounds) {
              // 如果圖層有 getBounds 方法（面要素）
              bounds = targetLayer.getBounds(); // 獲取圖層邊界
            } else if (targetLayer.getLatLng) {
              // 如果圖層有 getLatLng 方法（點要素）
              const latlng = targetLayer.getLatLng(); // 獲取點座標
              bounds = L.latLngBounds([latlng, latlng]); // 創建點的邊界框
            }

            // 如果有有效邊界，調整地圖視圖
            if (bounds && bounds.isValid()) {
              // 在縮放前保存當前的視圖狀態
              saveCurrentViewState();

              mapInstance.fitBounds(bounds, {
                maxZoom: 16, // 最大縮放等級限制
                padding: [50, 50], // 邊界內邊距
              });

              // 延遲打開彈窗以確保地圖移動完成
              setTimeout(() => {
                if (targetLayer.openPopup) {
                  targetLayer.openPopup();
                }
                // 移除 tooltip 功能，只保留 popup
                const f = targetLayer.feature;
                const hasDetail = f && f.properties && (f.properties.案號 || f.properties.name);
                if (hasDetail && targetLayer.getLatLng) {
                  const props = f.properties;
                  // 顯示 popup（簡化的 detail 內容）
                  const popupContent = createServicePointContent(props);
                  targetLayer.bindPopup(popupContent, {
                    closeButton: true,
                    autoClose: true,
                    closeOnClick: true,
                    className: 'service-point-popup',
                    opacity: 0.9,
                  });
                  targetLayer.openPopup();
                }
              }, 500); // 延遲 500ms

              // 自動復原：若在短時間內沒有產生選取，回到先前視圖並清理高亮
              setTimeout(() => {
                if (!dataStore.selectedFeature) {
                  resetAllLayerStyles();
                  restorePreviousViewState();
                }
              }, 1500);
            }

            return true; // 返回成功狀態
          } else {
            // 如果未找到目標要素，輸出警告訊息
            console.warn(
              `❌ 找不到要素 "${targetFeatureId}"${targetLayerId ? ` 在圖層 "${targetLayerId}" 中` : ''}`
            );
            return false; // 返回失敗狀態
          }
        };

        // 嘗試執行高亮顯示，如果失敗則重試
        const success = performHighlight(); // 執行高亮顯示
        if (!success) {
          // 如果第一次失敗
          setTimeout(() => {
            const retrySuccess = performHighlight(); // 重試執行高亮顯示
            if (!retrySuccess) {
              // 如果重試仍失敗
              console.error('❌ 重試後仍無法高亮顯示要素'); // 輸出錯誤訊息
            }
          }, 1000); // 延遲 1 秒重試
        }
      };

      // 🔄 刷新地圖尺寸函數 (Invalidate Map Size Function)
      const invalidateSize = () => {
        // 檢查地圖實例和準備狀態
        if (mapInstance && isMapReady.value) {
          nextTick(() => {
            // 等待 DOM 更新完成
            try {
              // 檢查容器是否有效
              if (mapContainer.value) {
                const rect = mapContainer.value.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) {
                  console.warn('🔄 地圖容器尺寸為零，延遲刷新地圖尺寸');
                  // 如果容器尺寸為零，延遲刷新而不是重新初始化
                  setTimeout(() => {
                    if (mapContainer.value && mapInstance && isMapReady.value) {
                      const newRect = mapContainer.value.getBoundingClientRect();
                      if (newRect.width > 0 && newRect.height > 0) {
                        mapInstance.invalidateSize();
                      }
                    }
                  }, 100);
                  return;
                }
              }

              mapInstance.invalidateSize(); // 刷新地圖尺寸
            } catch (error) {
              console.error('❌ 刷新地圖尺寸時發生錯誤:', error); // 輸出錯誤訊息
            }
          });
        } else if (!mapInstance) {
          console.warn('🔄 地圖實例不存在，等待初始化完成');
          // 如果地圖實例不存在，不嘗試重新初始化，避免重複初始化
          // 讓 initMap 函數自然完成初始化過程
        }
      };

      // 開始點擊模式

      // 注意：路徑規劃和路徑優化相關函數已移除

      // 🗑️ 清除分析圖層 (Clear Analysis Layer)
      const clearAnalysisLayer = () => {
        // 調用 dataStore 的方法清除分析圖層
        dataStore.clearAnalysisLayer();
      };

      // 注意：路徑優化相關函數已移除

      // 🖱️ 顯示右鍵菜單 (Show Context Menu)
      const showAnalysisContextMenu = (event, feature) => {
        event.preventDefault();
        event.stopPropagation();

        selectedAnalysisFeature.value = feature;
        contextMenuPosition.value = {
          x: event.pageX || event.clientX,
          y: event.pageY || event.clientY,
        };
        showContextMenu.value = true;
      };

      // 🗑️ 刪除單個分析點 (Delete Single Analysis Point)
      const deleteAnalysisPoint = () => {
        if (!selectedAnalysisFeature.value) return;

        const feature = selectedAnalysisFeature.value;
        const layerId = feature.properties.layerId;

        let pointId;
        if (feature.properties.type === 'circle-analysis') {
          pointId = feature.properties.id;
        } else {
          pointId = feature.properties.parentId;
        }

        if (!pointId) return;

        // 根據圖層類型調用對應的刪除方法
        if (layerId === 'analysis-layer') {
          dataStore.deleteAnalysisPoint(pointId);
        }

        // 隱藏右鍵菜單
        hideContextMenu();
      };

      // 🚫 隱藏右鍵菜單 (Hide Context Menu)
      const hideContextMenu = () => {
        showContextMenu.value = false;
        selectedAnalysisFeature.value = null;
      };

      // 📏 設置 ResizeObserver 監聽容器大小變化 (Setup ResizeObserver)
      let resizeObserver = null; // 宣告 ResizeObserver 實例變數
      let resizeTimeout = null; // 防抖計時器

      const setupResizeObserver = () => {
        // 檢查容器存在且瀏覽器支援 ResizeObserver
        if (mapContainer.value && window.ResizeObserver) {
          // 創建 ResizeObserver 實例
          resizeObserver = new ResizeObserver((entries) => {
            // 遍歷所有變化的元素
            if (entries.length > 0) {
              // 使用防抖機制，避免短時間內多次觸發
              if (resizeTimeout) {
                clearTimeout(resizeTimeout);
              }

              resizeTimeout = setTimeout(() => {
                if (mapInstance && isMapReady.value) {
                  invalidateSize(); // 刷新地圖尺寸
                }
                resizeTimeout = null;
              }, 150); // 延遲 150ms，與 UpperView 的延遲保持一致
            }
          });
          resizeObserver.observe(mapContainer.value); // 開始觀察地圖容器
        }
      };

      // 🔄 切換底圖函數 (Change Basemap Function)
      const changeBasemap = (basemapType) => {
        mapStore.setSelectedBasemap(basemapType); // 使用 store action 更新底圖狀態
        setBasemap(); // 應用底圖變更
      };

      // 🏷️ 獲取底圖標籤函數 (Get Basemap Label Function)
      const getBasemapLabel = (value) => {
        // 從 mapStore 中獲取底圖標籤
        const basemap = mapStore.basemaps.find((b) => b.value === value);
        return basemap ? basemap.label : value;
      };

      // 🚀 初始化地圖函數 (Initialize Map Function)
      let isInitializing = false; // 防止重複初始化的標誌
      let initTimeoutId = null; // 初始化超時計時器

      const initMap = () => {
        // 檢查是否已經有地圖實例存在，避免重複初始化
        if (mapInstance && isMapReady.value) {
          console.warn('[MapTab] 地圖已初始化，跳過重複初始化');
          return;
        }

        // 檢查是否正在初始化中，避免重複初始化
        if (isInitializing) {
          console.warn('[MapTab] 地圖正在初始化中，跳過重複初始化');
          return;
        }

        // 清除之前的超時計時器
        if (initTimeoutId) {
          clearTimeout(initTimeoutId);
          initTimeoutId = null;
        }

        isInitializing = true; // 設置初始化標誌
        let attempts = 0; // 初始化嘗試次數計數器
        const maxAttempts = 20; // 最大嘗試次數

        // 檢查容器是否準備就緒的函數
        const isContainerReady = () => {
          if (!mapContainer.value) {
            console.warn(`[MapTab] 嘗試 ${attempts}: 地圖容器不存在`);
            return false;
          }

          const rect = mapContainer.value.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(mapContainer.value);

          // 檢查容器是否可見且有有效尺寸
          if (rect.width === 0 || rect.height === 0) {
            console.warn(`[MapTab] 嘗試 ${attempts}: 容器尺寸為零`);
            return false;
          }

          if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
            console.warn(`[MapTab] 嘗試 ${attempts}: 容器隱藏`);
            return false;
          }

          // 檢查父元素鏈是否都可見
          let parent = mapContainer.value.parentElement;
          while (parent) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
              console.warn(`[MapTab] 嘗試 ${attempts}: 父元素隱藏`, parent.tagName);
              return false;
            }
            parent = parent.parentElement;
          }

          return true;
        };

        // 嘗試初始化函數
        const tryInit = () => {
          if (attempts >= maxAttempts) {
            // 如果超過最大嘗試次數
            console.error('[MapTab] 地圖初始化超時，已達最大嘗試次數', maxAttempts);
            isInitializing = false; // 重置初始化標誌
            return;
          }

          attempts++; // 增加嘗試次數

          // 檢查容器是否準備就緒
          if (!isContainerReady()) {
            const delay = Math.min(200 * attempts, 1000); // 漸進式延遲，最多1秒
            setTimeout(tryInit, delay);
            return;
          }

          try {
            if (createMap()) {
              // 嘗試創建地圖
              setBasemap(); // 設定底圖
              syncLayers(); // 同步圖層
              isInitializing = false; // 重置初始化標誌
            } else {
              console.warn('[MapTab] 地圖創建失敗，繼續重試');
              setTimeout(tryInit, 200); // 延遲 200ms 後重試
            }
          } catch (error) {
            console.error('[MapTab] 地圖創建過程中發生錯誤:', error);
            if (attempts < maxAttempts) {
              setTimeout(tryInit, 200); // 延遲 200ms 後重試
            } else {
              console.error('[MapTab] 重試次數已達上限，初始化失敗');
              isInitializing = false;
            }
          }
        };

        tryInit(); // 開始嘗試初始化

        // 設定總體超時保護
        initTimeoutId = setTimeout(() => {
          if (isInitializing) {
            console.error('[MapTab] 地圖初始化總體超時 (30秒)，強制終止');
            isInitializing = false;
          }
        }, 30000); // 30秒總體超時
      };

      // 🔄 生命週期：組件掛載 (Lifecycle: Component Mounted)
      onMounted(() => {
        nextTick(() => {
          // 等待 DOM 更新完成
          setTimeout(() => {
            // 延遲執行確保容器準備就緒
            initMap(); // 初始化地圖

            // 地圖初始化完成後設置 ResizeObserver
            setTimeout(() => {
              if (isMapReady.value) {
                setupResizeObserver();
              } else {
                console.warn('[MapTab] 地圖尚未準備就緒，跳過 ResizeObserver 設置');
              }
            }, 500); // 延遲 500ms 設置尺寸觀察器
          }, 100); // 延遲 100ms
        });

        // 🖱️ 添加全域點擊事件監聽器，用於隱藏右鍵菜單
        document.addEventListener('click', hideContextMenu);
      });

      // 🧹 生命週期：組件卸載 (Lifecycle: Component Unmounted)
      onUnmounted(() => {
        // 清理初始化相關計時器
        if (initTimeoutId) {
          clearTimeout(initTimeoutId);
          initTimeoutId = null;
        }

        if (isInitializing) {
          console.warn('[MapTab] 組件卸載時初始化仍在進行中');
          isInitializing = false;
        }

        // 清理 ResizeObserver 和相關計時器
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
          resizeTimeout = null;
        }

        if (resizeObserver) {
          // 如果 ResizeObserver 存在
          resizeObserver.disconnect(); // 停止觀察
          resizeObserver = null; // 清空引用
        }

        // 清理地圖事件和實例
        if (mapInstance) {
          // 如果地圖實例存在
          mapInstance.off('zoomend', handleZoomEnd); // 移除縮放結束事件監聽器
          mapInstance.off('moveend', handleMoveEnd); // 移除移動結束事件監聽器
          mapInstance.remove(); // 移除地圖實例
          mapInstance = null; // 清空引用
        }

        // 清理圖層相關變數
        layerGroups = {}; // 清空圖層群組物件
        currentTileLayer = null; // 清空當前底圖圖層引用
        isMapReady.value = false; // 重設地圖準備狀態

        // 🖱️ 移除全域點擊事件監聽器
        document.removeEventListener('click', hideContextMenu);
      });

      // 👀 監聽器：監聽資料存儲中的圖層變化 (Watcher: Watch Data Store Layers)
      watch(() => dataStore.layers, syncLayers, { deep: true }); // 深度監聽圖層變化並同步

      // 👀 監聽器：監聽底圖變化 (Watcher: Watch Basemap Changes)
      watch(
        () => mapStore.selectedBasemap,
        () => {
          if (isMapReady.value) {
            setBasemap(); // 當底圖變化時重新設定
          }
        }
      );

      // 👀 監聽器：監聽選中要素變化 (Watcher: Watch Selected Feature Changes)
      watch(
        () => dataStore.selectedFeature,
        (newFeature, oldFeature) => {
          // 當有新的選擇時，確保只有一個物件被高亮顯示
          if (newFeature) {
            // 如果是服務項目類型，不需要額外處理，因為已經在highlightFeature函數中處理
            if (newFeature.properties?.type === 'service-items') {
              // 不需要額外操作，讓專屬處理來管理
            }
          }

          // 如果從有選中變為沒有選中，恢復預設視圖
          if (oldFeature && !newFeature) {
            // 重置所有圖層樣式以確保沒有高亮顯示
            resetAllLayerStyles();

            // 檢查是否為點要素選取，如果是則恢復到預設視圖
            if (
              oldFeature.geometry?.type === 'Point' ||
              oldFeature.properties?.type === 'service-items' ||
              oldFeature.properties?.layerId?.startsWith('service-provider-')
            ) {
              showFullCity();
            } else {
              restorePreviousViewState();
            }
          }
        },
        { deep: true }
      );

      // 📤 返回組件公開的屬性和方法 (Return Component Public Properties and Methods)
      return {
        mapContainer, // 地圖容器 DOM 元素引用
        mapContainerId, // 動態地圖容器 ID
        selectedBasemap: computed(() => mapStore.selectedBasemap), // 選定的底圖類型響應式變數
        changeBasemap, // 切換底圖函數
        getBasemapLabel, // 獲取底圖標籤函數
        showAllFeatures, // 顯示全部要素函數
        showFullCity, // 顯示全市函數
        isAnyLayerVisible, // 檢查是否有可見圖層的計算屬性
        highlightFeature, // 高亮顯示特定要素函數
        invalidateSize, // 刷新地圖尺寸函數

        // 注意：路徑規劃和路徑優化相關函數已移除
        clearAnalysisLayer, // 清除分析圖層函數
        mapStore, // 定義存儲實例

        // 右鍵菜單相關
        contextMenu, // 右鍵菜單 DOM 引用
        showContextMenu, // 是否顯示右鍵菜單
        contextMenuPosition, // 右鍵菜單位置
        selectedAnalysisFeature, // 選中的分析要素
        deleteAnalysisPoint, // 刪除分析點函數
        hideContextMenu, // 隱藏右鍵菜單函數
        selectedServiceDate: computed(() => dataStore.selectedServiceDate), // 當前選中的服務日期
      };
    },
  };
</script>

<template>
  <!-- 🗺️ 地圖主容器 (Main Map Container) -->
  <div
    id="map-container"
    class="h-100 w-100 position-relative"
    :class="{
      'route-planning-click-mode-active': isRoutePlanningClickMode,
      'route-optimization-click-mode-active': isRouteOptimizationClickMode,
    }"
    @highlight-on-map="highlightFeature"
  >
    <!-- 🗺️ Leaflet 地圖容器 (Leaflet Map Container) -->
    <!-- 這是 Leaflet 地圖實際渲染的 DOM 元素 -->
    <div :id="mapContainerId" ref="mapContainer" class="h-100 w-100"></div>

    <!-- 🖱️ 右鍵菜單 (Context Menu) -->
    <div
      v-if="showContextMenu"
      ref="contextMenu"
      class="position-fixed rounded my-bgcolor-white my-font-size-sm shadow-sm"
      :style="{
        left: contextMenuPosition.x + 'px',
        top: contextMenuPosition.y + 'px',
        zIndex: 10000,
      }"
      @click.stop
    >
      <div
        class="context-menu-item d-flex align-items-center my-bgcolor-white-hover my-title-sm-black px-3 py-2 my-2"
        @click="deleteAnalysisPoint"
      >
        <span class="my-color-red"><i class="fas fa-trash-alt me-2"></i></span>
        刪除此分析點
      </div>
    </div>

    <!-- 🚫 點擊遮罩，用於隱藏右鍵菜單 (Click Overlay to Hide Context Menu) -->
    <div
      v-if="showContextMenu"
      class="context-menu-overlay position-fixed w-100 h-100"
      style="top: 0; left: 0; z-index: 9999"
      @click="hideContextMenu"
    ></div>

    <!-- 地圖底部控制項區域 -->
    <div
      class="position-absolute map-bottom-controls d-flex align-items-center rounded-pill shadow my-blur gap-2 p-2 mb-3"
    >
      <div class="d-flex align-items-center">
        <div class="dropdown dropup">
          <button
            class="btn rounded-pill border-0 my-btn-transparent my-font-size-xs text-nowrap"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            {{ getBasemapLabel(selectedBasemap) }}
          </button>
          <ul class="dropdown-menu">
            <li v-for="basemap in mapStore.basemaps" :key="basemap.value">
              <a
                class="dropdown-item my-content-xs-black py-1"
                href="#"
                @click.prevent="changeBasemap(basemap.value)"
              >
                {{ basemap.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- 顯示全部 -->
      <button
        class="btn rounded-pill border-0 my-btn-transparent my-font-size-xs text-nowrap my-cursor-pointer"
        @click="showAllFeatures"
        :disabled="!isAnyLayerVisible"
        title="顯示圖面所有資料範圍"
      >
        顯示全部
      </button>

      <!-- 顯示全市 -->
      <button
        class="btn rounded-pill border-0 my-btn-transparent my-font-size-xs text-nowrap my-cursor-pointer"
        @click="showFullCity"
        title="回到預設地圖範圍"
      >
        顯示全市
      </button>

      <!-- 注意：路徑規劃和路徑優化相關按鈕已移除 -->
    </div>
  </div>
</template>

<style scoped>
  /* 🗺️ 地圖容器樣式 (Map Container Styles) */
  #map-container {
    background-color: transparent; /* 預設透明，讓底圖顯示，空白地圖時由 JS 動態設定為白色 */
    z-index: 0; /* 確保地圖在左側面板陰影下方 */
  }

  /* 🗺️ Leaflet 地圖容器樣式 (Leaflet Map Container Styles) */
  [id^='leaflet-map'] {
    width: 100% !important;
    height: 100% !important;
  }

  /* ✨ 地圖底部控制項樣式 (Map Bottom Controls Styles) */
  .map-bottom-controls {
    bottom: 0px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2000;
  }

  /* 🎯 分析點圖標樣式 (Analysis Point Icon Styles) */
  :deep(.analysis-point-icon) {
    background: transparent !important;
    border: none !important;
  }

  /* 🗺️ 路徑規劃點圖標樣式 (Route Planning Point Icon Styles) */
  :deep(.route-planning-point-icon) {
    background: transparent !important;
    border: none !important;
  }

  /* 🖱️ 點擊模式樣式 (Click Mode Styles) */
  .click-mode-active,
  .click-mode-active * {
    cursor: crosshair !important;
  }

  /* 🗺️ 路徑規劃點擊模式樣式 (Route Planning Click Mode Styles) */
  .route-planning-click-mode-active,
  .route-planning-click-mode-active * {
    cursor: crosshair !important;
  }

  /* 🗺️ 路徑優化按鈕樣式 (Route Optimization Button Styles) */
  .my-btn-purple {
    background-color: var(--my-color-purple, #9c27b0);
    border-color: var(--my-color-purple, #9c27b0);
    color: white;
  }

  .my-btn-purple:hover {
    background-color: var(--my-color-purple-hover, #7b1fa2);
    border-color: var(--my-color-purple-hover, #7b1fa2);
    color: white;
  }

  /* 🗺️ 路徑優化點擊模式樣式 (Route Optimization Click Mode Styles) */
  .route-optimization-click-mode-active,
  .route-optimization-click-mode-active * {
    cursor: crosshair !important;
  }

  /* 🗺️ 移除 tooltip 樣式 - 不再使用 tooltip */
</style>
