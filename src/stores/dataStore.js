import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { loadNewStandardCentralServiceData } from '../utils/dataProcessor.js';

// 主要數據存儲定義 (Main Data Store Definition)
export const useDataStore = defineStore(
  'data',
  () => {
    const layers = ref([
      {
        groupName: '新基準中央服務紀錄',
        groupLayers: [], // 動態添加服務人員圖層
      },
    ]);

    /**
     * D3.js category20b 顏色陣列
     * 對應輸入圖片中的顏色順序，提供20種不同的顏色給圖層使用
     * 順序：藍色系(4) -> 橘色系(4) -> 綠色系(4) -> 紫色系(4) -> 灰色系(4)
     */
    const layerColors = [
      'category20b-1', // #3182bd - 深藍
      'category20b-2', // #6baed6 - 中藍
      'category20b-3', // #9ecae1 - 淺藍
      'category20b-4', // #c6dbef - 極淺藍
      'category20b-5', // #e6550d - 深橘
      'category20b-6', // #fd8d3c - 中橘
      'category20b-7', // #fdae6b - 淺橘
      'category20b-8', // #fdd0a2 - 極淺橘
      'category20b-9', // #31a354 - 深綠
      'category20b-10', // #74c476 - 中綠
      'category20b-11', // #a1d99b - 淺綠
      'category20b-12', // #c7e9c0 - 極淺綠
      'category20b-13', // #756bb1 - 深紫
      'category20b-14', // #9e9ac8 - 中紫
      'category20b-15', // #bcbddc - 淺紫
      'category20b-16', // #dadaeb - 極淺紫
      'category20b-17', // #636363 - 深灰
      'category20b-18', // #969696 - 中灰
      'category20b-19', // #bdbdbd - 淺灰
      'category20b-20', // #d9d9d9 - 極淺灰
    ];

    // 注意：不再需要跨日期的顏色映射，每天重新按順序分配顏色
    // const serviceProviderColorMap = new Map(); // 已移除
    // const serviceProviderOrderArray = []; // 已移除

    // 注意：getColorForServiceProvider 函數已移除
    // 現在每天重新按照服務人員順序分配 category20b 顏色

    // 在新的分組結構中搜尋指定 ID 的圖層
    const findLayerById = (layerId) => {
      for (const group of layers.value) {
        for (const layer of group.groupLayers) {
          if (layer.layerId === layerId) {
            return layer;
          }
        }
      }
      return null;
    };

    // 從分組結構中提取所有圖層的扁平陣列
    const getAllLayers = () => {
      const allLayers = [];
      for (const group of layers.value) {
        allLayers.push(...group.groupLayers);
      }
      return allLayers;
    };

    // 控制圖層的顯示/隱藏，並在需要時自動載入資料
    const toggleLayerVisibility = async (layerId) => {
      console.log('🔧 DataStore: toggleLayerVisibility 被調用', layerId);
      const layer = findLayerById(layerId);
      if (!layer) {
        console.error(`Layer with id "${layerId}" not found.`);
        return;
      }

      console.log('🔧 DataStore: 找到圖層', layer.layerName, '當前狀態:', layer.visible);

      // 切換可見性狀態
      layer.visible = !layer.visible;
      console.log('🔧 DataStore: 新狀態:', layer.visible);

      // 注意：服務人員圖層的顏色已在載入時分配，不需要在這裡動態分配
      // 移除了原本的動態顏色分配邏輯

      // 服務人員圖層已經在創建時載入好了數據，這裡只需要處理可見性切換
      console.log(`🔄 圖層 "${layer.layerName}" 可見性切換為:`, layer.visible);
    };

    // 控制整個群組圖層的顯示/隱藏
    const toggleGroupVisibility = async (groupName) => {
      console.log('🔧 DataStore: toggleGroupVisibility 被調用', groupName);
      const group = layers.value.find((g) => g.groupName === groupName);
      if (!group) {
        console.error(`Group with name "${groupName}" not found.`);
        return;
      }

      // 檢查群組中是否有任何圖層為可見狀態
      const hasVisibleLayers = group.groupLayers.some((layer) => layer.visible);

      // 如果有可見圖層，則全部隱藏；如果沒有可見圖層，則全部顯示
      const newVisibility = !hasVisibleLayers;

      console.log(
        `🔧 DataStore: 群組 "${groupName}" 將 ${newVisibility ? '顯示' : '隱藏'} 所有圖層`
      );

      // 設置所有圖層的可見性
      group.groupLayers.forEach((layer) => {
        layer.visible = newVisibility;

        // 注意：服務人員圖層的顏色已在載入時分配，不需要在這裡動態分配
        // 移除了原本的動態顏色分配邏輯

        console.log(`🔄 圖層 "${layer.layerName}" 可見性設為:`, newVisibility);
      });
    };

    // 檢查群組是否有任何可見圖層
    const isGroupVisible = (groupName) => {
      const group = layers.value.find((g) => g.groupName === groupName);
      if (!group) return false;
      return group.groupLayers.some((layer) => layer.visible);
    };

    // ------------------------------------------------------------
    // 選中的地圖物件
    const selectedFeature = ref(null);

    // 📅 日期篩選狀態 (Date Filter State)
    const selectedServiceDate = ref('');
    const isDateFilterActive = ref(false);

    const setSelectedFeature = (feature) => {
      selectedFeature.value = feature;
    };

    const clearSelectedFeature = () => {
      selectedFeature.value = null;
    };

    // 📅 日期篩選相關方法 (Date Filter Methods)

    /**
     * 📅 設定服務日期篩選
     * @param {string} dateStr - 7碼日期字串 (例如: 1140701)
     */
    const setServiceDateFilter = (dateStr) => {
      selectedServiceDate.value = dateStr;
      isDateFilterActive.value = !!dateStr;
      console.log('📅 設定服務日期篩選:', dateStr);
    };

    /**
     * 📅 清除服務日期篩選
     */
    const clearServiceDateFilter = () => {
      selectedServiceDate.value = '';
      isDateFilterActive.value = false;
      console.log('📅 清除服務日期篩選');
    };

    /**
     * 📅 載入指定日期的服務人員圖層
     */
    const loadServiceProviderLayers = async (dateStr) => {
      try {
        console.log('📅 dataStore 接收到的日期參數:', dateStr);
        console.log('📅 將用此日期查詢 JSON 中的服務日期(請輸入7碼)');

        // 載入服務數據（不需要傳遞顏色映射，每天重新分配）
        const result = await loadNewStandardCentralServiceData(
          {
            layerId: '新基準中央服務紀錄',
            colorName: 'category20b-1', // 預設顏色，會在後面重新分配
            fileName: '新基準中央服務紀錄_all_2.json',
          },
          dateStr,
          null // 不再需要顏色映射
        );

        // 找到服務記錄群組
        const serviceRecordGroup = layers.value.find((g) => g.groupName === '新基準中央服務紀錄');
        if (serviceRecordGroup) {
          // 清除現有的服務人員圖層
          serviceRecordGroup.groupLayers = [];

          // 如果有服務人員數據，為每個服務人員創建圖層
          if (result.serviceProviderLayers && result.serviceProviderLayers.length > 0) {
            console.log('📅 找到', result.serviceProviderLayers.length, '個服務人員');

            // ============================================
            // 確保服務人員圖層按照固定順序排列
            // 這樣每一天的圖層都會按照 category20b 顏色順序顯示
            // ============================================

            // 1. 先收集所有服務人員ID並排序
            const serviceProviderIds = result.serviceProviderLayers
              .map((layer) => layer.serviceProviderId)
              .sort(); // 按字母順序排序，確保一致性

            console.log('📅 服務人員ID排序:', serviceProviderIds);

            // 2. 按照當天的順序分配顏色（每天重新開始）
            // 不需要跨日期保持相同顏色，每天按照出現順序分配 category20b 顏色
            console.log('🎨 為當天服務人員分配顏色（按順序）');

            // 3. 按照固定順序創建圖層並分配顏色
            serviceProviderIds.forEach((serviceProviderId, index) => {
              // 找到對應的服務圖層數據
              const serviceLayer = result.serviceProviderLayers.find(
                (layer) => layer.serviceProviderId === serviceProviderId
              );

              if (!serviceLayer) return;

              // 直接按照當天的順序分配顏色（不考慮跨日期一致性）
              const colorIndex = index % layerColors.length;
              const assignedColor = layerColors[colorIndex];

              // ============================================
              // 更新 GeoJSON features 中的顏色屬性
              // 確保左側面板和地圖顯示一致的顏色
              // ============================================
              if (serviceLayer.geoJsonData && serviceLayer.geoJsonData.features) {
                serviceLayer.geoJsonData.features.forEach((feature) => {
                  if (feature.properties) {
                    if (feature.geometry.type === 'Point') {
                      feature.properties.fillColor = assignedColor;
                    } else if (feature.geometry.type === 'LineString') {
                      feature.properties.routeColor = assignedColor;
                    }
                  }
                });
              }

              const serviceLayerId = `service-provider-${serviceLayer.serviceProviderId}`;
              const serviceLayerObj = {
                layerId: serviceLayerId,
                layerName: serviceLayer.serviceProviderId, // 直接使用服務人員身分證
                visible: false, // 預設隱藏
                isLoaded: true,
                isLoading: false,
                isAnalysisLayer: false,
                isIsochroneAnalysisLayer: false,
                geoJsonData: serviceLayer.geoJsonData,
                tableData: serviceLayer.tableData || [], // 使用 dataProcessor 提供的 service_points 資料
                summaryData: {
                  totalCount: serviceLayer.pointCount,
                  routeCount: serviceLayer.routeCount,
                  districtCount: [],
                },
                legendData: null,
                loader: loadNewStandardCentralServiceData,
                serviceProviderId: serviceLayer.serviceProviderId,
                serviceDate: dateStr, // 儲存服務日期，用於動態分配顏色
                colorName: assignedColor, // 使用分配的顏色
                type: 'point',
                shape: 'circle',
              };

              // 添加到群組的圖層列表中
              serviceRecordGroup.groupLayers.push(serviceLayerObj);
              console.log(
                `📅 創建服務人員圖層: ${serviceLayer.serviceProviderId} (索引: ${index}, 顏色: ${assignedColor}, 已更新GeoJSON顏色)`
              );
            });

            // 顏色已在上方直接分配，無需額外操作
          } else {
            console.log('📅 沒有找到該日期的服務人員數據');
          }

          console.log(
            '📅 服務人員圖層載入完成，共',
            serviceRecordGroup.groupLayers.length,
            '個圖層'
          );
        }
      } catch (error) {
        console.error('📅 載入服務人員圖層失敗:', error);
      }
    };

    /**
     * 📅 清除服務人員圖層
     */
    const clearServiceProviderLayers = () => {
      const serviceRecordGroup = layers.value.find((g) => g.groupName === '新基準中央服務紀錄');
      if (serviceRecordGroup) {
        serviceRecordGroup.groupLayers = [];
        // 清除服務人員圖層（每天重新載入和分配顏色）
        console.log('📅 已清除所有服務人員圖層');
      }
    };

    /**
     * 📅 檢查資料是否符合日期篩選條件
     * @param {Object} data - 要檢查的資料物件
     * @returns {boolean} - 是否符合篩選條件
     */
    const matchesDateFilter = (data) => {
      if (!isDateFilterActive.value || !selectedServiceDate.value) {
        return true; // 沒有篩選條件時，所有資料都符合
      }

      // 檢查資料中是否有服務日期欄位
      if (data && data['服務日期(請輸入7碼)']) {
        const dataDate = data['服務日期(請輸入7碼)'].toString();
        return dataDate === selectedServiceDate.value;
      }

      return true; // 如果沒有日期欄位，預設符合條件
    };

    // 🧮 計算兩點間距離 (Calculate Distance Between Two Points)
    // 使用 Haversine 公式計算地球表面兩點間的距離（公尺）
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371000; // 地球半徑（公尺）
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // 距離（公尺）
    };

    // 🔍 計算範圍內的點物件 (Calculate Points Within Range)
    const calculatePointsInRange = (centerLat, centerLng, radiusMeters = 2000) => {
      const pointsInRange = [];

      // 獲取所有可見且已載入的點類型圖層
      const visiblePointLayers = getAllLayers().filter(
        (layer) =>
          layer.visible &&
          layer.isLoaded &&
          layer.type === 'point' &&
          !layer.isAnalysisLayer &&
          !layer.isIsochroneAnalysisLayer &&
          layer.geoJsonData
      );

      console.log(
        '🔍 檢查可見的點圖層:',
        visiblePointLayers.map((l) => l.layerName)
      );

      visiblePointLayers.forEach((layer) => {
        if (layer.geoJsonData && layer.geoJsonData.features) {
          layer.geoJsonData.features.forEach((feature) => {
            if (feature.geometry.type === 'Point') {
              const [lng, lat] = feature.geometry.coordinates;
              const distance = calculateDistance(centerLat, centerLng, lat, lng);

              if (distance <= radiusMeters) {
                // 創建增強的 feature 物件，包含距離和圖層資訊
                const enhancedFeature = {
                  ...feature, // 保留原始 feature 的所有屬性
                  layerId: layer.layerId,
                  layerName: layer.layerName,
                  distance: Math.round(distance), // 添加距離資訊
                };
                pointsInRange.push(enhancedFeature);
              }
            }
          });
        }
      });

      // 按距離排序
      pointsInRange.sort((a, b) => a.distance - b.distance);

      console.log(`🎯 在 ${radiusMeters / 1000}公里範圍內找到 ${pointsInRange.length} 個點物件`);
      return pointsInRange;
    };

    const calculatePolygonInRange = (centerLat, centerLng, radiusMeters = 2000) => {
      const polygonInRange = [];

      // 獲取所有可見且已載入的區域類型圖層
      const visiblePolygonLayers = getAllLayers().filter(
        (layer) =>
          layer.visible &&
          layer.isLoaded &&
          layer.type === 'polygon' &&
          !layer.isAnalysisLayer &&
          !layer.isIsochroneAnalysisLayer &&
          layer.geoJsonData
      );

      console.log(
        '🔍 檢查可見的多邊形圖層:',
        visiblePolygonLayers.map((l) => l.layerName)
      );

      visiblePolygonLayers.forEach((layer) => {
        if (layer.geoJsonData && layer.geoJsonData.features) {
          layer.geoJsonData.features.forEach((feature) => {
            if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
              // 檢查多邊形是否與圓圈有重疊
              const hasOverlap = checkPolygonCircleOverlap(
                feature.geometry,
                centerLat,
                centerLng,
                radiusMeters
              );

              if (hasOverlap) {
                // 創建增強的 feature 物件，包含圖層資訊
                const enhancedFeature = {
                  ...feature, // 保留原始 feature 的所有屬性
                  layerId: layer.layerId,
                  layerName: layer.layerName,
                  overlapType: 'intersects', // 標記為相交
                };
                polygonInRange.push(enhancedFeature);
              }
            }
          });
        }
      });

      console.log(
        `🎯 在 ${radiusMeters / 1000}公里範圍內找到 ${polygonInRange.length} 個重疊多邊形`
      );
      return polygonInRange;
    };

    // 檢查多邊形與圓圈是否重疊的函數
    const checkPolygonCircleOverlap = (geometry, centerLat, centerLng, radiusMeters) => {
      const coordinates =
        geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;

      for (const polygon of coordinates) {
        for (const ring of polygon) {
          for (const [lng, lat] of ring) {
            const distance = calculateDistance(centerLat, centerLng, lat, lng);
            if (distance <= radiusMeters) {
              return true; // 如果任何一個頂點在圓內，就認為有重疊
            }
          }
        }
      }

      // 也可以檢查圓心是否在多邊形內，但這裡簡化處理
      return false;
    };

    // 分析圖層管理方法

    // 等時圈分析圖層管理方法
    /**
     * 更新等時圈分析圖層的統計數據和表格數據
     *
     * @description 此函數負責更新等時圈分析圖層的所有統計資訊，
     * 包括摘要數據（summaryData）和表格數據（tableData）。
     * 支援兩種類型的等時圈要素：真實的多邊形和回退的圓圈。
     *
     * @param {Object} isochroneLayer - 等時圈分析圖層物件
     *
     * @note 此函數會在以下情況被調用：
     * 1. 新增等時圈分析點後
     * 2. 刪除等時圈分析點後
     * 3. 清空等時圈分析圖層後
     *
     * @example
     * const isochroneLayer = findLayerById('isochrone-analysis-layer');
     * updateIsochroneAnalysisLayerData(isochroneLayer);
     */

    // 🌐 調用 OpenRouteService API 獲取等時圈數據
    /**
     * 從 OpenRouteService API 獲取等時圈（Isochrone）數據
     *
     * @description 此函數向 ORS API 發送請求，獲取從指定起點在指定時間內可到達的所有區域
     * 等時圈是指從某一點出發，在相同時間內可以到達的所有地點連成的邊界線
     *
     * @param {number} lat - 起點緯度（WGS84 坐標系）
     * @param {number} lng - 起點經度（WGS84 坐標系）
     * @param {number} travelTimeMinutes - 旅行時間（分鐘），默認為 10 分鐘
     *
     * @returns {Promise<Object>} 返回 GeoJSON 格式的等時圈數據
     * @throws {Error} 當 API 調用失敗時拋出錯誤
     *
     * @example
     * // 獲取台北 101 周邊 15 分鐘車程的等時圈
     * const isochrone = await fetchIsochroneData(25.034, 121.565, 15);
     */

    // 🎯 計算等時圈多邊形範圍內的點物件
    /**
     * 計算等時圈多邊形範圍內的所有點物件（長照設施等）
     *
     * @description 此函數遍歷所有可見的點圖層，檢查每個點是否位於等時圈多邊形內部
     * 使用射線投射算法（Ray Casting Algorithm）判斷點是否在多邊形內
     *
     * @param {Object} isochroneData - 來自 ORS API 的等時圈 GeoJSON 數據
     * @param {number} centerLat - 等時圈中心點緯度（用於計算距離）
     * @param {number} centerLng - 等時圈中心點經度（用於計算距離）
     *
     * @returns {Array} 包含所有在等時圈內的點物件陣列，每個物件包含：
     *   - 原始 GeoJSON feature 數據
     *   - layerId: 圖層 ID
     *   - layerName: 圖層名稱
     *   - distance: 與中心點的直線距離（公尺）
     *
     * @example
     * const pointsInRange = calculatePointsInIsochronePolygon(isochroneData, 25.034, 121.565);
     * console.log(`找到 ${pointsInRange.length} 個設施`);
     */

    // 🎯 計算等時圈多邊形範圍內的多邊形物件
    /**
     * 計算與等時圈多邊形有重疊的所有多邊形物件（如行政區界、統計區域等）
     *
     * @description 此函數檢查所有可見的多邊形圖層，找出與等時圈有交集的多邊形
     * 使用簡化的重疊檢測算法：檢查多邊形頂點是否有任何一個落在等時圈內
     *
     * @param {Object} isochroneData - 來自 ORS API 的等時圈 GeoJSON 數據
     *
     * @returns {Array} 包含所有與等時圈重疊的多邊形物件陣列，每個物件包含：
     *   - 原始 GeoJSON feature 數據
     *   - layerId: 圖層 ID
     *   - layerName: 圖層名稱
     *   - overlapType: 重疊類型（'intersects'）
     *
     * @example
     * const overlappingPolygons = calculatePolygonInIsochronePolygon(isochroneData);
     * console.log(`找到 ${overlappingPolygons.length} 個重疊的行政區`);
     */

    // 檢查點是否在多邊形內（射線投射算法）
    /**
     * 使用射線投射算法（Ray Casting Algorithm）判斷點是否在多邊形內部
     *
     * @description 此算法的基本原理：
     * 1. 從測試點向任意方向（通常是水平向右）發射一條射線
     * 2. 計算射線與多邊形邊界的交點數量
     * 3. 如果交點數量為奇數，則點在多邊形內；偶數則在外
     *
     * @param {Array} point - 測試點坐標 [經度, 緯度]
     * @param {Object} polygon - GeoJSON 多邊形幾何物件
     *
     * @returns {boolean} true 表示點在多邊形內，false 表示在外
     *
     * @example
     * const isInside = isPointInPolygon([121.565, 25.034], polygonGeometry);
     * console.log(isInside ? '在多邊形內' : '在多邊形外');
     *
     * @note 此實現為簡化版本，僅處理多邊形的外環，未考慮內環（洞）
     */

    // 檢查多邊形與等時圈是否重疊（簡化版本）
    /**
     * 檢查兩個多邊形是否有重疊或相交
     *
     * @description 此函數使用簡化的重疊檢測算法：
     * 檢查測試多邊形的所有頂點，如果有任何一個頂點落在等時圈多邊形內，
     * 就認為兩個多邊形有重疊。這是一個快速但不完美的方法。
     *
     * @param {Object} polygon - 要檢測的多邊形幾何物件
     * @param {Object} isochronePolygon - 等時圈多邊形幾何物件
     *
     * @returns {boolean} true 表示有重疊，false 表示無重疊
     *
     * @note 限制：
     * 1. 此方法只檢查頂點，可能遺漏某些邊緣相交的情況
     * 2. 不處理一個多邊形完全包含另一個的情況
     * 3. 完整的多邊形相交算法會更複雜，需要考慮所有邊的交點
     *
     * @example
     * const hasOverlap = checkPolygonIsochroneOverlap(districtGeometry, isochroneGeometry);
     * if (hasOverlap) console.log('行政區與等時圈有重疊');
     */

    /**
     * 自動載入重要的長照設施圖層用於等時圈分析
     *
     * @description 為了確保等時圈分析能夠計算到範圍內的設施，
     * 此函數會自動載入一些重要的長照相關圖層
     *
     * @returns {Promise<void>} 完成所有圖層載入的 Promise
     */

    /**
     * 添加等時圈分析點 - 核心功能函數
     *
     * @description 這是等時圈分析功能的主要入口點。此函數會：
     * 1. 調用 OpenRouteService API 獲取真實的等時圈數據
     * 2. 計算等時圈範圍內的所有長照設施和相關區域
     * 3. 創建可視化的等時圈多邊形和分析點
     * 4. 生成統計數據和報告
     * 5. 在 API 失敗時提供回退方案
     *
     * @param {number} lat - 分析起點的緯度（WGS84 坐標系）
     * @param {number} lng - 分析起點的經度（WGS84 坐標系）
     * @param {number} travelTimeMinutes - 等時圈時間範圍（分鐘），預設 10 分鐘
     *
     * @returns {Promise<Object>} 分析結果物件，包含：
     *   - pointId: 分析點編號
     *   - pointsInRange: 範圍內的點設施陣列
     *   - polygonInRange: 範圍內的多邊形區域陣列
     *   - layerStats: 各圖層的統計數據
     *   - polygonStats: 多邊形圖層的統計數據
     *   - isochroneData: 原始等時圈 API 數據
     *
     * @throws {Error} 當 API 調用失敗且回退方案也失敗時拋出錯誤
     *
     * @example
     * // 在台北 101 創建 15 分鐘車程的等時圈分析
     * const result = await addIsochroneAnalysisPoint(25.034, 121.565, 15);
     * console.log(`找到 ${result.pointsInRange.length} 個長照設施`);
     */

    /**
     * 清除等時圈分析圖層的所有數據
     *
     * @description 此函數會移除等時圈分析圖層中的所有分析結果，
     * 包括等時圈多邊形、分析點標記和相關統計數據。
     * 通常在使用者需要重新開始分析或清空地圖時調用。
     *
     * @note 此操作無法撤銷，清除後需要重新創建分析點
     *
     * @example
     * // 清除所有等時圈分析
     * clearIsochroneAnalysisLayer();
     */

    // 🗑️ 刪除單個分析點 (Delete Single Analysis Point)

    // 🗑️ 刪除單個等時圈分析點 (Delete Single Isochrone Analysis Point)
    /**
     * 刪除指定的等時圈分析點及其相關要素
     *
     * @description 此函數會移除指定編號的等時圈分析結果，包括：
     * 1. 等時圈多邊形或圓圈（分析範圍的視覺表示）
     * 2. 分析點標記（藍色加號圖標）
     * 3. 更新相關的統計數據和表格數據
     *
     * @param {number|string} pointId - 要刪除的分析點編號
     *
     * @note 此操作會同時處理兩種類型的等時圈要素：
     * - isochrone-polygon-analysis: 來自 ORS API 的真實等時圈多邊形
     * - isochrone-circle-analysis: 回退模式的圓圈分析
     *
     * @example
     * // 刪除編號為 3 的等時圈分析
     * deleteIsochroneAnalysisPoint(3);
     */

    // 注意：路徑規劃和路徑優化相關的函數和註解已移除

    return {
      layers,
      findLayerById, // 根據 ID 尋找圖層
      getAllLayers, // 獲取所有圖層的扁平陣列
      toggleLayerVisibility,
      toggleGroupVisibility, // 切換群組圖層可見性
      isGroupVisible, // 檢查群組是否有可見圖層
      selectedFeature,
      setSelectedFeature,
      clearSelectedFeature,

      // 📅 日期篩選相關
      selectedServiceDate,
      isDateFilterActive,
      setServiceDateFilter,
      clearServiceDateFilter,
      matchesDateFilter,
      loadServiceProviderLayers, // 載入服務人員圖層
      clearServiceProviderLayers, // 清除服務人員圖層

      calculatePointsInRange, // 計算範圍內的點
      calculatePolygonInRange, // 計算範圍內的多邊形
      visibleLayers: computed(() => getAllLayers().filter((layer) => layer.visible)),
      loadingLayers: computed(() => getAllLayers().filter((layer) => layer.isLoading)),

      // 創建服務項目資料的工具函數 - 重寫版本
      createServiceItemsData: (itemOrFeature, layer) => {
        console.log('>> [1] createServiceItemsData: 開始處理', {
          itemOrFeature,
          layerName: layer.layerName,
        });

        const isFeature = itemOrFeature.type === 'Feature';
        const properties = isFeature ? itemOrFeature.properties : itemOrFeature;

        // 屬性物件必須直接包含 service_items
        const serviceItems =
          properties.service_items && Array.isArray(properties.service_items)
            ? [...properties.service_items]
            : [];

        if (serviceItems.length === 0) {
          console.warn(
            '!! [1a] createServiceItemsData: `properties` 中缺少 `service_items` 或其為空!',
            properties
          );
        } else {
          console.log(
            '>> [1b] createServiceItemsData: 成功找到 service_items，數量:',
            serviceItems.length
          );
        }

        const serviceItemsData = {
          type: 'service-items',
          layerId: layer.layerId,
          layerName: layer.layerName,
          servicePoint: properties, // 原始屬性
          serviceItems: serviceItems, // 提取出的服務項目
          servicePointInfo: {
            name: properties.姓名 || properties.name,
            address: properties.個案居住地址 || properties.address,
            time: properties.時間 || properties.time,
            serviceType: properties.服務項目代碼 || properties.serviceType,
            order: properties.順序 || properties.order,
            lat: properties.緯度 || properties.lat,
            lng: properties.經度 || properties.lon,
          },
        };

        console.log(
          '>> [2] createServiceItemsData: 處理完成，返回 serviceItemsData',
          serviceItemsData
        );
        return { serviceItemsData };
      },
    };
  },
  {
    persist: true,
  }
);
