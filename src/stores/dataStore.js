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

    // 圖層顏色陣列（使用 Python tab20 色系）
    const layerColors = [
      'tab20-1',
      'tab20-2',
      'tab20-3',
      'tab20-4',
      'tab20-5',
      'tab20-6',
      'tab20-7',
      'tab20-8',
      'tab20-9',
      'tab20-10',
      'tab20-11',
      'tab20-12',
      'tab20-13',
      'tab20-14',
      'tab20-15',
      'tab20-16',
      'tab20-17',
      'tab20-18',
      'tab20-19',
      'tab20-20',
    ];

    // 記錄服務人員ID與顏色的映射
    const serviceProviderColorMap = new Map();

    // 根據服務人員ID獲取顏色（確保一致性）- 使用和dataProcessor相同的邏輯
    const getColorForServiceProvider = (serviceProviderId) => {
      // 使用確定性的哈希算法，確保同一個ID總是得到相同顏色
      let hash = 0;
      for (let i = 0; i < serviceProviderId.length; i++) {
        hash = (hash << 5) - hash + serviceProviderId.charCodeAt(i);
        hash = hash & hash; // 轉換為32位整數
      }
      const colorIndex = Math.abs(hash) % layerColors.length;
      return layerColors[colorIndex];
    };

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

        const result = await loadNewStandardCentralServiceData(
          {
            layerId: '新基準中央服務紀錄',
            colorName: 'tab20-2', // 預設顏色，實際會被每個服務人員的顏色覆蓋
            fileName: '新基準中央服務紀錄_all.json',
          },
          dateStr,
          serviceProviderColorMap // 傳遞顏色映射
        );

        // 找到服務記錄群組
        const serviceRecordGroup = layers.value.find((g) => g.groupName === '新基準中央服務紀錄');
        if (serviceRecordGroup) {
          // 清除現有的服務人員圖層
          serviceRecordGroup.groupLayers = [];

          // 如果有服務人員數據，為每個服務人員創建圖層
          if (result.serviceProviderLayers && result.serviceProviderLayers.length > 0) {
            console.log('📅 找到', result.serviceProviderLayers.length, '個服務人員');

            result.serviceProviderLayers.forEach((serviceLayer) => {
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
                tableData: [],
                summaryData: {
                  totalCount: serviceLayer.pointCount,
                  routeCount: serviceLayer.routeCount,
                  districtCount: [],
                },
                legendData: null,
                loader: loadNewStandardCentralServiceData,
                serviceProviderId: serviceLayer.serviceProviderId,
                colorName: getColorForServiceProvider(serviceLayer.serviceProviderId), // 使用一致的顏色
                type: 'point',
                shape: 'circle',
              };

              // 添加到群組的圖層列表中
              serviceRecordGroup.groupLayers.push(serviceLayerObj);
              console.log('📅 創建服務人員圖層:', serviceLayer.serviceProviderId);
            });
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
        // 重置顏色索引和顏色映射，確保下次載入時顏色重新從頭開始分配
        serviceProviderColorMap.clear();
        console.log('📅 已清除所有服務人員圖層和顏色映射');
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

    // 🗺️ ============ 路徑規劃圖層相關函數 (Route Planning Layer Functions) ============

    /**
     * 更新路徑規劃圖層的統計數據和表格數據
     *
     * @description 計算路徑規劃圖層中的路徑點數量，更新摘要統計和表格顯示數據。
     * 路徑規劃在點選完成前被視為一筆資料，表格只顯示一筆記錄包含所有路徑點。
     * 這個函數會在以下情況被調用：
     * 1. 添加新的路徑規劃點後
     * 2. 刪除路徑規劃點後
     * 3. 清空路徑規劃圖層後
     *
     * @param {Object} routePlanningLayer - 路徑規劃圖層物件
     *
     * @example
     * const routeLayer = findLayerById('route-planning-layer');
     * updateRoutePlanningLayerData(routeLayer);
     */

    /**
     * 添加路徑規劃點到地圖
     *
     * @description 在指定的經緯度位置添加一個路徑規劃點。
     * 路徑規劃點將按添加順序進行編號，支援無限數量的路徑點添加。
     *
     * @param {number} lat - 緯度
     * @param {number} lng - 經度
     * @returns {string|null} - 成功時返回路徑點ID，失敗時返回null
     *
     * @example
     * // 添加路徑規劃點
     * const pointId = addRoutePlanningPoint(25.0330, 121.5654);
     * if (pointId) {
     *   console.log('成功添加路徑點:', pointId);
     * }
     */

    /**
     * 清空路徑規劃圖層中的所有路徑點
     *
     * @description 移除路徑規劃圖層中的所有路徑規劃點，重置圖層狀態。
     * 這個函數通常在用戶想要重新開始路徑規劃時使用。
     *
     * @example
     * // 清空所有路徑規劃點
     * clearRoutePlanningLayer();
     */

    /**
     * 刪除指定的路徑規劃點
     *
     * @description 根據點ID刪除特定的路徑規劃點，並重新整理剩餘路徑點的順序編號。
     *
     * @param {string} pointId - 要刪除的路徑點ID
     *
     * @example
     * // 刪除特定的路徑規劃點
     * deleteRoutePlanningPoint('route_point_1234567890_abc123');
     */

    /**
     * 獲取所有路徑規劃點的坐標列表
     *
     * @description 返回當前所有路徑規劃點的坐標陣列，按順序排列，
     * 可用於後續的路徑規劃API調用。
     *
     * @returns {Array<Array<number>>} - 坐標陣列，格式為 [[lng, lat], [lng, lat], ...]
     *
     * @example
     * // 獲取路徑點坐標用於路徑規劃
     * const coordinates = getRoutePlanningCoordinates();
     * console.log('路徑點坐標:', coordinates);
     * // 輸出: [[121.5654, 25.0330], [121.5700, 25.0350], ...]
     */

    /**
     * 使用 OpenRouteService Directions API 計算路徑
     *
     * @description 調用 ORS Directions API 計算多個路徑點之間的最佳路線，
     * 返回包含路徑幾何、距離、時間等詳細信息的數據。
     *
     * @param {Array<Array<number>>} coordinates - 路徑點坐標陣列 [[lng, lat], ...]
     * @param {string} profile - 交通方式 ('driving-car', 'cycling-regular', 'foot-walking')
     * @returns {Promise<Object>} - ORS Directions API 響應數據
     *
     * @throws {Error} - 當 API 調用失敗時拋出錯誤
     *
     * @example
     * const coordinates = [[121.5654, 25.0330], [121.5700, 25.0350]];
     * const routeData = await fetchRouteDirections(coordinates, 'driving-car');
     * console.log('路徑距離:', routeData.features[0].properties.summary.distance, '公尺');
     */

    /**
     * 計算並繪製路徑規劃路線
     *
     * @description 使用當前的路徑規劃點計算最佳路線，並將路線添加到地圖圖層中。
     * 同時更新圖層統計數據，包含路線長度、預估時間等信息。
     *
     * @param {string} profile - 交通方式，預設為 'driving-car'
     * @returns {Promise<Object|null>} - 成功時返回路線數據，失敗時返回 null
     *
     * @example
     * // 計算並繪製駕車路線
     * const routeResult = await calculateAndDrawRoute('driving-car');
     * if (routeResult) {
     *   console.log('路線已繪製，距離:', routeResult.distance, '公里');
     * }
     */

    // 🗺️ ============ 路徑優化相關函數 (Route Optimization Functions) ============

    /**
     * 添加路徑優化點
     *
     * @description 在地圖上添加一個新的路徑優化點，用於路徑優化計算
     * @param {number} lat - 緯度
     * @param {number} lng - 經度
     * @returns {string|null} 路徑優化點的唯一ID，失敗時返回null
     *
     * @example
     * // 添加路徑優化點
     * const pointId = addRouteOptimizationPoint(25.0330, 121.5654);
     * if (pointId) {
     *   console.log('成功添加優化點:', pointId);
     * }
     */

    /**
     * 清空路徑優化圖層中的所有優化點
     *
     * @description 移除路徑優化圖層中的所有優化點，重置圖層狀態。
     * 這個函數通常在用戶想要重新開始路徑優化時使用。
     *
     * @example
     * // 清空所有優化點
     * clearRouteOptimizationLayer();
     */

    /**
     * 獲取路徑優化點的坐標
     *
     * @description 獲取當前路徑優化圖層中所有優化點的坐標，用於路徑優化計算
     * @returns {Array} 坐標數組，每個元素為 [經度, 緯度]
     *
     * @example
     * // 獲取優化點坐標
     * const coordinates = getRouteOptimizationCoordinates();
     * console.log('優化點坐標:', coordinates);
     */

    /**
     * 更新路徑優化圖層的統計和表格數據
     *
     * @description 根據圖層中的要素更新摘要統計和表格數據
     * @param {Object} routeOptimizationLayer - 路徑優化圖層實例
     */

    /**
     * 計算並繪製優化路線
     *
     * @description 使用 OpenRouteService Optimization API 計算最佳訪問順序並繪製優化路線
     * @param {string} profile - 交通方式，預設為 'driving-car'
     * @returns {Object|null} 優化結果，包含距離、時間、優化順序等，失敗時返回null
     *
     * @example
     * // 計算並繪製優化路線
     * const optimizationResult = await calculateAndDrawOptimizedRoute('driving-car');
     * if (optimizationResult) {
     *   console.log('優化路線已繪製，距離:', optimizationResult.distance, '公里');
     * }
     */

    /**
     * 調用 OpenRouteService Optimization API
     *
     * @description 使用 XMLHttpRequest 調用 ORS Optimization API 進行路徑優化
     * @param {Array} coordinates - 坐標數組，每個元素為 [經度, 緯度]
     * @param {string} profile - 交通方式
     * @returns {Object} 優化結果
     */

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
    };
  },
  {
    persist: true,
  }
);
