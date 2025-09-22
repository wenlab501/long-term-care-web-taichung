<script>
  /**
   * DateLayersTab.vue
   *
   * Purpose:
   * - Lists layer groups and layers with visibility toggles.
   * - Hosts the service-date picker to load day-specific provider layers.
   *
   * Notes:
   * - Refactor only adds comments and headers; behavior and UI unchanged.
   */
  import { computed, ref, onMounted } from 'vue';
  import { useDataStore } from '@/stores/dataStore.js';
  import { getIcon } from '../utils/utils.js';
  import DatePicker from '../components/DatePicker.vue';
  import FileSelector from '../components/FileSelector.vue';

  export default {
    name: 'DateLayersTab',

    /**
     * 🧩 組件註冊 (Component Registration)
     * 註冊子組件
     */
    components: {
      DatePicker,
      FileSelector,
    },

    /**
     * 🔧 組件設定函數 (Component Setup)
     * 使用 Composition API 設定組件邏輯
     */
    setup() {
      // 📦 取得 Pinia 數據存儲實例
      const dataStore = useDataStore();

      // 建立一個 ref 來引用模板中的圖層列表 DOM 元素
      const layerListRef = ref(null);

      // 建立一個計算屬性，從 store 中獲取圖層數據。當 store 的 state 改變時，這裡會自動更新。
      const layers = computed(() => dataStore.layers);

      // 📅 日期選擇相關狀態（從 dataStore 獲取）
      const selectedServiceDate = computed({
        get: () => dataStore.selectedServiceDate,
        set: (value) => {
          if (value) {
            dataStore.setServiceDateFilter(value);
          } else {
            dataStore.clearServiceDateFilter();
          }
        },
      });

      // 📁 檔案選擇相關狀態（從 dataStore 獲取）
      const selectedFileFilter = computed({
        get: () => dataStore.selectedFileFilter,
        set: (value) => {
          if (value) {
            dataStore.setFileFilter(value);
          } else {
            dataStore.clearFileFilter();
          }
        },
      });

      /**
       * 🔘 切換圖層可見性
       * 呼叫 store 中的 action 來切換指定圖層的顯示/隱藏狀態
       * @param {string} layerId - 要切換的圖層 ID
       */
      const toggleLayer = (layerId) => {
        console.log('🔘 DateLayersTab: 切換圖層', layerId);
        dataStore.toggleLayerVisibility(layerId);

        // 如果是服務人員圖層，設置或清除對應的服務人員
        if (layerId && layerId.startsWith('service-provider-')) {
          const layer = dataStore.findLayerById(layerId);
          if (layer && layer.visible) {
            // 從圖層 ID 中提取服務人員身分證號碼
            const serviceProviderId = layerId.replace('service-provider-', '');
            console.log('🔘 DateLayersTab: 設置服務人員', serviceProviderId);
            dataStore.selectedServiceProvider = serviceProviderId;
          } else {
            // 圖層被關閉時，如果當前選中的服務人員就是這個圖層的，則清除選擇
            const serviceProviderId = layerId.replace('service-provider-', '');
            if (dataStore.selectedServiceProvider === serviceProviderId) {
              console.log('🔘 DateLayersTab: 清除服務人員選擇');
              dataStore.selectedServiceProvider = '';
            }
          }
        }

        // 如果是服務日期圖層，設置對應的服務日期
        if (layerId && layerId.startsWith('service-date-')) {
          const layer = dataStore.findLayerById(layerId);
          if (layer && layer.visible) {
            // 從圖層 ID 中提取服務日期
            const serviceDate = layerId.replace('service-date-', '');
            console.log('🔘 DateLayersTab: 設置服務日期', serviceDate);
            dataStore.setServiceDateFilter(serviceDate);
          } else {
            // 圖層被關閉時，如果當前選中的服務日期就是這個圖層的，則清除選擇
            const serviceDate = layerId.replace('service-date-', '');
            if (dataStore.selectedServiceDate === serviceDate) {
              console.log('🔘 DateLayersTab: 清除服務日期選擇');
              dataStore.clearServiceDateFilter();
            }
          }
        }
      };

      /**
       * 🔘 切換群組可見性
       * 呼叫 store 中的 action 來切換指定群組所有圖層的顯示/隱藏狀態
       * @param {string} groupName - 要切換的群組名稱
       */
      const toggleGroup = (groupName) => {
        console.log('🔘 DateLayersTab: 切換群組', groupName);
        dataStore.toggleGroupVisibility(groupName);
      };

      /**
       * 🎨 獲取圖層顏色 (Get Layer Color)
       * 確保與地圖上顯示的顏色一致
       * @param {Object} layer - 圖層物件
       * @returns {string} CSS 顏色值
       */
      const getLayerColor = (layer) => {
        // 如果是服務人員圖層，從 GeoJSON features 中獲取實際使用的顏色
        if (layer.layerId && layer.layerId.startsWith('service-provider-') && layer.geoJsonData) {
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
       * 📅 處理日期選擇事件
       * @param {string} dateStr - 7碼日期字串 (例如: 1140701)
       */
      const handleDateSelected = async (dateStr) => {
        console.log('📅 DateLayersTab 接收到的日期:', dateStr);
        console.log('📅 日期長度:', dateStr ? dateStr.length : 'null');
        console.log('📅 預期的民國年格式:', dateStr);

        // 切換服務日期時清空 right panel
        dataStore.setSelectedFeature(null);

        if (dateStr) {
          dataStore.setServiceDateFilter(dateStr);
          // 載入該日期的服務人員圖層
          console.log('📅 開始載入服務人員圖層');
          await dataStore.loadServiceProviderLayers(dateStr);
        } else {
          dataStore.clearServiceDateFilter();
          // 清除所有服務人員圖層
          dataStore.clearServiceProviderLayers();
        }
      };

      /**
       * 📁 處理檔案選擇事件
       * @param {string} fileName - 檔案名稱
       */
      const handleFileSelected = async (fileName) => {
        console.log('📁 DateLayersTab 接收到的檔案:', fileName);

        // 切換檔案時清空 right panel
        dataStore.setSelectedFeature(null);

        if (fileName) {
          dataStore.setFileFilter(fileName);
          // 重新載入當前日期的服務人員圖層以應用檔案篩選
          if (dataStore.selectedServiceDate) {
            console.log('📁 重新載入服務人員圖層以應用檔案篩選');
            await dataStore.loadServiceProviderLayers(dataStore.selectedServiceDate);
          }
        } else {
          dataStore.clearFileFilter();
          // 重新載入以顯示所有資料
          if (dataStore.selectedServiceDate) {
            await dataStore.loadServiceProviderLayers(dataStore.selectedServiceDate);
          }
        }
      };

      /**
       * 🚀 組件掛載時初始化
       * 載入預設日期 (7月1日) 的服務人員圖層
       */
      onMounted(async () => {
        console.log('🚀 DateLayersTab 組件掛載，開始載入預設日期數據');
        // 載入預設日期的服務人員圖層
        await dataStore.loadServiceProviderLayers('1140701');
      });

      // 📤 將需要暴露給 <template> 使用的數據和方法返回
      return {
        layers,
        toggleLayer,
        toggleGroup,
        isGroupVisible: dataStore.isGroupVisible,
        layerListRef,
        getIcon,
        getLayerColor,
        // 📅 日期選擇相關
        selectedServiceDate,
        handleDateSelected,
        isDateFilterActive: computed(() => dataStore.isDateFilterActive),
        // 📁 檔案選擇相關
        selectedFileFilter,
        handleFileSelected,
        isFileFilterActive: computed(() => dataStore.isFileFilterActive),
      };
    },
  };
</script>

<template>
  <div class="h-100 d-flex flex-column overflow-hidden my-bgcolor-gray-100">
    <div class="flex-grow-1 overflow-auto layer-list-container" ref="layerListRef">
      <div class="mb-3">
        <!-- 📁 檔案選擇區域 -->
        <div class="p-3">
          <div class="mb-2">
            <div class="my-title-xs-gray mb-1">選擇資料來源</div>
            <FileSelector v-model="selectedFileFilter" @file-selected="handleFileSelected" />
          </div>
        </div>

        <!-- 📅 服務日期選擇區域 -->
        <div class="p-3">
          <div class="mb-2">
            <div class="my-title-xs-gray mb-1">選擇服務日期</div>
            <DatePicker
              v-model="selectedServiceDate"
              placeholder="選擇服務日期"
              @date-selected="handleDateSelected"
            />
          </div>
        </div>

        <div
          v-for="group in layers.filter((g) => g.groupName === '服務人員列表')"
          :key="group.groupName"
          class="p-3"
        >
          <div class="d-flex align-items-center pb-2">
            <div class="my-title-xs-gray">
              {{ group.groupName }}
              <span v-if="selectedServiceDate"> - {{ selectedServiceDate }}</span>
              <span v-if="group.groupLayers.length > 0"> ({{ group.groupLayers.length }}) </span>
            </div>
            <!-- 群組開關 - 有圖層時才顯示 -->
            <div
              v-if="group.groupLayers.length > 0"
              class="d-flex align-items-center justify-content-center ms-auto"
            >
              <input
                type="checkbox"
                :id="'group-switch-' + group.groupName"
                :checked="isGroupVisible(group.groupName)"
                @change="toggleGroup(group.groupName)"
              />
              <label
                :for="'group-switch-' + group.groupName"
                :style="{
                  '--layer-color': 'var(--my-color-green)',
                }"
              ></label>
            </div>
          </div>

          <div v-for="layer in group.groupLayers" :key="layer.layerId" class="mb-1">
            <!-- 圖層卡片 -->
            <div
              class="btn rounded-0 border-0 d-flex shadow-sm my-bgcolor-white-hover p-0"
              @click="toggleLayer(layer.layerId)"
            >
              <!-- 圖層圖示 -->
              <div
                class="d-flex"
                :style="{
                  backgroundColor: getLayerColor(layer),
                  minWidth: '6px',
                }"
              ></div>
              <div class="w-100">
                <div class="d-flex">
                  <!-- 圖層名稱 -->
                  <div class="d-flex align-items-center text-start w-100 px-3 py-2">
                    <span class="my-content-sm-black">
                      {{ layer.layerName }}
                      <span class="my-content-xs-gray ms-2">
                        {{ layer.summaryData?.totalCount }}
                      </span>
                    </span>
                  </div>
                  <!-- 切換圖層可見性 -->
                  <div class="d-flex align-items-center justify-content-center px-3 py-2">
                    <input
                      type="checkbox"
                      :id="'switch-' + layer.layerId"
                      :checked="layer.visible"
                      :disabled="layer.isLoading"
                      @change="toggleLayer(layer.layerId)"
                    />
                    <label
                      :for="'switch-' + layer.layerId"
                      :style="{
                        '--layer-color': 'var(--my-color-green)',
                      }"
                    ></label>
                  </div>
                </div>
                <div v-if="layer.legendData && layer.visible" class="px-3 pb-2">
                  <div
                    v-for="data in layer.legendData"
                    :key="data.color"
                    class="d-flex align-items-center"
                  >
                    <div
                      style="min-width: 6px; min-height: 18px"
                      :style="{
                        backgroundColor: data.color,
                      }"
                    ></div>
                    <div class="my-content-xs-black text-nowrap ms-2">{{ data.label }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* 🎨 圖層切換開關樣式 (Layer Toggle Switch Styles) */
  /* https://www.tpisoftware.com/tpu/articleDetails/2744 */

  input[type='checkbox'] {
    height: 0;
    width: 0;
    visibility: hidden;
  }

  label {
    cursor: pointer;
    width: 28px;
    height: 16px;
    background: var(--my-color-gray-300);
    display: block;
    border-radius: 16px;
    position: relative;
    transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 優化背景色過渡 */
  }

  label:after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    background: var(--my-color-white);
    border-radius: 12px;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); /* 優化滑動過渡 */
  }

  input:checked + label {
    background: var(--layer-color, var(--my-color-green));
  }

  input:checked + label:after {
    transform: translateX(12px);
  }
</style>
