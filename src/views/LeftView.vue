<script>
  /**
   * LeftView.vue
   *
   * Purpose:
   * - Hosts the left panel including the layer tabs and optional service point detail.
   * - Provides tab switching functionality between DateLayersTab and ServerLayersTab.
   *
   * Notes:
   * - Updated to support tab system similar to UpperView.vue
   */
  import { computed } from 'vue';
  import { useDataStore } from '../stores/dataStore.js';
  import DateLayersTab from '../tabs/DateLayersTab.vue';
  import ServerLayersTab from '../tabs/ServerLayersTab.vue';

  export default {
    name: 'LeftView',

    /**
     * 🧩 組件註冊 (Component Registration)
     * 註冊左側面板內使用的子組件
     */
    components: {
      DateLayersTab, // 日期圖層分頁組件
      ServerLayersTab, // 伺服器圖層分頁組件
    },

    /**
     * 🔧 組件屬性定義 (Component Props)
     * 接收來自父組件的服務點詳細資訊
     */
    props: {
      selectedServicePoint: {
        type: Object,
        default: null,
      },
    },

    /**
     * 📡 組件事件定義 (Component Events)
     * 定義向父組件發送的事件類型
     */
    emits: ['clear-service-point-detail'],

    /**
     * 🔧 組件設定函數 (Component Setup)
     * 使用 Composition API 設定組件邏輯
     */
    setup(props, { emit }) {
      // 📦 取得 Pinia 數據存儲實例
      const dataStore = useDataStore();

      // 📑 分頁狀態管理 (Tab State Management)
      /** 🗂️ 左側分頁狀態 (從 dataStore 獲取，使用 computed 確保響應式) */
      const activeLeftTab = computed(() => dataStore.activeLeftTab);

      /**
       * 📋 清除服務點詳細資訊
       */
      const clearServicePointDetail = () => {
        emit('clear-service-point-detail');
      };

      /**
       * 🔄 切換左側分頁
       * @param {string} tabName - 分頁名稱 ('date' 或 'server')
       */
      const switchLeftTab = async (tabName) => {
        // 保存當前選中的服務點，避免切換 tab 時丟失
        const currentSelectedFeature = dataStore.selectedFeature;

        dataStore.setActiveLeftTab(tabName);
        // 切換左側分頁時清空地圖顯示
        dataStore.hideAllLayersOnMap();

        // 暫時清空選中物件，稍後會根據需要恢復
        dataStore.setSelectedFeature(null);

        // 根據切換到的 tab 重新載入相應的資料
        if (tabName === 'date') {
          // 切換到服務日期 tab 時，根據當前選中的日期載入服務人員圖層
          if (dataStore.selectedServiceDate && dataStore.isDateFilterActive) {
            console.log('🔄 切換到服務日期 tab，重新載入服務人員圖層', {
              selectedDate: dataStore.selectedServiceDate,
              fileFilter: dataStore.selectedFileFilter,
              isFileFilterActive: dataStore.isFileFilterActive,
            });
            await dataStore.loadServiceProviderLayers(dataStore.selectedServiceDate);
          }
        } else if (tabName === 'server') {
          // 切換到服務人員 tab 時，先重新載入服務人員清單
          console.log('🔄 切換到服務人員 tab，重新載入服務人員清單', {
            fileFilter: dataStore.selectedFileFilter,
            isFileFilterActive: dataStore.isFileFilterActive,
          });
          const providers = await dataStore.loadAvailableServiceProviders();

          // 檢查是否有可用的服務人員
          if (providers && providers.length > 0) {
            const currentProvider = dataStore.selectedServiceProvider;
            const isCurrentProviderAvailable = providers.some((p) => p.id === currentProvider);

            // 如果沒有選中服務人員，或者當前選中的服務人員不在新的清單中，自動選擇第一個
            if (
              !currentProvider ||
              !dataStore.isServiceProviderFilterActive ||
              !isCurrentProviderAvailable
            ) {
              const firstProvider = providers[0];
              console.log(
                '🔄 沒有選中服務人員或當前服務人員不可用，自動選擇第一個:',
                firstProvider.id
              );
              dataStore.setServiceProviderFilter(firstProvider.id);
            }

            // 載入當前選中服務人員的日期圖層
            if (dataStore.selectedServiceProvider && dataStore.isServiceProviderFilterActive) {
              console.log('🔄 切換到服務人員 tab，重新載入日期圖層', {
                selectedProvider: dataStore.selectedServiceProvider,
                fileFilter: dataStore.selectedFileFilter,
                isFileFilterActive: dataStore.isFileFilterActive,
              });
              await dataStore.loadServiceProviderDateLayers(dataStore.selectedServiceProvider);
            }
          } else {
            // 如果沒有可用的服務人員，清除服務人員群組的圖層
            console.log('🔄 切換到服務人員 tab，但沒有可用的服務人員，清除圖層');
            dataStore.clearServiceProviderDateLayers();
          }
        }

        // 資料載入完成後，嘗試恢復之前選中的服務點
        if (currentSelectedFeature) {
          console.log('🔄 嘗試恢復之前選中的服務點:', currentSelectedFeature);
          // 延遲一點時間確保圖層載入完成，然後使用智能恢復函數
          setTimeout(() => {
            dataStore.restoreSelectedFeature(currentSelectedFeature);
          }, 500);
        }
      };

      // 📤 返回響應式數據給模板使用
      return {
        activeLeftTab,
        switchLeftTab,
        clearServicePointDetail,
      };
    },
  };
