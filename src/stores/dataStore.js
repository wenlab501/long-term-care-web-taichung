/**
 * =============================================================================
 * 📦 dataStore.js - 主要資料狀態管理中心
 * =============================================================================
 *
 * 用途：使用 Pinia 進行集中化的應用程式狀態管理
 *
 * 主要功能：
 * - 🗂️ 圖層群組和可見性管理
 * - 🎯 選中特徵和服務點管理
 * - 📅 服務日期篩選功能
 * - 🎨 顏色映射和主題管理
 * - 📊 服務記錄資料載入和處理
 * - 📍 空間分析工具函數
 *
 * 技術特性：
 * - 🔄 響應式狀態管理
 * - 💾 持久化儲存支援
 * - 🎯 計算屬性優化
 * - 🔍 資料篩選和查詢
 *
 * @author 長期照護資源分析系統團隊
 * @version 2.0.0
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loadNewStandardCentralServiceData } from '../utils/dataProcessor.js';

/**
 * =============================================================================
 * 🚀 資料存儲定義 (Data Store Definition)
 * =============================================================================
 */

/**
 * @typedef {Object} LayerGroup
 * @property {string} groupName - 群組名稱
 * @property {Array<LayerInfo>} groupLayers - 群組內的圖層清單
 */

/**
 * @typedef {Object} LayerInfo
 * @property {string} layerId - 圖層唯一識別碼
 * @property {string} layerName - 圖層顯示名稱
 * @property {boolean} visible - 是否可見
 * @property {boolean} isLoaded - 是否已載入
 * @property {boolean} isLoading - 是否正在載入
 * @property {string} colorName - 顏色名稱
 * @property {string} type - 圖層類型 ('point', 'line', 'polygon')
 * @property {Object} geoJsonData - GeoJSON 資料
 * @property {Array} tableData - 表格資料
 * @property {Object} summaryData - 摘要統計資料
 */

