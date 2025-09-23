<script>
  /**
   * ServerLayersTab.vue
   *
   * Purpose:
   * - Service provider-based layer management
   * - Lists layer groups and layers with visibility toggles
   * - Hosts the service provider picker to load provider-specific date layers
   *
   * Notes:
   * - Similar to DateLayersTab but filters by service provider instead of date
   * - Shows all service dates for the selected service provider
   */
  import { computed, ref, onMounted } from 'vue';
  import { useDataStore } from '@/stores/dataStore.js';
  import { getIcon } from '../utils/utils.js';
  import ServiceProviderPicker from '../components/ServiceProviderPicker.vue';
  import FileSelector from '../components/FileSelector.vue';

  export default {
    name: 'ServerLayersTab',

    /**
     * 🧩 組件註冊 (Component Registration)
     * 註冊子組件
     */
    components: {
      ServiceProviderPicker,
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

      // 建立一個計算屬性，從 store 中獲取圖層數據
      const layers = computed(() => dataStore.layers);

      // 👤 服務人員選擇相關狀態（從 dataStore 獲取）
      const selectedServiceProvider = computed({
        get: () => dataStore.selectedServiceProvider,
        set: (value) => {
          if (value) {
            dataStore.setServiceProviderFilter(value);
          } else {
            dataStore.clearServiceProviderFilter();
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

      // 👤 可用服務人員清單
      const availableServiceProviders = computed(() => dataStore.availableServiceProviders);

      /**
       * 🔘 切換圖層可見性
       * 呼叫 store 中的 action 來切換指定圖層的顯示/隱藏狀態
       * @param {string} layerId - 要切換的圖層 ID
       */
      const toggleLayer = (layerId) => {
        console.log('🔘 ServerLayersTab: 切換圖層', layerId);
        dataStore.toggleLayerVisibility(layerId);
      };

      /**
       * 🔘 切換群組可見性
       * 呼叫 store 中的 action 來切換指定群組所有圖層的顯示/隱藏狀態
       * @param {string} groupName - 要切換的群組名稱
       */
      const toggleGroup = (groupName) => {
        console.log('🔘 ServerLayersTab: 切換群組', groupName);
        dataStore.toggleGroupVisibility(groupName);
      };

      /**
       * 🎨 獲取圖層顏色 (Get Layer Color)
       * 確保與地圖上顯示的顏色一致
       * @param {Object} layer - 圖層物件
       * @returns {string} CSS 顏色值
       */
      const getLayerColor = (layer) => {
        // 如果是服務日期圖層，從 GeoJSON features 中獲取實際使用的顏色
        if (layer.layerId && layer.layerId.startsWith('service-date-') && layer.geoJsonData) {
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
       * 👤 處理服務人員選擇事件
       * @param {string} providerId - 服務人員身分證 ID
       */
      const handleProviderSelected = async (providerId) => {
        console.log('👤 ServerLayersTab 接收到的服務人員ID:', providerId);

        // 切換服務人員時清空 right panel
        dataStore.setSelectedFeature(null);

        if (providerId) {
          dataStore.setServiceProviderFilter(providerId);
          // 載入該服務人員的所有日期圖層
          console.log('👤 開始載入服務人員日期圖層');
          await dataStore.loadServiceProviderDateLayers(providerId);
        } else {
          dataStore.clearServiceProviderFilter();
          // 清除服務人員群組圖層
          dataStore.clearServiceProviderDateLayers();
        }
      };

      /**
       * 📁 處理檔案選擇事件
       * @param {string} fileName - 檔案名稱
       */
      const handleFileSelected = async (fileName) => {
        console.log('📁 ServerLayersTab 接收到的檔案:', fileName);

        // 切換檔案時清空 right panel
        dataStore.setSelectedFeature(null);

        if (fileName) {
          dataStore.setFileFilter(fileName);
        } else {
          dataStore.clearFileFilter();
        }

        // 重新載入服務人員清單以應用檔案篩選
        console.log('📁 重新載入服務人員清單以應用檔案篩選');
        const providers = await dataStore.loadAvailableServiceProviders();

        // 如果當前選中的服務人員不在新的清單中，選擇第一個可用的服務人員
        if (providers && providers.length > 0) {
          const currentProvider = dataStore.selectedServiceProvider;
          const isCurrentProviderAvailable = providers.some((p) => p.id === currentProvider);

          if (!isCurrentProviderAvailable) {
            console.log('📁 當前服務人員不在篩選後的清單中，選擇第一個可用服務人員');
            const firstProvider = providers[0];
            await handleProviderSelected(firstProvider.id);
          } else if (currentProvider) {
            // 如果當前服務人員仍然可用，重新載入其日期圖層
            console.log('📁 重新載入當前服務人員的日期圖層');
            await dataStore.loadServiceProviderDateLayers(currentProvider);
          }
        } else {
          // 如果沒有可用的服務人員，清除選擇
          console.log('📁 沒有可用的服務人員，清除選擇');
          dataStore.clearServiceProviderFilter();
          dataStore.clearServiceProviderDateLayers();
        }
      };

      /**
       * 🚀 組件掛載時初始化
       * 載入服務人員清單並預設選擇第一個服務人員
       */
      onMounted(async () => {
        console.log('🚀 ServerLayersTab 組件掛載，開始載入服務人員清單');
        // 載入可用的服務人員清單
        const providers = await dataStore.loadAvailableServiceProviders();

        // 預設選擇第一個服務人員
        if (providers && providers.length > 0) {
          const firstProvider = providers[0];
          console.log('👤 預設選擇第一個服務人員:', firstProvider.id);
          await handleProviderSelected(firstProvider.id);
        }
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
        // 👤 服務人員選擇相關
        selectedServiceProvider,
        availableServiceProviders,
        handleProviderSelected,
        isServiceProviderFilterActive: computed(() => dataStore.isServiceProviderFilterActive),
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

        <!-- 👤 服務人員選擇區域 -->
        <div class="p-3">
          <div class="mb-2">
            <div class="my-title-xs-gray mb-1">
              選擇服務人員
              <span v-if="availableServiceProviders.length > 0" class="my-content-xs-gray">
                ({{ availableServiceProviders.length }})
              </span>
            </div>
            <ServiceProviderPicker
              v-model="selectedServiceProvider"
              @provider-selected="handleProviderSelected"
            />
          </div>
        </div>

        <!-- 🗂️ 圖層群組列表 -->
        <div
          v-for="group in layers.filter((g) => g.groupName === '服務日期列表')"
          :key="group.groupName"
          class="p-3"
        >
          <div class="d-flex align-items-center pb-2">
            <div class="my-title-xs-gray">
              {{ group.groupName }}
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

          <!-- 📅 圖層列表 -->
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
