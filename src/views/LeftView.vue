<script>
  import { computed } from 'vue';
  import LayersTab from '../tabs/LayersTab.vue';
  import DatePicker from '../components/DatePicker.vue';
  import { useDataStore } from '@/stores/dataStore.js';

  export default {
    name: 'LeftView',

    /**
     * 🧩 組件註冊 (Component Registration)
     * 註冊左側面板內使用的子組件
     */
    components: {
      LayersTab, // 圖層列表分頁組件
      DatePicker, // 日期選擇器組件
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

      /**
       * 📅 處理日期選擇事件
       * @param {string} dateStr - 7碼日期字串 (例如: 1140701)
       */
      const handleDateSelected = async (dateStr) => {
        console.log('📅 LeftView 接收到的日期:', dateStr);
        console.log('📅 日期長度:', dateStr ? dateStr.length : 'null');
        console.log('📅 預期的民國年格式:', dateStr);

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
       * 📋 清除服務點詳細資訊
       */
      const clearServicePointDetail = () => {
        console.log('📋 LeftView: 清除服務點詳細資訊');
        emit('clear-service-point-detail');
      };

      // 📤 返回響應式數據給模板使用
      return {
        selectedServiceDate,
        handleDateSelected,
        clearServicePointDetail,
        isDateFilterActive: computed(() => dataStore.isDateFilterActive),
      };
    },
  };
</script>

<template>
  <div class="my-bgcolor-gray-100 h-100 d-flex flex-column overflow-hidden">
    <!-- 📰 頁面標題區域 -->
    <div class="p-3">
      <h1 class="my-font-size-lg my-letter-spacing-lg text-center m-3">臺中市長照資訊</h1>
    </div>

    <!-- 📅 服務日期選擇區域 -->
    <div class="px-3 pb-3">
      <div class="mb-2">
        <label class="my-title-xs-gray mb-1 d-block">選擇服務日期</label>
        <DatePicker
          v-model="selectedServiceDate"
          placeholder="選擇服務日期"
          @date-selected="handleDateSelected"
        />
      </div>
    </div>

    <!-- 📋 圖層列表分頁內容 -->
    <div class="flex-grow-1 overflow-hidden">
      <LayersTab />

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
