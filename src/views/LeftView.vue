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
     * 🔧 組件設定函數 (Component Setup)
     * 使用 Composition API 設定組件邏輯
     */
    setup() {
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

      // 📤 返回響應式數據給模板使用
      return {
        selectedServiceDate,
        handleDateSelected,
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
        <label class="my-title-xs-gray mb-1 d-block">服務日期篩選</label>
        <DatePicker
          v-model="selectedServiceDate"
          placeholder="選擇服務日期 (7碼格式)"
          @date-selected="handleDateSelected"
        />
      </div>
      <div v-if="isDateFilterActive" class="my-content-xs-gray">
        已選擇: {{ selectedServiceDate }}
        <button
          class="btn btn-sm btn-outline-danger ms-2"
          @click="handleDateSelected('')"
          title="清除日期篩選"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- 📋 圖層列表分頁內容 -->
    <div class="flex-grow-1 overflow-hidden">
      <LayersTab />
    </div>
  </div>
</template>

<style scoped></style>
