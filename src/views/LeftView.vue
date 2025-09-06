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
  import { ref } from 'vue';
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
      // 📑 分頁狀態管理 (Tab State Management)
      /** 🗂️ 左側分頁狀態 (預設為日期圖層分頁) */
      const activeLeftTab = ref('date');

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
      const switchLeftTab = (tabName) => {
        activeLeftTab.value = tabName;
        // 切換左側分頁時清空地圖顯示
        try {
          const { useDataStore } = require('../stores/dataStore.js');
          const store = useDataStore();
          store.hideAllLayersOnMap();
        } catch (e) {
          // no-op
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
      <h1 class="my-font-size-lg my-letter-spacing-lg text-center m-3">臺中市長照服務路線</h1>

      <!-- 🎛️ 分頁導航按鈕 (Tab Navigation Buttons) -->
      <div class="d-flex justify-content-center">
        <div class="d-flex align-items-center rounded-pill shadow my-blur gap-1 p-2">
          <!-- 日期圖層分頁按鈕 -->
          <button
            class="btn rounded-circle border-0 d-flex align-items-center justify-content-center my-btn-transparent my-font-size-xs"
            :class="{
              'my-btn-blue': activeLeftTab === 'date',
            }"
            @click="switchLeftTab('date')"
            style="width: 30px; height: 30px"
            title="日期圖層"
          >
            <i class="fas fa-calendar-day"></i>
          </button>

          <!-- 伺服器圖層分頁按鈕 -->
          <button
            class="btn rounded-circle border-0 d-flex align-items-center justify-content-center my-btn-transparent my-font-size-xs"
            :class="{
              'my-btn-blue': activeLeftTab === 'server',
            }"
            @click="switchLeftTab('server')"
            style="width: 30px; height: 30px"
            title="伺服器圖層"
          >
            <i class="fas fa-server"></i>
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