</script>

<template>
  <div class="my-bgcolor-gray-100 h-100 d-flex flex-column overflow-hidden">
    <!-- 📰 頁面標題區域 -->
    <div class="p-3">
      <h1 class="my-font-size-lg my-letter-spacing-lg text-center m-3">台灣居護長照服務路線</h1>

      <!-- 🎛️ 分頁導航按鈕 (Tab Navigation Buttons) -->
      <div class="d-flex justify-content-center pt-3">
        <div class="d-flex align-items-center rounded-pill shadow my-blur gap-1 p-2">
          <!-- 日期圖層分頁按鈕 -->
          <button
            class="btn rounded-pill border-0 d-flex align-items-center justify-content-center my-btn-transparent my-font-size-xs"
            :class="{
              'my-btn-blue': activeLeftTab === 'date',
            }"
            @click="switchLeftTab('date')"
            style="height: 30px"
            title="日期圖層"
          >
            <i class="fas fa-calendar-day"></i>
            <span class="ps-2">服務日期</span>
          </button>

          <!-- 伺服器圖層分頁按鈕 -->
          <button
            class="btn rounded-pill border-0 d-flex align-items-center justify-content-center my-btn-transparent my-font-size-xs"
            :class="{
              'my-btn-blue': activeLeftTab === 'server',
            }"
            @click="switchLeftTab('server')"
            style="height: 30px"
            title="伺服器圖層"
          >
            <i class="fa-solid fa-user-nurse"></i>
            <span class="ps-2">服務人員</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 📋 分頁內容區域 -->
    <div class="flex-grow-1 overflow-hidden">
      <!-- 📅 日期圖層分頁內容 -->
      <div v-show="activeLeftTab === 'date'" class="h-100">
        <DateLayersTab />
      </div>

      <!-- 🖥️ 伺服器圖層分頁內容 -->
      <div v-show="activeLeftTab === 'server'" class="h-100">
        <ServerLayersTab />
      </div>

      <!-- 📋 服務點詳細資訊區域 (Service Point Detail Area) -->
      <div v-if="selectedServicePoint" class="mt-3 p-3 my-bgcolor-white rounded shadow-sm">
        <h6 class="my-title-sm-black mb-3">
          <i class="fas fa-info-circle me-2"></i>
          服務點詳細資訊
        </h6>

        <div class="row g-2">
          <div class="col-12">
            <div class="my-content-xs-gray mb-1">姓名</div>
            <div class="my-content-sm-black">
              {{ selectedServicePoint.servicePointInfo?.name || '無資料' }}
            </div>
          </div>

          <div class="col-12">
            <div class="my-content-xs-gray mb-1">服務地址</div>
            <div class="my-content-sm-black">
              {{ selectedServicePoint.servicePointInfo?.address || '無資料' }}
            </div>
          </div>

          <div class="col-6">
            <div class="my-content-xs-gray mb-1">服務時間</div>
            <div class="my-content-sm-black">
              {{ selectedServicePoint.servicePointInfo?.time || '無資料' }}
            </div>
          </div>

          <div class="col-6">
            <div class="my-content-xs-gray mb-1">服務項目代碼</div>
            <div class="my-content-sm-black">
              {{ selectedServicePoint.servicePointInfo?.serviceType || '無資料' }}
            </div>
          </div>

          <div class="col-6">
            <div class="my-content-xs-gray mb-1">順序</div>
            <div class="my-content-sm-black">
              {{ selectedServicePoint.servicePointInfo?.order || '無資料' }}
            </div>
          </div>

          <div class="col-6">
            <div class="my-content-xs-gray mb-1">服務日期</div>
            <div class="my-content-sm-black">
              {{ selectedServicePoint.servicePointInfo?.serviceDate || '無資料' }}
            </div>
          </div>

          <div class="col-12">
            <div class="my-content-xs-gray mb-1">座標</div>
            <div class="my-content-sm-black">
              {{
                selectedServicePoint.servicePointInfo?.lat &&
                selectedServicePoint.servicePointInfo?.lng
                  ? `${selectedServicePoint.servicePointInfo.lat.toFixed(6)}, ${selectedServicePoint.servicePointInfo.lng.toFixed(6)}`
                  : '無資料'
              }}
            </div>
          </div>
        </div>

        <div class="mt-3 pt-2 border-top">
          <button class="btn btn-sm my-btn-outline-primary w-100" @click="clearServicePointDetail">
            <i class="fas fa-times me-2"></i>
            清除資訊
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
