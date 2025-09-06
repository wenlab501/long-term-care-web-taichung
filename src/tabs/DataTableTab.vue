<script setup>
  /**
   * DataTableTab.vue
   *
   * Purpose:
   * - Displays per-layer tabbed data tables with sorting and highlight interactions.
   * - Mirrors layer colors consistent with the map rendering.
   *
   * Notes:
   * - Non-functional refactor: documentation only; behavior and UI unchanged.
   */
  import { ref, computed, defineEmits, onMounted, watch } from 'vue';
  import { useDataStore } from '@/stores/dataStore.js';

  const emit = defineEmits(['highlight-on-map', 'show-service-point-detail']);

  const dataStore = useDataStore();

  const activeLayerTab = ref(null); /** 📑 當前作用中的圖層分頁 */
  const layerSortStates = ref({}); /** 📊 每個圖層的排序狀態 */

  // 獲取所有開啟且有資料的圖層
  const visibleLayers = computed(() => {
    const allLayers = dataStore.getAllLayers();
    return allLayers.filter((layer) => layer.visible);
  });

  /**
   * 📑 設定作用中圖層分頁 (Set Active Layer Tab)
   * @param {string} layerId - 圖層 ID
   */
  const setActiveLayerTab = (layerId) => {
    activeLayerTab.value = layerId;
  };

  /**
   * 根據圖層類型返回固定的欄位名稱（簡化顯示）
   * @param {object} layer - 圖層物件
   * @returns {string[]} - 固定的欄位名稱陣列
   */
  const getLayerColumns = (layer) => {
    // 檢查是否為服務人員圖層（新基準中央服務紀錄）
    const isServiceLayer =
      layer.layerId &&
      (layer.layerId.startsWith('service-provider-') || layer.layerId.startsWith('service-date-'));

    if (isServiceLayer) {
      // 服務人員圖層只顯示指定的欄位（合併起始/結束為「服務時間」，姓名與性別合併為姓名一欄並以顏色表示）
      return ['#', '編號', '姓名', '個案居住地址', '服務時間', '總時間', '交通時間', '服務數量'];
    }

    // 其他圖層使用原來的動態欄位邏輯
    const data = getSortedData(layer);

    // 如果沒有資料或資料為空，返回一個空陣列
    if (!data || data.length === 0) {
      return [];
    }

    // 取第一筆資料作為樣本
    const sampleItem = data[0];

    // 使用 Object.keys 獲取所有屬性名稱 (key)
    // 並過濾掉不適合直接顯示在表格中的複雜物件 (例如 geometry)
    return Object.keys(sampleItem).filter((key) => {
      const value = sampleItem[key];
      // 只保留值不是物件，或值雖是物件但為 null 的鍵
      return typeof value !== 'object' || value === null;
    });
  };

  /**
   * 📊 取得圖層資料數量 (Get Layer Data Count)
   * @param {Object} layer - 圖層物件
   * @returns {number} 資料數量
   */
  const getLayerDataCount = (layer) => {
    return layer.tableData?.length || 0;
  };

  /**
   * 📊 取得排序後的資料 (Get Sorted Data)
   * @param {Object} layer - 圖層物件
   * @returns {Array} 排序後的資料陣列
   */
  const getSortedData = (layer) => {
    console.log('🔍 getSortedData 被調用:', layer.layerId, layer.tableData);

    if (!layer.tableData) {
      console.log('⚠️ 沒有 tableData');
      return [];
    }

    const sortState = layerSortStates.value[layer.layerId];
    if (!sortState || !sortState.key) {
      console.log('📊 返回原始 tableData:', layer.tableData.length, '筆資料');
      return layer.tableData;
    }

    return [...layer.tableData].sort((a, b) => {
      const aValue = a[sortState.key];
      const bValue = b[sortState.key];

      // 字串類型的比較
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortState.order === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // 數值類型的比較
      return sortState.order === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  /**
   * 📊 處理排序點擊 (Handle Sort Click)
   * @param {string} layerId - 圖層 ID
   * @param {string} key - 排序欄位
   */
  const handleSort = (layerId, key) => {
    if (!layerSortStates.value[layerId]) {
      layerSortStates.value[layerId] = { key: null, order: 'asc' };
    }

    const sortState = layerSortStates.value[layerId];

    if (sortState.key === key) {
      // 切換排序方向
      sortState.order = sortState.order === 'asc' ? 'desc' : 'asc';
    } else {
      // 設定新的排序欄位
      sortState.key = key;
      sortState.order = 'asc';
    }
  };

  /**
   * 🎨 取得排序圖示 (Get Sort Icon)
   * @param {string} layerId - 圖層 ID
   * @param {string} key - 欄位名稱
   * @returns {string} FontAwesome 圖示類別
   */
  const getSortIcon = (layerId, key) => {
    const sortState = layerSortStates.value[layerId];
    if (!sortState || sortState.key !== key) {
      return 'fas fa-sort';
    }
    return sortState.order === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  };

  /**
   * 🎨 獲取圖層顏色 (Get Layer Color)
   * 確保與地圖上顯示的顏色一致
   * @param {Object} layer - 圖層物件
   * @returns {string} CSS 顏色值
   */
  const getLayerColor = (layer) => {
    // 如果是服務人員圖層，從 GeoJSON features 中獲取實際使用的顏色
    if (
      layer.layerId &&
      (layer.layerId.startsWith('service-provider-') ||
        layer.layerId.startsWith('service-date-')) &&
      layer.geoJsonData
    ) {
      const features = layer.geoJsonData.features || [];
      if (features.length > 0) {
        // 優先使用 fillColor，如果沒有則使用 routeColor
        const firstFeature = features[0];
        if (firstFeature.properties) {
          if (firstFeature.properties.fillColor) {
            return `var(--my-color-${firstFeature.properties.fillColor})`;
          } else if (firstFeature.properties.routeColor) {
            return `var(--my-color-${firstFeature.properties.routeColor})`;
          }
        }
      }
    }

    // 回退到使用 layer.colorName
    return layer.colorName ? `var(--my-color-${layer.colorName})` : 'var(--my-color-gray-300)';
  };

  /**
   * 📊 獲取欄位顯示值 (Get Column Display Value)
   * @param {Object} item - 資料項目
   * @param {string} column - 欄位名稱
   * @param {Object} layer - 圖層物件
   * @param {number} index - 項目在列表中的索引
   * @returns {string} 顯示值
   */
  const getColumnDisplayValue = (item, column, layer, index = 0) => {
    // 檢查是否為服務人員圖層
    const isServiceLayer =
      layer.layerId &&
      (layer.layerId.startsWith('service-provider-') || layer.layerId.startsWith('service-date-'));

    if (isServiceLayer) {
      // 服務人員圖層的欄位映射
      switch (column) {
        case '#':
          // # 欄位應該顯示序號，如果沒有則根據索引生成（從1開始）
          return item['#'] || (index + 1).toString();
        case '編號':
          return item.編號 || 'N/A';
        case '姓名': {
          const name = item.姓名 || 'N/A';
          const gender = item.性別 || '';
          const colorClass =
            gender === '男性' ? 'my-color-blue' : gender === '女性' ? 'my-color-red' : '';
          const abbr = gender === '男性' ? 'M' : gender === '女性' ? 'F' : '';
          // 顯示 姓名 (M/F)，並以顏色標示性別
          return `<span class="${colorClass}">${name}${abbr ? ` (${abbr})` : ''}</span>`;
        }
        case '個案居住地址':
          return item.個案居住地址 || 'N/A';
        case '服務時間': {
          // 組合「起始時間 - 結束時間」
          const start = (() => {
            if (item.時間) return item.時間; // 若時間已包含起始，仍優先使用
            if (item.起始時間) return item.起始時間;
            if (item.hour_start !== undefined && item.min_start !== undefined) {
              return `${item.hour_start}:${String(item.min_start).padStart(2, '0')}`;
            }
            return 'N/A';
          })();

          const end = (() => {
            if (item.結束時間) return item.結束時間;
            if (item.hour_end !== undefined && item.min_end !== undefined) {
              return `${item.hour_end}:${String(item.min_end).padStart(2, '0')}`;
            }
            return 'N/A';
          })();

          return `${start} - ${end}`;
        }
        case '總時間':
          // 優先使用已計算的總時間，否則從時間差計算
          if (item.總時間) {
            return item.總時間;
          } else if (
            item.hour_start !== undefined &&
            item.min_start !== undefined &&
            item.hour_end !== undefined &&
            item.min_end !== undefined
          ) {
            const startMinutes = item.hour_start * 60 + item.min_start;
            const endMinutes = item.hour_end * 60 + item.min_end;
            const totalMinutes = endMinutes - startMinutes;
            if (totalMinutes > 0) {
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
            }
          }
          return 'N/A';
        case '交通時間':
          // 優先使用已格式化的交通時間
          if (item.交通時間) {
            return item.交通時間;
          } else if (item.hour_traffic !== undefined && item.min_traffic !== undefined) {
            const hours = item.hour_traffic || 0;
            const minutes = item.min_traffic || 0;
            if (hours > 0 || minutes > 0) {
              return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
            }
          }
          return '0m';
        case '服務數量':
          return (
            item.service_items_count ??
            (Array.isArray(item.service_items) ? item.service_items.length : null) ??
            item.服務數量 ??
            0
          ).toString();
        default:
          return item[column] || 'N/A';
      }
    }

    // 其他圖層使用原始值
    return item[column] || 'N/A';
  };

  /**
   * 🎯 處理地圖高亮顯示 (Handle Map Highlighting)
   * @param {Object} item - 要高亮的項目
   * @param {Object} layer - 圖層物件
   */
  const handleHighlight = (item, layer) => {
    console.log('🎯 DataTableTab: 準備高亮顯示:', { item, layer: layer.layerName });

    // 檢查是否已經選取了相同的要素
    const itemId = item.id || item['#'] || item.編號;
    const isSameFeature =
      dataStore.selectedFeature &&
      dataStore.selectedFeature.properties &&
      dataStore.selectedFeature.properties.id === itemId;

    if (isSameFeature) {
      // 如果點擊的是已經選取的要素，清除選取
      console.log('🎯 DataTableTab: 點擊已選取的要素，清除選取');
      dataStore.setSelectedFeature(null);

      // 發送地圖高亮清除事件
      const clearHighlightData = {
        id: null, // 清除高亮
        layerId: layer.layerId,
        layerName: layer.layerName,
      };

      setTimeout(() => {
        emit('highlight-on-map', clearHighlightData);
      }, 50);
      return;
    }

    // 檢查是否為服務人員圖層
    const isServiceLayer =
      layer.layerId &&
      (layer.layerId.startsWith('service-provider-') || layer.layerId.startsWith('service-date-'));

    if (isServiceLayer) {
      console.log('🎯 DataTableTab: 處理服務人員圖層點擊:', item);

      // 先清除之前的選取
      dataStore.setSelectedFeature(null);

      // 使用共用的工具函數創建服務項目資料
      const { serviceItemsData } = dataStore.createServiceItemsData(item, layer);

      console.log('🎯 DataTableTab: 創建的服務項目資料:', serviceItemsData);

      // 發送服務項目列表到父組件，觸發右側面板顯示
      emit('show-service-point-detail', serviceItemsData);

      // 發送特殊的地圖高亮事件，專門用於服務項目高亮
      const serviceHighlightData = {
        type: 'service-item-highlight',
        layerId: layer.layerId,
        layerName: layer.layerName,
        item: item,
        serviceProviderId: layer.serviceProviderId,
        serviceDate: layer.serviceDate,
        coordinates: {
          lat: item.緯度 || item.lat,
          lon: item.經度 || item.lon,
        },
      };

      console.log('🎯 DataTableTab: 發送服務項目高亮事件:', serviceHighlightData);

      setTimeout(() => {
        emit('highlight-on-map', serviceHighlightData);
      }, 100);
    } else {
      // 其他圖層的原有邏輯
      const highlightData = {
        id: item.id || item['#'] || item.編號,
        layerId: layer.layerId,
        layerName: layer.layerName,
        item: item,
      };

      console.log('🎯 DataTableTab: 發送一般高亮事件:', highlightData);

      // 添加小延遲，確保地圖已準備就緒
      setTimeout(() => {
        emit('highlight-on-map', highlightData);
      }, 50);
    }
  };

  // 記錄上一次的圖層列表用於比較
  const previousLayers = ref([]);

  /**
   * 👀 監聽可見圖層變化，自動切換到新開啟的圖層分頁
   */
  watch(
    () => visibleLayers.value,
    (newLayers) => {
      // 如果沒有可見圖層，清除選中的分頁
      if (newLayers.length === 0) {
        activeLayerTab.value = null;
        previousLayers.value = [];
        return;
      }

      // 找出新增的圖層（比較新舊圖層列表）
      const previousLayerIds = previousLayers.value.map((layer) => layer.layerId);
      const newLayerIds = newLayers.map((layer) => layer.layerId);
      const addedLayerIds = newLayerIds.filter((id) => !previousLayerIds.includes(id));

      // 如果有新增的圖層，自動切換到最新新增的圖層
      if (addedLayerIds.length > 0) {
        const newestAddedLayerId = addedLayerIds[addedLayerIds.length - 1];
        activeLayerTab.value = newestAddedLayerId;
        console.log(
          `🔄 自動切換到新開啟的圖層: ${newLayers.find((layer) => layer.layerId === newestAddedLayerId)?.layerName}`
        );
      }
      // 如果當前沒有選中分頁，或選中的分頁不在可見列表中，選中第一個
      else if (
        !activeLayerTab.value ||
        !newLayers.find((layer) => layer.layerId === activeLayerTab.value)
      ) {
        activeLayerTab.value = newLayers[0].layerId;
      }

      // 更新記錄的圖層列表
      previousLayers.value = [...newLayers];
    },
    { deep: true, immediate: true }
  );

  /**
   * 🚀 組件掛載事件 (Component Mounted Event)
   */
  onMounted(() => {
    console.log('[MultiLayerDataTableTab] Component Mounted');

    // 初始化第一個可見圖層為作用中分頁
    if (visibleLayers.value.length > 0 && !activeLayerTab.value) {
      activeLayerTab.value = visibleLayers.value[0].layerId;
    }
  });
</script>

<template>
  <!-- 📊 多圖層資料表格分頁組件 -->
  <div class="d-flex flex-column my-bgcolor-gray-200 h-100">
    <!-- 📑 圖層分頁導航 -->
    <div v-if="visibleLayers.length > 0" class="">
      <ul class="nav nav-tabs nav-fill">
        <li
          v-for="layer in visibleLayers"
          :key="layer.layerId"
          class="nav-item d-flex flex-column align-items-center"
        >
          <!-- tab按鈕 -->
          <div
            class="btn nav-link rounded-0 border-0 position-relative d-flex align-items-center justify-content-center my-bgcolor-gray-200"
            :class="{
              active: activeLayerTab === layer.layerId,
            }"
            @click="setActiveLayerTab(layer.layerId)"
          >
            <span class="my-title-sm-black"
              >{{ layer.layerName }}
              <span class="my-content-xs-gray ms-2" v-if="getLayerDataCount(layer)">
                {{ getLayerDataCount(layer) }}
              </span>
            </span>
          </div>
          <div
            class="w-100"
            :style="{
              backgroundColor: getLayerColor(layer),
              minHeight: '4px',
            }"
          ></div>
        </li>
      </ul>
    </div>

    <!-- 📋 圖層表格內容區域 -->
    <div v-if="visibleLayers.length > 0" class="flex-grow-1 overflow-hidden">
      <div
        v-for="layer in visibleLayers"
        :key="layer.layerId"
        v-show="activeLayerTab === layer.layerId"
        class="h-100"
      >
        <div class="h-100 d-flex flex-column">
          <div class="flex-grow-1 overflow-auto">
            <table class="table w-100 mb-0">
              <thead class="sticky-top my-table-thead">
                <tr class="text-center text-nowrap">
                  <template v-for="column in getLayerColumns(layer)" :key="column">
                    <th
                      v-if="column !== 'color'"
                      @click="handleSort(layer.layerId, column)"
                      class="my-bgcolor-white-hover p-1 my-cursor-pointer"
                    >
                      <span class="my-title-xs-gray text-nowrap">
                        {{ column }}
                      </span>
                      <span class="my-title-xs-gray text-nowrap ms-2">
                        <i :class="getSortIcon(layer.layerId, column)"></i>
                      </span>
                    </th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, rowIndex) in getSortedData(layer)"
                  :key="item.id"
                  class="my-table-tr-hover text-center text-nowrap border-bottom my-cursor-pointer"
                  @click="
                    () => {
                      console.log('🔥 表格行被點擊了!', item, layer);
                      handleHighlight(item, layer);
                    }
                  "
                >
                  <template v-for="column in getLayerColumns(layer)" :key="column">
                    <td
                      v-if="column !== 'color'"
                      class="border-0 text-nowrap text-truncate p-0"
                      style="max-width: 80px"
                    >
                      <div v-if="column === '#'" class="d-flex p-0">
                        <div
                          style="min-width: 6px"
                          :style="{
                            backgroundColor: getLayerColor(layer),
                          }"
                        ></div>
                        <div class="my-content-xs-black w-100 px-3 py-2">
                          {{ getColumnDisplayValue(item, column, layer, rowIndex) }}
                        </div>
                      </div>
                      <div v-else class="my-content-xs-black px-3 py-2">
                        <template
                          v-if="
                            column === '交通時間' &&
                            (layer.layerId.startsWith('service-provider-') ||
                              layer.layerId.startsWith('service-date-')) &&
                            rowIndex === 0
                          "
                          >-</template
                        >
                        <template v-else>
                          <span
                            v-if="column === '姓名'"
                            v-html="getColumnDisplayValue(item, column, layer, rowIndex)"
                          ></span>
                          <span v-else>{{
                            getColumnDisplayValue(item, column, layer, rowIndex)
                          }}</span>
                        </template>
                      </div>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 📭 無開啟圖層的空狀態 -->
    <div v-else class="flex-grow-1 d-flex align-items-center justify-content-center">
      <div class="text-center">
        <div class="my-title-md-gray p-3">沒有開啟的圖層</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .my-table-thead {
    border-bottom: 2px solid var(--my-color-gray-300) !important;
  }
</style>
