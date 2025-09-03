<script>
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
      'feature-selected',
      'open-distance-modal',
      'open-isochrone-modal',
      'highlight-on-map',
    ],

    // 🔧 組件設定函數 (Component Setup Function)
    setup(props, { emit }) {
      // 📦 資料存儲實例 (Data Store Instance)
      const dataStore = useDataStore(); // 獲取 Pinia 資料存儲實例
      const defineStore = useDefineStore(); // 獲取定義存儲實例

      // 🗺️ 地圖相關變數 (Map Related Variables)
      const mapContainer = ref(null); // 地圖容器 DOM 元素引用
      let mapInstance = null; // 地圖實例，使用普通變數而非 ref 避免響應式開銷
      let currentTileLayer = null; // 當前底圖圖層實例
      let layerGroups = {}; // 存放所有圖層群組的物件
      let isClickMode = ref(false); // 是否處於點擊模式
      let isIsochroneClickMode = ref(false); // 是否處於等時圈點擊模式
      let isRoutePlanningClickMode = ref(false); // 是否處於路徑規劃點擊模式
      let isRouteOptimizationClickMode = ref(false); // 是否處於路徑優化點擊模式

      // 🖱️ 右鍵菜單相關變數 (Context Menu Related Variables)
      const contextMenu = ref(null); // 右鍵菜單 DOM 引用
      const showContextMenu = ref(false); // 是否顯示右鍵菜單
      const contextMenuPosition = ref({ x: 0, y: 0 }); // 右鍵菜單位置
      const selectedAnalysisFeature = ref(null); // 選中的分析要素

      // 🎛️ 地圖控制狀態 (Map Control States)
      const isMapReady = ref(false); // 地圖是否已準備就緒的狀態標記
      /** 🗺️ 動態地圖容器 ID（避免多實例衝突） */
      const mapContainerId = ref(`leaflet-map-${Math.random().toString(36).substr(2, 9)}`);

      // 📊 計算屬性：檢查是否有任何圖層可見 (Computed Property: Check if Any Layer is Visible)
      const isAnyLayerVisible = computed(
        () => dataStore.getAllLayers().some((l) => l.visible && l.geoJsonData) // 檢查所有圖層中是否有可見且有資料的圖層
      );

      // 🏗️ 創建地圖實例函數 (Create Map Instance Function)
      const createMap = () => {
        // 檢查地圖容器是否存在
        if (!mapContainer.value) return false;

        // 檢查是否已經有地圖實例存在，避免重複創建
        if (mapInstance) {
          console.warn('[MapTab] 地圖實例已存在，跳過創建');
          return true;
        }

        // 檢查容器尺寸是否有效
        const rect = mapContainer.value.getBoundingClientRect(); // 獲取容器的邊界矩形
        if (rect.width === 0 || rect.height === 0) {
          // 如果寬度或高度為零
          console.warn('[MapTab] 容器尺寸為零，延遲初始化'); // 輸出警告訊息
          return false; // 返回失敗狀態
        }

        try {
          // 創建 Leaflet 地圖實例，使用 defineStore 中保存的視圖狀態
          mapInstance = L.map(mapContainer.value, {
            center: defineStore.mapView.center, // 使用保存的地圖中心點
            zoom: defineStore.mapView.zoom, // 使用保存的縮放等級
            zoomControl: false, // 禁用預設縮放控制項
            attributionControl: false, // 禁用預設版權資訊控制項
          });

          // 綁定地圖事件處理器
          mapInstance.on('zoomend', handleZoomEnd); // 縮放結束事件
          mapInstance.on('moveend', handleMoveEnd); // 移動結束事件

          // 綁定地圖點擊事件 - 點擊空白處清除選取或添加分析點
          mapInstance.on('click', function (e) {
            if (isClickMode.value) {
              // 如果處於數據分析點擊模式，發送事件到父組件顯示距離輸入 modal
              e.originalEvent.stopPropagation();
              emit('open-distance-modal', e.latlng.lat, e.latlng.lng);
              return false; // 阻止事件繼續傳播
            } else if (isIsochroneClickMode.value) {
              // 如果處於等時圈分析點擊模式，發送事件到父組件顯示等時分析 modal
              e.originalEvent.stopPropagation();
              emit('open-isochrone-modal', e.latlng.lat, e.latlng.lng);
              return false; // 阻止事件繼續傳播
            } else if (isRoutePlanningClickMode.value) {
              // 如果處於路徑規劃點擊模式，添加路徑規劃點並阻止其他事件
              e.originalEvent.stopPropagation();
              addRoutePlanningPoint(e.latlng.lat, e.latlng.lng);
              return false; // 阻止事件繼續傳播
            } else if (isRouteOptimizationClickMode.value) {
              // 如果處於路徑優化點擊模式，添加路徑優化點並阻止其他事件
              e.originalEvent.stopPropagation();
              addRouteOptimizationPoint(e.latlng.lat, e.latlng.lng);
              return false; // 阻止事件繼續傳播
            } else if (!e.originalEvent.target.closest('.leaflet-interactive')) {
              // 否則清除選取
              dataStore.setSelectedFeature(null);
              resetAllLayerStyles();
            }
          });

          // 移除分析圖層專用面板，讓圖層按加入順序自然顯示

          // 設定 popup 面板的 z-index
          mapInstance.getPane('popupPane').style.zIndex = 2200;

          // 設定地圖準備就緒狀態
          isMapReady.value = true; // 標記地圖已準備就緒

          // 如果已經處於點擊模式，確保樣式正確應用
          if (isClickMode.value) {
            const mapContainer = mapInstance.getContainer();
            mapContainer.style.cursor = 'crosshair';
            mapContainer.classList.add('click-mode-active');
          } else if (isIsochroneClickMode.value) {
            const mapContainer = mapInstance.getContainer();
            mapContainer.style.cursor = 'crosshair';
            mapContainer.classList.add('isochrone-click-mode-active');
          } else if (isRoutePlanningClickMode.value) {
            const mapContainer = mapInstance.getContainer();
            mapContainer.style.cursor = 'crosshair';
            mapContainer.classList.add('route-planning-click-mode-active');
          }

          console.log('[MapTab] 地圖創建成功'); // 輸出成功訊息
          return true; // 返回成功狀態
        } catch (error) {
          console.error('[MapTab] 地圖創建失敗:', error); // 輸出錯誤訊息
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
          // 保存地圖視圖狀態到 defineStore
          defineStore.setMapView([center.lat, center.lng], zoom);
          emit('update:zoomLevel', zoom); // 發送縮放等級更新事件
        }
      };

      // 處理移動結束事件
      const handleMoveEnd = () => {
        if (mapInstance) {
          // 確保地圖實例存在
          const center = mapInstance.getCenter();
          const zoom = mapInstance.getZoom();
          // 保存地圖視圖狀態到 defineStore
          defineStore.setMapView([center.lat, center.lng], zoom);
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
        const config = defineStore.basemaps.find((b) => b.value === defineStore.selectedBasemap);

        // 步驟三：只有在找到設定檔(config)且 URL 不是空值(falsy)時，才加入新的圖層
        // 由於空字串 '' 是 falsy 值，這個判斷式會自動過濾掉 url 為 '' 的情況。
        if (config && config.url) {
          currentTileLayer = L.tileLayer(config.url, { attribution: '' });
          currentTileLayer.addTo(mapInstance);
        }

        // 動態設定地圖容器背景色
        const mapContainerElement = mapContainer.value;
        if (mapContainerElement) {
          if (defineStore.selectedBasemap === 'blank') {
            // 空白地圖時設為白色背景
            mapContainerElement.style.backgroundColor = 'var(--my-color-white)';
          } else if (defineStore.selectedBasemap === 'black') {
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
            } else if (layer.isIsochroneAnalysisLayer) {
              if (feature.properties.type === 'isochrone-point-analysis') {
                // 等時圈分析點：藍色加號標記
                const icon = L.divIcon({
                  html: `
                  <div class="d-flex align-items-center justify-content-center my-color-blue my-font-size-sm">
                    <i class="fas fa-plus"></i>
                  </div>
                  `,
                  className: 'isochrone-analysis-point-icon',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                  popupAnchor: [0, -8],
                });
                const marker = L.marker(latlng, { icon });

                return marker;
              } else if (feature.properties.type === 'isochrone-circle-analysis') {
                // 等時圈分析圓圈：藍色圓圈（回退模式）
                const circle = L.circle(latlng, {
                  radius: feature.properties.radius,
                  color: 'var(--my-color-blue)',
                  weight: 1,
                  opacity: 0.8,
                  fillColor: 'var(--my-color-blue)',
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
              // 檢查是否為新基準中央服務紀錄且有路線順序
              if (feature.properties.routeOrder) {
                // 新基準中央服務紀錄點位：顯示路線順序
                const routeOrder = feature.properties.routeOrder;
                const icon = L.divIcon({
                  html: `
                  <div class="d-flex align-items-center justify-content-center my-font-size-xs fw-bold"
                       style="background: var(--my-color-${colorName}); color: white; border-radius: 50%; width: 20px; height: 20px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    ${routeOrder}
                  </div>
                  `,
                  className: 'service-route-point-icon',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                  popupAnchor: [0, -12],
                });
                return L.marker(latlng, { icon });
              } else {
                // 一般點類型
                const icon = L.divIcon({
                  html: `<div
                  class="rounded-circle"
                  style="
                     background-color: var(--my-color-${colorName});
                     width: 8px;
                     height: 8px;
                     box-shadow: 0 2px 6px rgba(0,0,0,0.3);
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
              return {
                color: feature.properties.strokeColor || 'var(--my-color-orange)', // 路線顏色
                weight: feature.properties.strokeWidth || 3, // 路線粗細
                opacity: feature.properties.strokeOpacity || 0.8, // 路線透明度
                lineCap: 'round', // 線條端點樣式
                lineJoin: 'round', // 線條連接樣式
                dashArray: null, // 實線
              };
            }
            // 路徑規劃路線的特殊樣式處理
            if (layer.isRoutePlanningLayer && feature.properties.type === 'route-line') {
              return {
                color: 'var(--my-color-orange)', // 橘色路線
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
              return {
                color: 'var(--my-color-purple)', // 紫色路線
                weight: 4, // 路線粗細
                opacity: 0.8, // 路線透明度
                lineCap: 'round', // 線條端點樣式
                lineJoin: 'round', // 線條連接樣式
                dashArray: null, // 實線
              };
            }
            // 等時圈多邊形的特殊樣式處理
            if (
              layer.isIsochroneAnalysisLayer &&
              feature.properties.type === 'isochrone-polygon-analysis'
            ) {
              return {
                color: 'var(--my-color-blue)',
                weight: 2,
                opacity: 0.8,
                fillColor: 'var(--my-color-blue)',
                fillOpacity: 0.3,
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
            } else if (layer.isIsochroneAnalysisLayer) {
              layer.bindPopup(
                `
                <div class="">
                  <div class="my-title-xs-gray pb-2">${layerName}</div>
                  <div class="my-content-sm-black">${feature.properties.name}</div>
                </div>
              `,
                {
                  className: 'isochrone-analysis-popup',
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
                  <div class="my-content-xs-gray">服務日期: ${feature.properties.serviceDate}</div>
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
                    <div class="my-content-xs-gray pt-1">總距離: ${feature.properties.distance} 公里</div>
                    <div class="my-content-xs-gray">預估時間: ${feature.properties.duration} 分鐘</div>
                    <div class="my-content-xs-gray">路徑點數: ${feature.properties.waypoints} 個</div>
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
                // 新基準中央服務紀錄點位的彈窗
                layer.bindPopup(
                  `
                  <div class="">
                    <div class="my-title-xs-gray pb-2">${layerName}</div>
                    <div class="my-content-sm-black">${feature.properties.name}</div>
                    <div class="my-content-xs-gray pt-1">路線順序: ${feature.properties.routeOrder}</div>
                    <div class="my-content-xs-gray">服務時間: ${feature.properties.propertyData.服務時間}</div>
                    <div class="my-content-xs-gray">居住地址: ${feature.properties.propertyData.個案居住地址}</div>
                  </div>
                `,
                  {
                    className: 'service-route-point-popup',
                    offset: [0, -5],
                    closeButton: true,
                    autoClose: false,
                    closeOnClick: false,
                  }
                );
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

            // 綁定滑鼠事件
            layer.on({
              // 滑鼠懸停事件
              mouseover: function () {
                // 如果處於點擊模式，禁用 hover 效果
                if (
                  isClickMode.value ||
                  isIsochroneClickMode.value ||
                  isRoutePlanningClickMode.value
                ) {
                  return;
                }

                // 分析圖層的特殊處理
                if (layer.isAnalysisLayer || feature.properties.layerId === 'analysis-layer') {
                  if (feature.properties.type === 'point-analysis') {
                    // 分析點不需要懸停效果，直接返回
                    return;
                  } else if (feature.properties.type === 'circle-analysis') {
                    // 分析圓圈懸停效果
                    if (!this._originalStyle) {
                      this._originalStyle = {
                        weight: this.options.weight,
                        color: this.options.color,
                        fillOpacity: this.options.fillOpacity,
                      };
                    }
                    this.setStyle({
                      weight: 2,
                      fillOpacity: 0.4,
                    });
                  }
                } else if (
                  layer.isIsochroneAnalysisLayer ||
                  feature.properties.layerId === 'isochrone-analysis-layer'
                ) {
                  if (feature.properties.type === 'isochrone-point-analysis') {
                    // 等時圈分析點不需要懸停效果，直接返回
                    return;
                  } else if (feature.properties.type === 'isochrone-circle-analysis') {
                    // 等時圈分析圓圈懸停效果
                    if (!this._originalStyle) {
                      this._originalStyle = {
                        weight: this.options.weight,
                        color: this.options.color,
                        fillOpacity: this.options.fillOpacity,
                      };
                    }
                    this.setStyle({
                      weight: 2,
                      fillOpacity: 0.4,
                    });
                  } else if (feature.properties.type === 'isochrone-polygon-analysis') {
                    // 等時圈多邊形懸停效果
                    if (!this._originalStyle) {
                      this._originalStyle = {
                        weight: this.options.weight,
                        color: this.options.color,
                        fillOpacity: this.options.fillOpacity,
                      };
                    }
                    this.setStyle({
                      weight: 3,
                      fillOpacity: 0.5,
                    });
                  }
                } else if (
                  layer.isRoutePlanningLayer ||
                  feature.properties.layerId === 'route-planning-layer'
                ) {
                  if (feature.properties.type === 'route-planning-point') {
                    // 路徑規劃點不需要懸停效果，直接返回
                    return;
                  } else if (feature.properties.type === 'route-line') {
                    // 路徑規劃路線懸停效果
                    if (!this._originalStyle) {
                      this._originalStyle = {
                        weight: this.options.weight,
                        color: this.options.color,
                        opacity: this.options.opacity,
                      };
                    }
                    this.setStyle({
                      weight: 6, // 加粗路線
                      opacity: 1.0, // 增加透明度
                      color: 'var(--my-color-orange-hover)', // 使用深橘色
                    });
                    this.bringToFront(); // 置於最前層
                  }
                } else if (type === 'point') {
                  // 一般點類型處理
                  const element = this.getElement();
                  if (element) {
                    const innerIconDiv = element.querySelector('div');
                    if (innerIconDiv) {
                      innerIconDiv.style.transition = 'transform 0.04s ease-in-out';
                      innerIconDiv.style.transform = 'scale(1.6)';
                    }
                  }
                } else if (type === 'polygon' && feature.properties.fillColor !== null) {
                  // 多邊形類型處理
                  if (!this._originalStyle) {
                    this._originalStyle = {
                      weight: this.options.weight,
                      color: this.options.color,
                      fillOpacity: this.options.fillOpacity,
                    };
                  }
                  this.setStyle({
                    weight: 4,
                    color: 'white',
                    fillOpacity: 0.8,
                  });
                  this.bringToFront();
                }
              },
              // 滑鼠離開事件
              mouseout: function () {
                // 如果處於點擊模式，禁用 hover 效果
                if (
                  isClickMode.value ||
                  isIsochroneClickMode.value ||
                  isRoutePlanningClickMode.value
                ) {
                  return;
                }

                // 只有在沒有被選中的情況下才恢復原始樣式
                const isSelected =
                  dataStore.selectedFeature &&
                  dataStore.selectedFeature.properties.id === feature.properties.id;

                if (!isSelected) {
                  // 分析圖層的特殊處理
                  if (layer.isAnalysisLayer || feature.properties.layerId === 'analysis-layer') {
                    if (feature.properties.type === 'point-analysis') {
                      // 分析點不需要恢復效果，直接返回
                      return;
                    } else if (feature.properties.type === 'circle-analysis') {
                      // 分析圓圈恢復
                      if (this._originalStyle) {
                        this.setStyle(this._originalStyle);
                      }
                    }
                  } else if (
                    layer.isIsochroneAnalysisLayer ||
                    feature.properties.layerId === 'isochrone-analysis-layer'
                  ) {
                    if (feature.properties.type === 'isochrone-point-analysis') {
                      // 等時圈分析點不需要恢復效果，直接返回
                      return;
                    } else if (feature.properties.type === 'isochrone-circle-analysis') {
                      // 等時圈分析圓圈恢復
                      if (this._originalStyle) {
                        this.setStyle(this._originalStyle);
                      }
                    } else if (feature.properties.type === 'isochrone-polygon-analysis') {
                      // 等時圈多邊形恢復
                      if (this._originalStyle) {
                        this.setStyle(this._originalStyle);
                      }
                    }
                  } else if (
                    layer.isRoutePlanningLayer ||
                    feature.properties.layerId === 'route-planning-layer'
                  ) {
                    if (feature.properties.type === 'route-planning-point') {
                      // 路徑規劃點不需要恢復效果，直接返回
                      return;
                    } else if (feature.properties.type === 'route-line') {
                      // 路徑規劃路線恢復
                      if (this._originalStyle) {
                        this.setStyle(this._originalStyle);
                      }
                    }
                  } else if (type === 'point') {
                    // 一般點類型處理
                    const element = this.getElement();
                    if (element) {
                      const innerIconDiv = element.querySelector('div');
                      if (innerIconDiv) {
                        innerIconDiv.style.transform = '';
                      }
                    }
                  } else if (type === 'polygon') {
                    // 多邊形類型處理
                    if (this._originalStyle) {
                      this.setStyle(this._originalStyle);
                    } else {
                      geoJsonLayer.resetStyle(this);
                    }
                  }
                }
              },
              // 點擊事件
              click: function (e) {
                // 如果處於數據分析點擊模式，阻止圖層選擇並添加分析點
                if (isClickMode.value) {
                  e.originalEvent.stopPropagation();
                  addAnalysisPoint(e.latlng.lat, e.latlng.lng);
                  return false;
                }

                // 如果處於等時圈分析點擊模式，阻止圖層選擇並添加等時圈分析點
                if (isIsochroneClickMode.value) {
                  e.originalEvent.stopPropagation();
                  addIsochroneAnalysisPoint(e.latlng.lat, e.latlng.lng);
                  return false;
                }

                // 如果處於路徑規劃點擊模式，阻止圖層選擇並添加路徑規劃點
                if (isRoutePlanningClickMode.value) {
                  e.originalEvent.stopPropagation();
                  addRoutePlanningPoint(e.latlng.lat, e.latlng.lng);
                  return false; // 阻止事件繼續傳播
                }

                // 如果處於路徑優化點擊模式，阻止圖層選擇並添加路徑優化點
                if (isRouteOptimizationClickMode.value) {
                  e.originalEvent.stopPropagation();
                  addRouteOptimizationPoint(e.latlng.lat, e.latlng.lng);
                  return false; // 阻止事件繼續傳播
                }

                // 分析點不參與選擇，直接返回
                if (
                  (layer.isAnalysisLayer || feature.properties.layerId === 'analysis-layer') &&
                  feature.properties.type === 'point-analysis'
                ) {
                  return;
                }

                // 等時圈分析點不參與選擇，直接返回
                if (
                  (layer.isIsochroneAnalysisLayer ||
                    feature.properties.layerId === 'isochrone-analysis-layer') &&
                  feature.properties.type === 'isochrone-point-analysis'
                ) {
                  return;
                }

                dataStore.setSelectedFeature(feature); // 設定選中的要素到資料存儲
                emit('feature-selected', feature); // 發送要素選中事件
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

                // 只有等時圈分析圖層的圓圈或多邊形才顯示右鍵菜單
                if (
                  (layer.isIsochroneAnalysisLayer ||
                    feature.properties.layerId === 'isochrone-analysis-layer') &&
                  (feature.properties.type === 'isochrone-circle-analysis' ||
                    feature.properties.type === 'isochrone-polygon-analysis')
                ) {
                  showIsochroneAnalysisContextMenu(e.originalEvent, feature);
                }
              },
            });
          },
        });

        return geoJsonLayer; // 返回創建的 GeoJSON 圖層
      };

      // 🔄 重設所有圖層樣式函數 (Reset All Layer Styles Function)
      const resetAllLayerStyles = () => {
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
                  // 一般點類型處理
                  const element = layer.getElement();
                  if (element) {
                    const innerIconDiv = element.querySelector('div');
                    if (innerIconDiv) {
                      innerIconDiv.style.transform = '';
                    }
                  }
                } else if (type === 'polygon') {
                  // 多邊形類型處理
                  if (layer._originalStyle) {
                    layer.setStyle(layer._originalStyle);
                  } else if (layerGroup.resetStyle) {
                    layerGroup.resetStyle(layer);
                  }
                }
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

        console.log(`🔄 圖層同步: 新增 ${newLayerIds.length} 個, 移除 ${layersToRemove.length} 個`);

        // 只移除不可見的圖層，避免不必要的重新渲染
        layersToRemove.forEach((layerId) => {
          if (layerGroups[layerId]) {
            mapInstance.removeLayer(layerGroups[layerId]);
            delete layerGroups[layerId];
            console.log(`🗺️ 移除圖層: ${layerId}`);
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

                console.log(`🗺️ 圖層 "${layer.layerName}" 已添加到地圖`);
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
              console.log(`🎯 自動縮放到新添加的 ${newAddedLayers.length} 個圖層範圍`);
            }, 200); // 稍微延遲確保圖層完全載入
          }
        }

        // 計算並更新標記總數
        const totalMarkers = Object.values(layerGroups).reduce(
          (acc, layer) => acc + (layer.getLayers ? layer.getLayers().length : 0), // 累加每個圖層的要素數量
          0 // 初始值為 0
        );
        emit('update:activeMarkers', totalMarkers); // 發送標記數量更新事件

        console.log(`🗺️ 圖層同步完成，共 ${visibleLayers.length} 個可見圖層`); // 輸出同步完成訊息
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

        console.log(`🌍 顯示全市: 中心點 ${defaultCenter}, 縮放等級 ${defaultZoom}`);

        // 回到預設的地圖中心和縮放等級
        mapInstance.setView(defaultCenter, defaultZoom);

        // 同時更新 defineStore 中的值，保持一致性
        defineStore.setMapView(defaultCenter, defaultZoom);
      };

      // 🎯 高亮顯示特定要素函數 (Highlight Specific Feature Function)
      const highlightFeature = (highlightData) => {
        console.log('🎯 MapTab: 開始高亮顯示要素:', highlightData); // 輸出開始高亮的訊息

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
          console.log('🎯 處理服務人員高亮事件:', highlightData);

          // 將地圖中心移動到第一個服務點
          if (highlightData.firstServicePoint) {
            const { lat, lon } = highlightData.firstServicePoint;

            // 只有當有座標時才移動地圖和創建標記
            if (lat && lon) {
              mapInstance.setView([lat, lon], 15); // 縮放到 15 級別

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
              console.log('⚠️ 第一個服務點沒有座標，無法在地圖上顯示');
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

          console.log('✅ 服務人員高亮事件處理完成，退出函數');
          return; // 確保退出函數
        }

        // 檢查高亮資料是否為物件格式
        if (typeof highlightData === 'object' && highlightData !== null) {
          targetLayerId = highlightData.layerId; // 從物件中獲取圖層 ID
          targetFeatureId = highlightData.id; // 從物件中獲取要素 ID
        } else {
          targetFeatureId = highlightData; // 直接使用作為要素 ID
        }

        console.log(`🔍 尋找要素: layerId="${targetLayerId}", featureId="${targetFeatureId}"`); // 輸出搜尋資訊
        console.log('🔍 可用的圖層群組:', Object.keys(layerGroups)); // 輸出可用圖層列表

        // 執行高亮顯示的核心邏輯函數
        const performHighlight = () => {
          // 重置所有圖層樣式
          resetAllLayerStyles();

          // 初始化目標要素搜尋變數
          let targetLayer = null; // 目標圖層實例
          let targetFeature = null; // 目標要素物件

          // 如果指定了圖層 ID，在特定圖層中搜尋
          if (targetLayerId && layerGroups[targetLayerId]) {
            console.log(`🔍 在指定圖層 "${targetLayerId}" 中尋找要素`); // 輸出搜尋訊息
            const specificLayerGroup = layerGroups[targetLayerId]; // 獲取指定圖層群組

            // 遍歷圖層中的每個要素
            specificLayerGroup.eachLayer((layer) => {
              const feature = layer.feature; // 獲取要素物件
              if (feature && feature.properties) {
                // 檢查要素是否有屬性
                // 獲取要素 ID
                const featureId = feature.properties.id;

                console.log(`🔍 檢查要素 ID: ${featureId} (目標: ${targetFeatureId})`); // 輸出檢查訊息

                // 比較要素 ID（轉換為字串進行比較）
                if (String(featureId) === String(targetFeatureId)) {
                  targetLayer = layer; // 設定目標圖層
                  targetFeature = feature; // 設定目標要素
                  console.log(`✅ 在圖層 "${targetLayerId}" 中找到要素 "${targetFeatureId}"`); // 輸出找到訊息
                  return;
                }
              }
            });
          } else {
            console.log('🔍 在所有圖層中尋找要素'); // 輸出搜尋訊息
            // 在所有圖層中尋找要素
            for (const [layerId, layerGroup] of Object.entries(layerGroups)) {
              console.log(`🔍 檢查圖層: ${layerId}`); // 輸出當前檢查的圖層
              // 遍歷圖層中的每個要素
              layerGroup.eachLayer((layer) => {
                const feature = layer.feature; // 獲取要素物件
                if (feature && feature.properties) {
                  // 檢查要素是否有屬性
                  const featureId = feature.properties.id; // 獲取要素 ID

                  console.log(`🔍 檢查要素 ID: ${featureId} (目標: ${targetFeatureId})`); // 輸出檢查訊息

                  // 比較要素 ID（轉換為字串進行比較）
                  if (String(featureId) === String(targetFeatureId)) {
                    targetLayer = layer; // 設定目標圖層
                    targetFeature = feature; // 設定目標要素
                    targetLayerId = layerId; // 設定目標圖層 ID
                    console.log(`✅ 在圖層 "${layerId}" 中找到要素 "${targetFeatureId}"`); // 輸出找到訊息
                    return;
                  }
                }
              });
              if (targetLayer) break; // 如果找到目標圖層，跳出迴圈
            }
          }

          // 如果找到目標圖層和要素，執行高亮顯示
          if (targetLayer && targetFeature) {
            // 設置選中的特徵到資料存儲
            dataStore.setSelectedFeature(targetFeature); // 更新選中要素狀態
            console.log('🎯 設置選中特徵到 store'); // 輸出設置訊息

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
              mapInstance.fitBounds(bounds, {
                maxZoom: 16, // 最大縮放等級限制
                padding: [50, 50], // 邊界內邊距
              });

              // 延遲打開彈窗以確保地圖移動完成
              setTimeout(() => {
                if (targetLayer.openPopup) {
                  // 檢查圖層是否有打開彈窗方法
                  targetLayer.openPopup(); // 打開彈窗
                }
              }, 500); // 延遲 500ms
            }

            console.log('✅ 顯示位置功能完成'); // 輸出完成訊息
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
          console.log('🔄 第一次高亮顯示失敗，1秒後重試...'); // 輸出重試訊息
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
                        console.log('🗺️ 地圖尺寸已延遲刷新');
                      }
                    }
                  }, 100);
                  return;
                }
              }

              mapInstance.invalidateSize(); // 刷新地圖尺寸
              console.log('🗺️ 地圖尺寸已刷新'); // 輸出成功訊息
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

      // 加入分析點
      const addAnalysisPoint = (lat, lng) => {
        dataStore.addAnalysisPoint(lat, lng);
      };

      // 加入等時圈分析點
      const addIsochroneAnalysisPoint = async (lat, lng) => {
        try {
          await dataStore.addIsochroneAnalysisPoint(lat, lng);
        } catch (error) {
          console.error('添加等時圈分析點失敗:', error);
        }
      };

      // 開始點擊模式
      const startClickMode = () => {
        // 🔄 互斥邏輯：關閉其他點擊模式
        if (isIsochroneClickMode.value) {
          stopIsochroneClickMode();
        }
        if (isRoutePlanningClickMode.value) {
          finishRoutePlanningClickMode();
        }

        isClickMode.value = true;
        if (mapInstance) {
          const mapContainer = mapInstance.getContainer();
          mapContainer.style.cursor = 'crosshair';
          // 為所有子元素設定十字游標
          mapContainer.classList.add('click-mode-active');
        }
        console.log('🖱️ 開始數據分析點擊模式（自動關閉等時圈分析模式）');
      };

      // 停止點擊模式
      const stopClickMode = () => {
        isClickMode.value = false;
        if (mapInstance) {
          const mapContainer = mapInstance.getContainer();
          mapContainer.style.cursor = '';
          // 移除十字游標類別
          mapContainer.classList.remove('click-mode-active');
        }
        console.log('🛑 停止地圖點擊模式');
      };

      // 開始等時圈點擊模式
      const startIsochroneClickMode = () => {
        // 🔄 互斥邏輯：關閉其他點擊模式
        if (isClickMode.value) {
          stopClickMode();
        }
        if (isRoutePlanningClickMode.value) {
          finishRoutePlanningClickMode();
        }

        isIsochroneClickMode.value = true;
        if (mapInstance) {
          const mapContainer = mapInstance.getContainer();
          mapContainer.style.cursor = 'crosshair';
          // 為所有子元素設定十字游標
          mapContainer.classList.add('isochrone-click-mode-active');
        }
        console.log('🖱️ 開始等時圈分析點擊模式（自動關閉數據分析模式）');
      };

      // 停止等時圈點擊模式
      const stopIsochroneClickMode = () => {
        isIsochroneClickMode.value = false;
        if (mapInstance) {
          const mapContainer = mapInstance.getContainer();
          mapContainer.style.cursor = '';
          // 移除十字游標類別
          mapContainer.classList.remove('isochrone-click-mode-active');
        }
        console.log('🛑 停止等時圈分析點擊模式');
      };

      // 🗺️ ============ 路徑規劃點擊模式相關函數 (Route Planning Click Mode Functions) ============

      // 添加路徑規劃點
      const addRoutePlanningPoint = async (lat, lng) => {
        try {
          const pointId = dataStore.addRoutePlanningPoint(lat, lng);
          if (pointId) {
            console.log('🗺️ 成功添加路徑規劃點:', pointId);
          }
        } catch (error) {
          console.error('添加路徑規劃點失敗:', error);
        }
      };

      // 開始路徑規劃點擊模式
      const startRoutePlanningClickMode = () => {
        // 🔄 互斥邏輯：關閉其他點擊模式
        if (isClickMode.value) {
          stopClickMode();
        }
        if (isIsochroneClickMode.value) {
          stopIsochroneClickMode();
        }

        isRoutePlanningClickMode.value = true;
        if (mapInstance) {
          const mapContainer = mapInstance.getContainer();
          mapContainer.style.cursor = 'crosshair';
          // 為所有子元素設定十字游標
          mapContainer.classList.add('route-planning-click-mode-active');
        }
        console.log('🖱️ 開始路徑規劃點擊模式（自動關閉其他分析模式）');
      };

      // 完成路徑規劃點選（替代停止函數）
      const finishRoutePlanningClickMode = async () => {
        isRoutePlanningClickMode.value = false;
        if (mapInstance) {
          const mapContainer = mapInstance.getContainer();
          mapContainer.style.cursor = '';
          // 移除十字游標類別
          mapContainer.classList.remove('route-planning-click-mode-active');
        }

        // 獲取當前路徑規劃點數量
        const coordinates = dataStore.getRoutePlanningCoordinates();
        console.log(`🛑 完成路徑規劃點選，共選擇了 ${coordinates.length} 個路徑點`);

        // 執行路徑規劃計算
        if (coordinates.length >= 2) {
          console.log('📍 路徑規劃點坐標:', coordinates);
          console.log('🚀 開始計算最佳路線...');

          try {
            // 調用路徑規劃 API 並繪製路線
            const routeResult = await dataStore.calculateAndDrawRoute('driving-car');

            if (routeResult) {
              console.log('✅ 路徑規劃成功完成！');
              console.log(`📏 路線總距離: ${routeResult.distance} 公里`);
              console.log(`⏱️ 預估行車時間: ${routeResult.duration} 分鐘`);
              console.log(`🚗 交通方式: 駕車`);

              // 路徑規劃完成，不顯示彈窗，只在控制台記錄
              console.log(`🎉 路線 ${routeResult.routeNumber || '新增'} 已保存完成`);
              console.log(`📍 可以繼續添加下一條路線`);
            } else {
              console.warn('⚠️ 路徑規劃計算失敗');
              alert('路徑規劃失敗，請檢查路徑點是否有效或網路連線。');
            }
          } catch (error) {
            console.error('❌ 路徑規劃過程中發生錯誤:', error);
            alert(`路徑規劃失敗: ${error.message}`);
          }
        } else if (coordinates.length === 1) {
          console.log('⚠️ 路徑規劃至少需要2個點，目前只有1個點');
          alert('路徑規劃至少需要2個路徑點，請添加更多路徑點。');
        } else {
          console.log('⚠️ 沒有選擇任何路徑規劃點');
          alert('請先在地圖上選擇路徑點。');
        }
      };

      // 🗑️ 清除分析圖層 (Clear Analysis Layer)
      const clearAnalysisLayer = () => {
        // 調用 dataStore 的方法清除分析圖層
        dataStore.clearAnalysisLayer();
        console.log('🗑️ 清除分析圖層');
      };

      // 🗺️ ============ 路徑優化點擊模式相關函數 (Route Optimization Click Mode Functions) ============

      // 添加路徑優化點
      const addRouteOptimizationPoint = async (lat, lng) => {
        try {
          const pointId = dataStore.addRouteOptimizationPoint(lat, lng);
          if (pointId) {
            console.log('🗺️ 成功添加路徑優化點:', pointId);
          }
        } catch (error) {
          console.error('添加路徑優化點失敗:', error);
        }
      };

      // 開始路徑優化點擊模式
      const startRouteOptimizationClickMode = () => {
        // 🔄 互斥邏輯：關閉其他點擊模式
        if (isClickMode.value) {
          stopClickMode();
        }
        if (isIsochroneClickMode.value) {
          stopIsochroneClickMode();
        }
        if (isRoutePlanningClickMode.value) {
          finishRoutePlanningClickMode();
        }

        // 開啟路徑優化點擊模式
        isRouteOptimizationClickMode.value = true;

        if (mapInstance) {
          const mapContainer = mapInstance.getContainer();
          mapContainer.style.cursor = 'crosshair';
          // 為所有子元素設定十字游標
          mapContainer.classList.add('route-optimization-click-mode-active');
        }

        // 清空之前的路徑優化點
        dataStore.clearRouteOptimizationLayer();

        console.log('🖱️ 開始路徑優化點擊模式（自動關閉其他分析模式）');
        // 路徑優化點擊模式開始，不顯示彈窗，只在控制台記錄
      };

      // 完成路徑優化點選
      const finishRouteOptimizationClickMode = async () => {
        if (!isRouteOptimizationClickMode.value) {
          console.warn('⚠️ 當前不在路徑優化點擊模式');
          return;
        }

        // 停止路徑優化點擊模式
        isRouteOptimizationClickMode.value = false;
        isClickMode.value = false;
        isIsochroneClickMode.value = false;
        isRoutePlanningClickMode.value = false;

        if (mapInstance) {
          const mapContainer = mapInstance.getContainer();
          mapContainer.style.cursor = '';
          // 移除十字游標類別
          mapContainer.classList.remove('route-optimization-click-mode-active');
        }

        // 獲取當前路徑優化點數量
        const coordinates = dataStore.getRouteOptimizationCoordinates();
        if (coordinates.length >= 2) {
          console.log(`🛑 完成路徑優化點選，共選擇了 ${coordinates.length} 個優化點`);

          try {
            // 執行路徑優化計算
            const optimizationResult = await dataStore.calculateAndDrawOptimizedRoute();
            if (optimizationResult) {
              console.log('✅ 路徑優化成功完成！');
              console.log('📍 路徑優化點坐標:', coordinates);
              console.log('📏 優化後距離:', optimizationResult.distance, '公里');
              console.log('⏱️ 優化後時間:', optimizationResult.duration, '分鐘');
              console.log('🔄 優化順序:', optimizationResult.optimizedOrder);

              // 顯示路徑優化結果
              console.log(`🎉 優化路線 ${optimizationResult.routeNumber || '新增'} 已保存完成`);
              console.log(`📍 可以繼續添加下一條優化路線`);

              // 路徑優化完成，不顯示彈窗，只在控制台記錄
            } else {
              console.warn('⚠️ 路徑優化計算失敗');
              alert('路徑優化失敗，請檢查優化點是否有效或網路連線。');
            }
          } catch (error) {
            console.error('❌ 路徑優化過程中發生錯誤:', error);
            alert(`路徑優化失敗: ${error.message}`);
          }
        } else if (coordinates.length === 1) {
          console.log('⚠️ 路徑優化至少需要2個點，目前只有1個點');
          alert('路徑優化至少需要2個優化點，請添加更多優化點。');
        } else {
          console.log('⚠️ 沒有選擇任何路徑優化點');
        }
      };

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

        console.log('🖱️ 顯示分析要素右鍵菜單:', feature.properties.name);
      };

      // 🖱️ 顯示等時圈分析右鍵菜單 (Show Isochrone Analysis Context Menu)
      const showIsochroneAnalysisContextMenu = (event, feature) => {
        event.preventDefault();
        event.stopPropagation();

        selectedAnalysisFeature.value = feature;
        contextMenuPosition.value = {
          x: event.pageX || event.clientX,
          y: event.pageY || event.clientY,
        };
        showContextMenu.value = true;

        console.log('🖱️ 顯示等時圈分析要素右鍵菜單:', feature.properties.name);
      };

      // 🗑️ 刪除單個分析點 (Delete Single Analysis Point)
      const deleteAnalysisPoint = () => {
        if (!selectedAnalysisFeature.value) return;

        const feature = selectedAnalysisFeature.value;
        const layerId = feature.properties.layerId;

        let pointId;
        if (feature.properties.type === 'circle-analysis') {
          pointId = feature.properties.id;
        } else if (feature.properties.type === 'isochrone-circle-analysis') {
          pointId = feature.properties.id;
        } else if (feature.properties.type === 'isochrone-polygon-analysis') {
          pointId = feature.properties.id;
        } else {
          pointId = feature.properties.parentId;
        }

        if (!pointId) return;

        // 根據圖層類型調用對應的刪除方法
        if (layerId === 'analysis-layer') {
          dataStore.deleteAnalysisPoint(pointId);
          console.log('🗑️ 刪除分析點:', pointId);
        } else if (layerId === 'isochrone-analysis-layer') {
          dataStore.deleteIsochroneAnalysisPoint(pointId);
          console.log('🗑️ 刪除等時圈分析點:', pointId);
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
            for (let entry of entries) {
              // 遍歷所有變化的元素
              console.log('🔄 地圖容器大小變化:', entry.contentRect); // 輸出容器尺寸變化資訊

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
          console.log('✅ ResizeObserver 已設置'); // 輸出設置成功訊息
        }
      };

      // 🔄 切換底圖函數 (Change Basemap Function)
      const changeBasemap = (basemapType) => {
        defineStore.setSelectedBasemap(basemapType); // 使用 store action 更新底圖狀態
        setBasemap(); // 應用底圖變更
      };

      // 🏷️ 獲取底圖標籤函數 (Get Basemap Label Function)
      const getBasemapLabel = (value) => {
        // 從 defineStore 中獲取底圖標籤
        const basemap = defineStore.basemaps.find((b) => b.value === value);
        return basemap ? basemap.label : value;
      };

      // 🚀 初始化地圖函數 (Initialize Map Function)
      const initMap = () => {
        // 檢查是否已經有地圖實例存在，避免重複初始化
        if (mapInstance && isMapReady.value) {
          console.warn('[MapTab] 地圖已初始化，跳過重複初始化');
          return;
        }

        let attempts = 0; // 初始化嘗試次數計數器
        const maxAttempts = 20; // 最大嘗試次數

        // 嘗試初始化函數
        const tryInit = () => {
          if (attempts >= maxAttempts) {
            // 如果超過最大嘗試次數
            console.error('[MapTab] 地圖初始化超時'); // 輸出超時錯誤
            return;
          }

          attempts++; // 增加嘗試次數

          if (createMap()) {
            // 嘗試創建地圖
            setBasemap(); // 設定底圖
            syncLayers(); // 同步圖層
          } else {
            setTimeout(tryInit, 100); // 延遲 100ms 後重試
          }
        };

        tryInit(); // 開始嘗試初始化
      };

      // 🔄 生命週期：組件掛載 (Lifecycle: Component Mounted)
      onMounted(() => {
        nextTick(() => {
          // 等待 DOM 更新完成
          setTimeout(() => {
            // 延遲執行確保容器準備就緒
            initMap(); // 初始化地圖
            // 地圖初始化完成後設置 ResizeObserver
            setTimeout(setupResizeObserver, 500); // 延遲 500ms 設置尺寸觀察器
          }, 100); // 延遲 100ms
        });

        // 🖱️ 添加全域點擊事件監聽器，用於隱藏右鍵菜單
        document.addEventListener('click', hideContextMenu);
      });

      // 🧹 生命週期：組件卸載 (Lifecycle: Component Unmounted)
      onUnmounted(() => {
        // 清理 ResizeObserver 和相關計時器
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
          resizeTimeout = null;
        }

        if (resizeObserver) {
          // 如果 ResizeObserver 存在
          resizeObserver.disconnect(); // 停止觀察
          resizeObserver = null; // 清空引用
          console.log('🧹 ResizeObserver 已清理'); // 輸出清理訊息
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
        () => defineStore.selectedBasemap,
        () => {
          if (isMapReady.value) {
            setBasemap(); // 當底圖變化時重新設定
          }
        }
      );

      // 📤 返回組件公開的屬性和方法 (Return Component Public Properties and Methods)
      return {
        mapContainer, // 地圖容器 DOM 元素引用
        mapContainerId, // 動態地圖容器 ID
        selectedBasemap: computed(() => defineStore.selectedBasemap), // 選定的底圖類型響應式變數
        changeBasemap, // 切換底圖函數
        getBasemapLabel, // 獲取底圖標籤函數
        showAllFeatures, // 顯示全部要素函數
        showFullCity, // 顯示全市函數
        isAnyLayerVisible, // 檢查是否有可見圖層的計算屬性
        highlightFeature, // 高亮顯示特定要素函數
        invalidateSize, // 刷新地圖尺寸函數
        startClickMode, // 開始點擊模式函數
        stopClickMode, // 停止點擊模式函數
        startIsochroneClickMode, // 開始等時圈點擊模式函數
        stopIsochroneClickMode, // 停止等時圈點擊模式函數
        startRoutePlanningClickMode, // 開始路徑規劃點擊模式函數
        finishRoutePlanningClickMode, // 完成路徑規劃點選函數

        // 🗺️ 路徑優化點擊模式相關函數
        startRouteOptimizationClickMode, // 開始路徑優化點擊模式函數
        finishRouteOptimizationClickMode, // 完成路徑優化點選函數

        clearAnalysisLayer, // 清除分析圖層函數
        isClickMode, // 點擊模式狀態
        isIsochroneClickMode, // 等時圈點擊模式狀態
        isRoutePlanningClickMode, // 路徑規劃點擊模式狀態
        isRouteOptimizationClickMode, // 路徑優化點擊模式狀態
        defineStore, // 定義存儲實例
        // 右鍵菜單相關
        contextMenu, // 右鍵菜單 DOM 引用
        showContextMenu, // 是否顯示右鍵菜單
        contextMenuPosition, // 右鍵菜單位置
        selectedAnalysisFeature, // 選中的分析要素
        deleteAnalysisPoint, // 刪除分析點函數
        hideContextMenu, // 隱藏右鍵菜單函數
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
      'click-mode-active': isClickMode,
      'isochrone-click-mode-active': isIsochroneClickMode,
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
            <li v-for="basemap in defineStore.basemaps" :key="basemap.value">
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

      <!-- 點選數據分析位置 -->
      <button
        v-if="!isClickMode"
        class="btn rounded-pill border-0 my-btn-green my-font-size-xs text-nowrap my-cursor-pointer"
        @click="startClickMode"
        title="在地圖上點選位置進行數據分析"
      >
        點選數據分析位置
      </button>
      <button
        v-else
        class="btn rounded-pill border-0 my-btn-red my-font-size-xs text-nowrap my-cursor-pointer"
        @click="stopClickMode"
        title="取消地圖點選"
      >
        取消地圖點選
      </button>

      <!-- 點選等時分析位置 -->
      <button
        v-if="!isIsochroneClickMode"
        class="btn rounded-pill border-0 my-btn-blue my-font-size-xs text-nowrap my-cursor-pointer"
        @click="startIsochroneClickMode"
        title="在地圖上點選位置進行等時圈分析"
      >
        點選等時分析位置
      </button>
      <button
        v-else
        class="btn rounded-pill border-0 my-btn-red my-font-size-xs text-nowrap my-cursor-pointer"
        @click="stopIsochroneClickMode"
        title="取消等時圈分析點選"
      >
        取消等時圈點選
      </button>

      <!-- 點選路徑規劃點 -->
      <button
        v-if="!isRoutePlanningClickMode"
        class="btn rounded-pill border-0 my-btn-orange my-font-size-xs text-nowrap my-cursor-pointer"
        @click="startRoutePlanningClickMode"
        title="在地圖上點選多個位置進行路徑規劃"
      >
        點選路徑規劃點
      </button>
      <button
        v-else
        class="btn rounded-pill border-0 my-btn-red my-font-size-xs text-nowrap my-cursor-pointer"
        @click="finishRoutePlanningClickMode"
        title="完成路徑規劃點選"
      >
        路徑規劃點選完成
      </button>

      <!-- 點選路徑優化點 -->
      <button
        v-if="!isRouteOptimizationClickMode"
        class="btn rounded-pill border-0 my-btn-purple my-font-size-xs text-nowrap my-cursor-pointer"
        @click="startRouteOptimizationClickMode"
        title="在地圖上點選多個位置進行路徑優化"
      >
        點選路徑優化點
      </button>
      <button
        v-else
        class="btn rounded-pill border-0 my-btn-red my-font-size-xs text-nowrap my-cursor-pointer"
        @click="finishRouteOptimizationClickMode"
        title="完成路徑優化點選"
      >
        路徑優化點選完成
      </button>
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

  /* 🎯 等時圈分析點圖標樣式 (Isochrone Analysis Point Icon Styles) */
  :deep(.isochrone-analysis-point-icon) {
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

  /* 🖱️ 等時圈點擊模式樣式 (Isochrone Click Mode Styles) */
  .isochrone-click-mode-active,
  .isochrone-click-mode-active * {
    cursor: crosshair !important;
  }

  /* 🗺️ 路徑規劃點擊模式樣式 (Route Planning Click Mode Styles) */
  .route-planning-click-mode-active,
  .route-planning-click-mode-active * {
    cursor: crosshair !important;
  }

  /* 🗺️ 路徑優化按鈕樣式 (Route Optimization Button Styles) */
  .my-btn-purple {
    background-color: var(--my-color-purple, #6f42c1);
    border-color: var(--my-color-purple, #6f42c1);
    color: white;
  }

  .my-btn-purple:hover {
    background-color: var(--my-color-purple-hover, #5a32a1);
    border-color: var(--my-color-purple-hover, #5a32a1);
    color: white;
  }

  /* 🗺️ 路徑優化點擊模式樣式 (Route Optimization Click Mode Styles) */
  .route-optimization-click-mode-active,
  .route-optimization-click-mode-active * {
    cursor: crosshair !important;
  }
</style>
