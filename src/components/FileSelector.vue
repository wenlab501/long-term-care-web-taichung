<script>
  /**
   * FileSelector.vue
   *
   * Purpose:
   * - Provides a dropdown selection interface for data files
   * - Allows filtering data by source file
   * - Emits events when file selection changes
   *
   * Features:
   * - Auto-load file options on mount
   * - Display file names with user-friendly labels
   * - Reactive updates with data store
   */
  import { ref, onMounted, computed } from 'vue';
  import { useDataStore } from '@/stores/dataStore.js';

  export default {
    name: 'FileSelector',

    /**
     * 📡 組件事件定義 (Component Events)
     */
    emits: ['file-selected'],

    /**
     * 🔧 組件設定函數 (Component Setup)
     */
    setup(props, { emit }) {
      // 📦 取得 Pinia 數據存儲實例
      const dataStore = useDataStore();

      // 🔍 本地狀態
      const isLoading = ref(false);
      const error = ref(null);

      // 📊 計算屬性
      const selectedFile = computed({
        get: () => dataStore.selectedFileFilter,
        set: (value) => {
          dataStore.setFileFilter(value);
        },
      });

      // 📁 可用的檔案選項
      const availableFiles = ref([
        {
          value: 'all',
          label: '全部',
          description: '顯示所有資料來源',
        },
        {
          value: '新基準中央服務紀錄_all_2.json',
          label: '新基準中央服務紀錄',
          description: '中央服務紀錄資料',
        },
        {
          value: 'filtered_臺中洪幸雪-20250801-20250831 全部的服務記錄_final.json',
          label: '臺中洪幸雪',
          description: '臺中洪幸雪服務記錄',
        },
        {
          value: 'filtered_基隆聯祥-20250801-20250831 全部的服務記錄_final.json',
          label: '基隆聯祥',
          description: '基隆聯祥服務記錄',
        },
        {
          value: 'filtered_新北聯和-20250801-20250831 全部的服務記錄_final.json',
          label: '新北聯和',
          description: '新北聯和服務記錄',
        },
      ]);

      /**
       * 🎯 處理檔案選擇
       */
      const handleFileSelected = async (fileName) => {
        if (fileName) {
          dataStore.setFileFilter(fileName);
          emit('file-selected', fileName);
        }
      };

      /**
       * 🚀 組件掛載時初始化
       */
      onMounted(async () => {
        // 檔案選項已經在 computed 中定義，無需額外載入
        console.log('📁 FileSelector 組件掛載，檔案選項已準備就緒');
      });

      // 📤 返回給模板使用
      return {
        selectedFile,
        availableFiles,
        isLoading,
        error,
        handleFileSelected,
      };
    },
  };
</script>

<template>
  <div class="file-selector">
    <!-- 載入狀態 -->
    <div v-if="isLoading" class="text-center py-2">
      <div class="spinner-border spinner-border-sm" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
      <span class="ms-2 my-content-xs-gray">載入檔案選項...</span>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="alert alert-warning py-2" role="alert">
      <i class="fas fa-exclamation-triangle me-2"></i>
      {{ error }}
    </div>

    <!-- 選擇器 -->
    <div v-else>
      <select
        v-model="selectedFile"
        @change="handleFileSelected($event.target.value)"
        class="form-select form-select-sm px-3 py-2"
        :disabled="isLoading"
      >
        <option v-for="file in availableFiles" :key="file.value" :value="file.value">
          {{ file.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
  .file-selector .form-select {
    border-radius: 0.375rem;
    border: 1px solid var(--my-color-gray-300);
    background-color: var(--my-color-white);
    color: var(--my-color-black);
    font-size: 0.875rem;
  }

  .file-selector .form-select:focus {
    border-color: var(--my-color-blue);
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  .file-selector .form-select:disabled {
    background-color: var(--my-color-gray-100);
    opacity: 0.6;
  }

  .spinner-border-sm {
    width: 1rem;
    height: 1rem;
  }
</style>
