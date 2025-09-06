/**
 * dataStore.js
 *
 * Purpose:
 * - Centralized application state using Pinia.
 * - Manages layer groups, visibility, selected features, and service-date filtering.
 * - Loads and prepares data for "新基準中央服務紀錄" including colors and table data.
 *
 * Refactor Notes (non-functional):
 * - Added module header, section separators, and JSDoc-style comments for maintainability.
 * - Logic, UI, and outputs are unchanged.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import { loadNewStandardCentralServiceData } from '../utils/dataProcessor.js';

// 主要數據存儲定義 (Main Data Store Definition)
export const useDataStore = defineStore(
  'data',
  () => {
    // =============================================================
    // Layer Groups & Colors
    // =============================================================
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

    // =============================================================
    // Layer Lookup & Utilities
    // =============================================================
    /**
     * 根據 ID 在群組內搜尋圖層 (Find Layer By Id)
     * @param {string} layerId
     * @returns {Object|null}
     */
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

    /**
     * 從分組結構中提取所有圖層的扁平陣列 (Get All Layers)
     * @returns {Array<Object>}
     */
    const getAllLayers = () => {
      const allLayers = [];
      for (const group of layers.value) {
        allLayers.push(...group.groupLayers);
      }
      return allLayers;
    };

    // =============================================================
    // Visibility Controls
    // =============================================================

    /**
     * 控制圖層的顯示/隱藏 (Toggle Layer Visibility)
     * @param {string} layerId
     */
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

    /**
     * 控制整個群組圖層的顯示/隱藏 (Toggle Group Visibility)
     * @param {string} groupName
     */
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

    /**
     * 檢查群組是否有任何可見圖層 (Is Group Visible)
     * @param {string} groupName
     * @returns {boolean}
     */
    const isGroupVisible = (groupName) => {
      const group = layers.value.find((g) => g.groupName === groupName);
      if (!group) return false;
      return group.groupLayers.some((layer) => layer.visible);
    };

    // =============================================================
    // Selected Feature & Date Filter
    // =============================================================
    // 選中的地圖物件
    const selectedFeature = ref(null);

    // 📅 日期篩選狀態 (Date Filter State)
    const selectedServiceDate = ref('1140701'); // 預設為 2025年7月1日
    const isDateFilterActive = ref(true); // 預設啟用日期篩選

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
     * 📅 清除服務人員圖層 (Clear Service Provider Layers)
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
     * 📅 檢查資料是否符合日期篩選條件 (Matches Date Filter)
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

    // =============================================================
    // Spatial Utilities
    // =============================================================
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

    // 檢查多邊形與圓圈是否重疊的函數 (Check Polygon-Circle Overlap)
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

    // =============================================================
    // Returned API (Store Interface)
    // =============================================================

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