export const useDataStore = defineStore(
  'data',
  () => {
    // =============================================================================
    // 🎨 常量定義 (Constants Definition)
    // =============================================================================

    /**
     * D3.js category20b 色彩配置
     * 提供 20 種視覺上易於區分的顏色，按色系分組
     *
     * 顏色順序：
     * - 藍色系 (4): 深藍 → 中藍 → 淺藍 → 極淺藍
     * - 橘色系 (4): 深橘 → 中橘 → 淺橘 → 極淺橘
     * - 綠色系 (4): 深綠 → 中綠 → 淺綠 → 極淺綠
     * - 紫色系 (4): 深紫 → 中紫 → 淺紫 → 極淺紫
     * - 灰色系 (4): 深灰 → 中灰 → 淺灰 → 極淺灰
     */
    const COLOR_PALETTE = Object.freeze([
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
    ]);

    /**
     * 預設圖層群組配置
     */
    const DEFAULT_LAYER_GROUPS = Object.freeze([
      {
        groupName: '服務人員列表',
        groupLayers: [], // 依日期載入的圖層
        description: '依日期顯示的長照服務記錄',
        icon: 'fas fa-calendar-day',
      },
      {
        groupName: '服務日期列表',
        groupLayers: [], // 依服務人員載入的圖層
        description: '依服務人員顯示其所有服務日期',
        icon: 'fas fa-user-nurse',
      },
    ]);

    // =============================================================================
    // 📊 狀態定義 (State Definition)
    // =============================================================================

    /**
     * 圖層群組資料
     * @type {import('vue').Ref<LayerGroup[]>}
     */
    const layers = ref([...DEFAULT_LAYER_GROUPS]);

    // =============================================================================
    // 🔍 圖層查找和實用工具函數 (Layer Lookup & Utility Functions)
    // =============================================================================

    /**
     * 根據圖層 ID 查找圖層
     *
     * @param {string} layerId - 圖層唯一識別碼
     * @returns {LayerInfo|null} 找到的圖層物件，若找不到則返回 null
     *
     * @example
     * const layer = findLayerById('service-provider-123');
     * if (layer) {
     *   console.log(layer.layerName);
     * }
     */
    const findLayerById = (layerId) => {
      if (!layerId || typeof layerId !== 'string') {
        console.warn('🔍 findLayerById: 無效的圖層 ID', layerId);
        return null;
      }

      for (const group of layers.value) {
        const foundLayer = group.groupLayers.find((layer) => layer.layerId === layerId);
        if (foundLayer) {
          return foundLayer;
        }
      }

      return null;
    };

    /**
     * 獲取所有圖層的扁平陣列
     *
     * @returns {Array<LayerInfo>} 所有圖層的陣列
     */
    const getAllLayers = () => {
      return layers.value.reduce((allLayers, group) => {
        return allLayers.concat(group.groupLayers);
      }, []);
    };

    // =============================================================
    // Visibility Controls
    // =============================================================

    /**
     * 控制圖層的顯示/隱藏 (Toggle Layer Visibility)
     * @param {string} layerId
     */
    const toggleLayerVisibility = async (layerId) => {
      const layer = findLayerById(layerId);
      if (!layer) {
        console.error(`Layer with id "${layerId}" not found.`);
        return;
      }

      // 切換可見性狀態
      layer.visible = !layer.visible;
    };

    /**
     * 🗺️ 將所有圖層設為不可見（清空地圖顯示）
     */
    const hideAllLayersOnMap = () => {
      getAllLayers().forEach((layer) => {
        if (layer.visible) {
          layer.visible = false;
        }
      });
    };

    /**
     * 控制整個群組圖層的顯示/隱藏 (Toggle Group Visibility)
     * @param {string} groupName
     */
    const toggleGroupVisibility = async (groupName) => {
      const group = layers.value.find((g) => g.groupName === groupName);
      if (!group) {
        console.error(`Group with name "${groupName}" not found.`);
        return;
      }

      // 檢查群組中是否有任何圖層為可見狀態
      const hasVisibleLayers = group.groupLayers.some((layer) => layer.visible);

      // 如果有可見圖層，則全部隱藏；如果沒有可見圖層，則全部顯示
      const newVisibility = !hasVisibleLayers;

      // 設置所有圖層的可見性
      group.groupLayers.forEach((layer) => {
        layer.visible = newVisibility;

        // 注意：服務人員圖層的顏色已在載入時分配，不需要在這裡動態分配
        // 移除了原本的動態顏色分配邏輯
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
    const selectedServiceDate = ref('1140801'); // 預設為 2025年8月1日
    const isDateFilterActive = ref(true); // 預設啟用日期篩選

    // 👤 服務人員篩選狀態 (Service Provider Filter State)
    const selectedServiceProvider = ref(''); // 選中的服務人員身分證
    const isServiceProviderFilterActive = ref(false); // 服務人員篩選是否啟用
    const availableServiceProviders = ref([]); // 可用的服務人員清單

    // 📑 左側面板分頁狀態 (Left Panel Tab State)
    const activeLeftTab = ref('date'); // 當前活躍的左側分頁 ('date' 或 'server')

    // 📁 檔案篩選狀態 (File Filter State)
    const selectedFileFilter = ref('all'); // 選中的檔案篩選 ('all', 'filtered_臺中洪幸雪-20250801-20250831 全部的服務記錄_final.json', 'filtered_基隆聯祥-20250801-20250831 全部的服務記錄_final.json', 'filtered_新北聯和-20250801-20250831 全部的服務記錄_final.json', 'filtered_新北聯宜-20250801-20250831 全部的服務記錄_final.json', 'filtered_新竹聯廣-20250801-20250831 全部的服務記錄_final.json', 'filtered_桃園聯承-20250801-20250831 全部的服務記錄_final.json', 'filtered_楊梅聯聚-20250801-20250831 全部的服務記錄_final.json', 'filtered_臺北聯承-20250801-20250831 全部的服務記錄_final.json', 'filtered_三重聯恩-20250801-20250831 全部的服務記錄_final.json')
    const isFileFilterActive = ref(false); // 檔案篩選是否啟用

    /**
     * 🔄 設置左側面板活躍分頁 (Set Active Left Tab)
     * @param {string} tabName - 分頁名稱 ('date' 或 'server')
     */
    const setActiveLeftTab = (tabName) => {
      activeLeftTab.value = tabName;
    };

    const setSelectedFeature = (feature) => {
      selectedFeature.value = feature;
    };

    const clearSelectedFeature = () => {
      selectedFeature.value = null;
    };

    /**
     * 🔄 嘗試恢復選中的服務點 (Attempt to Restore Selected Service Point)
     * 在圖層重新載入後，嘗試根據 ID 找到對應的服務點並恢復選中狀態
     * @param {Object} previousFeature - 之前選中的服務點
     */
    const restoreSelectedFeature = (previousFeature) => {
      if (!previousFeature || !previousFeature.properties) {
        return;
      }

      const featureId = previousFeature.properties.id;
      if (!featureId) {
        return;
      }

      // 在所有圖層中尋找匹配的服務點
      const allLayers = getAllLayers();
      for (const layer of allLayers) {
        if (layer.geoJsonData && layer.geoJsonData.features) {
          const matchingFeature = layer.geoJsonData.features.find(
            (feature) => feature.properties && feature.properties.id === featureId
          );

          if (matchingFeature) {
            selectedFeature.value = matchingFeature;
            return;
          }
        }
      }
    };

    // 📅 日期篩選相關方法 (Date Filter Methods)

    /**
     * 📅 設定服務日期篩選
     * @param {string} dateStr - 7碼日期字串 (例如: 1140801)
     */
    const setServiceDateFilter = (dateStr) => {
      selectedServiceDate.value = dateStr;
      isDateFilterActive.value = !!dateStr;
    };

    /**
     * 📅 清除服務日期篩選
     */
    const clearServiceDateFilter = () => {
      selectedServiceDate.value = '';
      isDateFilterActive.value = false;
    };

    /**
     * 📅 載入指定日期的服務人員圖層
     */
    const loadServiceProviderLayers = async (dateStr) => {
      try {
        // 找到服務記錄群組（日期）
        const serviceRecordGroup = layers.value.find((g) => g.groupName === '服務人員列表');
        if (serviceRecordGroup) {
          // 清除現有的服務人員圖層
          serviceRecordGroup.groupLayers = [];

          // 創建一個臨時的載入指示器圖層
          const loadingLayer = {
            layerId: 'loading-indicator-date',
            layerName: '服務日期',
            visible: false,
            isLoaded: false,
            isLoading: true,
            isAnalysisLayer: false,
            isIsochroneAnalysisLayer: false,
            geoJsonData: null,
            tableData: [],
            summaryData: { totalCount: 0, routeCount: 0, districtCount: [] },
            legendData: null,
            colorName: 'category20b-1',
            type: 'point',
            shape: 'circle',
          };
          serviceRecordGroup.groupLayers.push(loadingLayer);
        }

        // 載入所有服務數據（始終載入所有檔案）
        const result = await loadNewStandardCentralServiceData(
          {
            layerId: '新基準中央服務紀錄',
            colorName: 'category20b-1', // 預設顏色，會在後面重新分配
            fileName: 'merged_service_records.json', // 使用合併後的數據
          },
          dateStr,
          null // 不再需要顏色映射
        );
        if (serviceRecordGroup) {
          // 清除現有的服務人員圖層
          serviceRecordGroup.groupLayers = [];

          // 如果有服務人員數據，為每個服務人員創建圖層
          if (result.serviceProviderLayers && result.serviceProviderLayers.length > 0) {
            // 根據檔案篩選過濾服務人員圖層
            let filteredLayers = result.serviceProviderLayers;
            if (selectedFileFilter.value !== 'all') {
              filteredLayers = result.serviceProviderLayers.filter((layer) => {
                // 檢查圖層中的資料是否來自選中的檔案
                if (layer.geoJsonData && layer.geoJsonData.features) {
                  return layer.geoJsonData.features.some(
                    (feature) =>
                      feature.properties && feature.properties.filename === selectedFileFilter.value
                  );
                }
                return false;
              });
            }

            // ============================================
            // 確保服務人員圖層按照固定順序排列
            // 這樣每一天的圖層都會按照 category20b 顏色順序顯示
            // ============================================

            // 1. 先收集所有服務人員ID並排序
            const serviceProviderIds = filteredLayers
              .map((layer) => layer.serviceProviderId)
              .sort(); // 按字母順序排序，確保一致性

            // 2. 按照當天的順序分配顏色（每天重新開始）
            // 不需要跨日期保持相同顏色，每天按照出現順序分配 category20b 顏色

            // 3. 按照固定順序創建圖層並分配顏色
            serviceProviderIds.forEach((serviceProviderId, index) => {
              // 找到對應的服務圖層數據
              const serviceLayer = filteredLayers.find(
                (layer) => layer.serviceProviderId === serviceProviderId
              );

              if (!serviceLayer) return;

              // 直接按照當天的順序分配顏色（不考慮跨日期一致性）
              const colorIndex = index % COLOR_PALETTE.length;
              const assignedColor = COLOR_PALETTE[colorIndex];

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
                  totalCount: serviceLayer.servicePointsCount || serviceLayer.pointCount, // 優先使用 service_points_count
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
            });

            // 顏色已在上方直接分配，無需額外操作
          }
        }
      } catch (error) {
        console.error('📅 載入服務人員圖層失敗:', error);
      }
    };

    /**
     * 📅 清除服務人員圖層 (Clear Service Provider Layers)
     */
    const clearServiceProviderLayers = () => {
      // 清除日期群組
      const serviceRecordGroup = layers.value.find((g) => g.groupName === '服務人員列表');
      if (serviceRecordGroup) {
        serviceRecordGroup.groupLayers = [];
        // 清除服務人員圖層（每天重新載入和分配顏色）
      }
    };

    // =============================================================
    // 👤 服務人員篩選相關方法 (Service Provider Filter Methods)
    // =============================================================

    /**
     * 👤 載入所有可用的服務人員清單
     */
    const loadAvailableServiceProviders = async () => {
      try {
        // 載入所有檔案
        const fileNames = [
          'filtered_臺中洪幸雪-20250801-20250831 全部的服務記錄_final.json',
          'filtered_基隆聯祥-20250801-20250831 全部的服務記錄_final.json',
          'filtered_新北聯和-20250801-20250831 全部的服務記錄_final.json',
          'filtered_新北聯宜-20250801-20250831 全部的服務記錄_final.json',
          'filtered_新竹聯廣-20250801-20250831 全部的服務記錄_final.json',
          'filtered_桃園聯承-20250801-20250831 全部的服務記錄_final.json',
          'filtered_楊梅聯聚-20250801-20250831 全部的服務記錄_final.json',
          'filtered_臺北聯承-20250801-20250831 全部的服務記錄_final.json',
          'filtered_三重聯恩-20250801-20250831 全部的服務記錄_final.json',
        ];

        const allData = [];
        for (const fileName of fileNames) {
          try {
            const filePath = `/long-term-care-web-taichung/data/json/${fileName}`;
            const response = await fetch(filePath);

            if (!response.ok) {
              console.error(`HTTP 錯誤: ${fileName}`, {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
              });
              continue; // 跳過失敗的檔案，繼續處理其他檔案
            }

            const jsonData = await response.json();

            // 為每個記錄添加filename欄位
            const dataWithFilename = jsonData.map((record) => ({
              ...record,
              filename: fileName,
            }));

            allData.push(...dataWithFilename);
          } catch (error) {
            console.error(`❌ 載入文件 ${fileName} 失敗:`, error);
            // 繼續處理其他檔案
          }
        }

        // 根據檔案篩選過濾資料
        let filteredData = allData;
        if (selectedFileFilter.value !== 'all') {
          filteredData = allData.filter((record) => record.filename === selectedFileFilter.value);
        }

        // 提取所有唯一的服務人員身分證
        const uniqueProviderIds = [...new Set(filteredData.map((record) => record.服務人員身分證))];

        // 為每個服務人員統計服務日期數量和資料來源
        const providersWithStats = uniqueProviderIds.map((providerId) => {
          const providerRecords = filteredData.filter(
            (record) => record.服務人員身分證 === providerId
          );
          const uniqueDates = [
            ...new Set(providerRecords.map((record) => record['服務日期(請輸入7碼)'])),
          ];

          // 統計來自不同檔案的記錄數
          const filenameStats = {};
          providerRecords.forEach((record) => {
            const filename = record.filename || 'unknown';
            filenameStats[filename] = (filenameStats[filename] || 0) + 1;
          });

          return {
            id: providerId,
            name: `${providerId}`,
            dateCount: uniqueDates.length,
            totalRecords: providerRecords.length,
            filename: providerRecords[0]?.filename || 'unknown', // 使用第一個記錄的 filename
            filenameStats: filenameStats, // 詳細的檔案統計
          };
        });

        // 按服務人員身分證字母順序排序（英文排序）
        providersWithStats.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));

        availableServiceProviders.value = providersWithStats;

        return providersWithStats;
      } catch (error) {
        console.error('👤 載入服務人員清單失敗:', error);
        return [];
      }
    };

    /**
     * 👤 設定服務人員篩選
     * @param {string} providerId - 服務人員身分證
     */
    const setServiceProviderFilter = (providerId) => {
      selectedServiceProvider.value = providerId;
      isServiceProviderFilterActive.value = !!providerId;
    };

    /**
     * 👤 清除服務人員篩選
     */
    const clearServiceProviderFilter = () => {
      selectedServiceProvider.value = '';
      isServiceProviderFilterActive.value = false;
    };

    /**
     * 👤 載入指定服務人員的所有日期圖層
     */
    const loadServiceProviderDateLayers = async (providerId) => {
      try {
        // 找到服務記錄群組（服務人員）
        const serviceRecordGroup = layers.value.find((g) => g.groupName === '服務日期列表');
        if (serviceRecordGroup) {
          // 清除現有的圖層
          serviceRecordGroup.groupLayers = [];

          // 創建一個臨時的載入指示器圖層
          const loadingLayer = {
            layerId: 'loading-indicator-provider',
            layerName: '服務人員',
            visible: false,
            isLoaded: false,
            isLoading: true,
            isAnalysisLayer: false,
            isIsochroneAnalysisLayer: false,
            geoJsonData: null,
            tableData: [],
            summaryData: { totalCount: 0, routeCount: 0, districtCount: [] },
            legendData: null,
            colorName: 'category20b-1',
            type: 'point',
            shape: 'circle',
          };
          serviceRecordGroup.groupLayers.push(loadingLayer);
        }

        // 載入所有檔案
        const fileNames = [
          'filtered_臺中洪幸雪-20250801-20250831 全部的服務記錄_final.json',
          'filtered_基隆聯祥-20250801-20250831 全部的服務記錄_final.json',
          'filtered_新北聯和-20250801-20250831 全部的服務記錄_final.json',
          'filtered_新北聯宜-20250801-20250831 全部的服務記錄_final.json',
          'filtered_新竹聯廣-20250801-20250831 全部的服務記錄_final.json',
          'filtered_桃園聯承-20250801-20250831 全部的服務記錄_final.json',
          'filtered_楊梅聯聚-20250801-20250831 全部的服務記錄_final.json',
          'filtered_臺北聯承-20250801-20250831 全部的服務記錄_final.json',
          'filtered_三重聯恩-20250801-20250831 全部的服務記錄_final.json',
        ];

        const allData = [];
        for (const fileName of fileNames) {
          try {
            const filePath = `/long-term-care-web-taichung/data/json/${fileName}`;
            const response = await fetch(filePath);

            if (!response.ok) {
              console.error(`HTTP 錯誤: ${fileName}`, {
                status: response.status,
                statusText: response.statusText,
                url: response.url,
              });
              continue; // 跳過失敗的檔案，繼續處理其他檔案
            }

            const jsonData = await response.json();

            // 為每個記錄添加filename欄位
            const dataWithFilename = jsonData.map((record) => ({
              ...record,
              filename: fileName,
            }));

            allData.push(...dataWithFilename);
          } catch (error) {
            console.error(`❌ 載入文件 ${fileName} 失敗:`, error);
            // 繼續處理其他檔案
          }
        }

        // 篩選出該服務人員的所有記錄
        let providerRecords = allData.filter((record) => record.服務人員身分證 === providerId);

        // 根據檔案篩選進一步過濾
        if (selectedFileFilter.value !== 'all') {
          providerRecords = providerRecords.filter(
            (record) => record.filename === selectedFileFilter.value
          );
        }

        // 按日期分組
        const dateGroups = {};
        providerRecords.forEach((record) => {
          const date = record['服務日期(請輸入7碼)'];
          if (!dateGroups[date]) {
            dateGroups[date] = [];
          }
          dateGroups[date].push(record);
        });

        // 移除載入指示器並處理實際數據
        if (serviceRecordGroup) {
          // 清除載入指示器
          serviceRecordGroup.groupLayers = [];

          // 為每個日期創建圖層
          const sortedDates = Object.keys(dateGroups).sort();

          sortedDates.forEach((date, index) => {
            const colorIndex = index % COLOR_PALETTE.length;
            const assignedColor = COLOR_PALETTE[colorIndex];

            // 處理該日期的資料
            const dateData = dateGroups[date];
            const processedData = processServiceProviderData(dateData, assignedColor);

            if (processedData && processedData.features.length > 0) {
              const layerId = `service-date-${date}`;
              // 從 GeoJSON features 中提取 tableData（與 DateLayersTab 一致）
              const tableData = processedData.features
                .filter((feature) => feature.geometry.type === 'Point')
                .map((feature) => ({
                  id: feature.properties.id,
                  姓名: feature.properties.姓名,
                  居住地址: feature.properties.居住地址,
                  起始時間: feature.properties.起始時間,
                  案號: feature.properties.案號,
                  detail: feature.properties.detail,
                  hour_start: feature.properties.hour_start,
                  min_start: feature.properties.min_start,
                  hour_end: feature.properties.hour_end,
                  min_end: feature.properties.min_end,
                  hour_traffic: feature.properties.hour_traffic,
                  min_traffic: feature.properties.min_traffic,
                  service_items: feature.properties.service_items,
                  service_items_count:
                    feature.properties.service_items_count ||
                    (Array.isArray(feature.properties.service_items)
                      ? feature.properties.service_items.length
                      : 0),
                  serviceProviderId: feature.properties.serviceProviderId,
                  serviceDate: feature.properties.serviceDate,
                  routeOrder: feature.properties.routeOrder,
                  lat: feature.geometry.coordinates[1],
                  lon: feature.geometry.coordinates[0],
                  filename: feature.properties.filename, // 添加 filename 欄位
                }));

              // 計算該日期的 service_points_count 總數（與 DateLayersTab 一致）
              const servicePointsCount = dateData.reduce((total, record) => {
                return total + (record.service_points?.length || 0);
              }, 0);

              const layerObj = {
                layerId: layerId,
                layerName: `${date}`,
                visible: false, // 預設為關閉狀態
                isLoaded: true,
                isLoading: false,
                colorName: assignedColor,
                // 與 DateLayersTab 對齊，讓地圖同步機制識別為點圖層
                type: 'point',
                geoJsonData: processedData,
                tableData: tableData, // 使用提取的 tableData
                summaryData: {
                  totalCount:
                    servicePointsCount ||
                    processedData.features.filter((f) => f.geometry.type === 'Point').length, // 優先使用 service_points_count
                  pointCount: processedData.features.filter((f) => f.geometry.type === 'Point')
                    .length,
                  lineCount: processedData.features.filter((f) => f.geometry.type === 'LineString')
                    .length,
                },
                // 添加服務人員相關屬性，讓 DataTableTab 能正確處理點擊事件
                serviceProviderId: providerId,
                serviceDate: date,
              };

              serviceRecordGroup.groupLayers.push(layerObj);
            }
          });
        }
      } catch (error) {
        console.error('👤 載入服務人員日期圖層失敗:', error);
      }
    };

    /**
     * 👤 清除服務人員群組的圖層
     */
    const clearServiceProviderDateLayers = () => {
      const providerGroup = layers.value.find((g) => g.groupName === '服務日期列表');
      if (providerGroup) {
        providerGroup.groupLayers = [];
      }
    };

    /**
     * 👤 處理服務人員單日資料
     */
    const processServiceProviderData = (dayRecords, colorName) => {
      const features = [];

      dayRecords.forEach((serviceProvider, providerIndex) => {
        // 洪幸雪數據處理 - 移除欄位映射，直接使用原始欄位

        // 基隆聯祥數據處理 - 移除欄位映射，直接使用原始欄位

        // 處理新北聯和數據 - 移除欄位映射，直接使用原始欄位
        if (
          serviceProvider.filename ===
          'filtered_新北聯和-20250801-20250831 全部的服務記錄_final.json'
        ) {
          // 處理 service_points_routes 路線數據，修復缺少的 GeoJSON 屬性
          if (
            serviceProvider.service_points_routes &&
            Array.isArray(serviceProvider.service_points_routes)
          ) {
            serviceProvider.service_points_routes = serviceProvider.service_points_routes.map(
              (routeCollection) => {
                // 確保 routeCollection 有正確的 GeoJSON 結構
                if (!routeCollection.type) {
                  routeCollection.type = 'FeatureCollection';
                }

                if (routeCollection.features && Array.isArray(routeCollection.features)) {
                  routeCollection.features = routeCollection.features.map((routeFeature) => {
                    // 確保 routeFeature 有正確的 GeoJSON 結構
                    if (!routeFeature.type) {
                      routeFeature.type = 'Feature';
                    }

                    if (routeFeature.geometry && routeFeature.geometry.coordinates) {
                      // 確保 geometry 有正確的 type
                      if (!routeFeature.geometry.type) {
                        routeFeature.geometry.type = 'LineString';
                      }

                      // 確保 properties 存在
                      if (!routeFeature.properties) {
                        routeFeature.properties = {};
                      }
                    }

                    return routeFeature;
                  });
                }

                return routeCollection;
              }
            );
          }
        }
        // 處理 service_points_routes 路線（與 DateLayersTab 完全一致）
        if (
          serviceProvider.service_points_routes &&
          Array.isArray(serviceProvider.service_points_routes)
        ) {
          serviceProvider.service_points_routes.forEach((routeCollection) => {
            if (routeCollection.features && Array.isArray(routeCollection.features)) {
              routeCollection.features.forEach((routeFeature) => {
                if (routeFeature.geometry && routeFeature.geometry.type === 'LineString') {
                  features.push({
                    type: 'Feature',
                    geometry: routeFeature.geometry,
                    properties: {
                      id: `route_${serviceProvider.服務人員身分證}_${providerIndex}`,
                      layerName: '服務路線_路線', // 添加 layerName 屬性，讓 MapTab 識別為路線
                      name: `服務路線_${serviceProvider.服務人員身分證}`,
                      strokeColor: colorName, // 使用顏色名稱，方便統一處理
                      routeColor: colorName, // 添加routeColor屬性，使用統一的顏色
                      strokeWidth: 3,
                      strokeOpacity: 0.8,
                      serviceProviderId: serviceProvider.服務人員身分證,
                      serviceDate: serviceProvider['服務日期(請輸入7碼)'],
                      pointCount: routeFeature.geometry.coordinates.length,
                      distance: routeFeature.properties?.summary?.distance || 0,
                      duration: routeFeature.properties?.summary?.duration || 0,
                      segments: routeFeature.properties?.segments?.length || 0,
                      ...routeFeature.properties,
                    },
                  });
                }
              });
            }
          });
        }

        // 處理舊版 route 資料（向後相容）
        if (serviceProvider.route && serviceProvider.route.length > 1) {
          const coordinates = serviceProvider.route.map((point) => [point.lon, point.lat]);
          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coordinates,
            },
            properties: {
              id: `route_${serviceProvider.服務人員身分證}_${providerIndex}`,
              layerName: '服務路線_路線', // 添加 layerName 屬性，讓 MapTab 識別為路線
              routeColor: colorName,
              serviceProviderId: serviceProvider.服務人員身分證,
              serviceDate: serviceProvider['服務日期(請輸入7碼)'],
            },
          });
        }

        // 處理服務點（保持與 DateLayersTab 一致的屬性）
        serviceProvider.service_points.forEach((serviceRecord, index) => {
          if (serviceRecord.detail && serviceRecord.detail.Lat && serviceRecord.detail.Lon) {
            const lat = parseFloat(serviceRecord.detail.Lat);
            const lon = parseFloat(serviceRecord.detail.Lon);

            if (!isNaN(lat) && !isNaN(lon)) {
              features.push({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [lon, lat],
                },
                properties: {
                  id: `point_${serviceProvider.服務人員身分證}_${index}`,
                  fillColor: colorName,
                  routeOrder: index + 1,
                  serviceProviderId: serviceProvider.服務人員身分證,
                  serviceDate: serviceProvider['服務日期(請輸入7碼)'],
                  filename: serviceProvider.filename,
                  姓名: serviceRecord.detail.姓名,
                  身分證字號: serviceRecord['身分證字號'],
                  居住地址: serviceRecord.detail.居住地址,
                  起始時間: `${serviceRecord.hour_start}:${serviceRecord.min_start.toString().padStart(2, '0')}`,
                  案號: serviceRecord.detail.案號,
                  detail: serviceRecord.detail,
                  hour_start: serviceRecord.hour_start,
                  min_start: serviceRecord.min_start,
                  hour_end: serviceRecord.hour_end,
                  min_end: serviceRecord.min_end,
                  hour_traffic: serviceRecord.hour_traffic || 0,
                  min_traffic: serviceRecord.min_traffic || 0,
                  service_items: serviceRecord.service_items || [],
                },
              });
            }
          }
        });
      });

      return {
        type: 'FeatureCollection',
        features: features,
      };
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
    // 📁 檔案篩選相關方法 (File Filter Methods)
    // =============================================================

    /**
     * 📁 設定檔案篩選
     * @param {string} fileName - 檔案名稱 ('all' 或具體檔案名)
     */
    const setFileFilter = (fileName) => {
      selectedFileFilter.value = fileName;
      isFileFilterActive.value = fileName !== 'all';
    };

    /**
     * 📁 清除檔案篩選
     */
    const clearFileFilter = () => {
      selectedFileFilter.value = 'all';
      isFileFilterActive.value = false;
    };

    /**
     * 📁 檢查資料是否符合檔案篩選條件 (Matches File Filter)
     * @param {Object} data - 要檢查的資料物件
     * @returns {boolean} - 是否符合篩選條件
     */
    const matchesFileFilter = (data) => {
      if (!isFileFilterActive.value || selectedFileFilter.value === 'all') {
        return true; // 沒有篩選條件時，所有資料都符合
      }

      // 檢查資料中是否有 filename 欄位
      if (data && data.filename) {
        return data.filename === selectedFileFilter.value;
      }

      return true; // 如果沒有 filename 欄位，預設符合條件
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
      restoreSelectedFeature,

      // 📅 日期篩選相關
      selectedServiceDate,
      isDateFilterActive,
      setServiceDateFilter,
      clearServiceDateFilter,
      matchesDateFilter,
      loadServiceProviderLayers, // 載入服務人員圖層
      clearServiceProviderLayers, // 清除服務人員圖層

      // 👤 服務人員篩選相關
      selectedServiceProvider,
      isServiceProviderFilterActive,
      availableServiceProviders,
      loadAvailableServiceProviders,
      setServiceProviderFilter,
      clearServiceProviderFilter,
      loadServiceProviderDateLayers,
      clearServiceProviderDateLayers,
      hideAllLayersOnMap,

      // 📑 左側面板分頁相關
      activeLeftTab,
      setActiveLeftTab,

      // 📁 檔案篩選相關
      selectedFileFilter,
      isFileFilterActive,
      setFileFilter,
      clearFileFilter,
      matchesFileFilter,

      calculatePointsInRange, // 計算範圍內的點
      calculatePolygonInRange, // 計算範圍內的多邊形
      visibleLayers: computed(() => getAllLayers().filter((layer) => layer.visible)),
      loadingLayers: computed(() => getAllLayers().filter((layer) => layer.isLoading)),

      // 創建服務項目資料的工具函數 - 重寫版本
      createServiceItemsData: (itemOrFeature, layer) => {
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
        }

        const serviceItemsData = {
          type: 'service-items',
          layerId: layer.layerId,
          layerName: layer.layerName,
          filename: properties.filename, // 添加 filename 欄位
          servicePoint: properties, // 原始屬性
          serviceItems: serviceItems, // 提取出的服務項目
          servicePointInfo: {
            name: properties.姓名 || properties.name,
            address: properties.居住地址 || properties.address,
            time: properties.時間 || properties.time,
            serviceType: properties.服務項目代碼 || properties.serviceType,
            order: properties.順序 || properties.order,
            lat: properties.緯度 || properties.lat,
            lng: properties.經度 || properties.lon,
          },
        };

        return { serviceItemsData };
      },
    };
  },
  {
    persist: true,
  }
);
