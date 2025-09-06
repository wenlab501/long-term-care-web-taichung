<script>
  /**
   * ServiceProviderPicker.vue
   *
   * Purpose:
   * - Provides a dropdown selection interface for service providers
   * - Loads and displays available service providers with statistics
   * - Emits events when service provider is selected
   *
   * Features:
   * - Auto-load service provider list on mount
   * - Display provider ID and service date count
   * - Reactive updates with data store
   */
  import { ref, onMounted, computed } from 'vue';
  import { useDataStore } from '@/stores/dataStore.js';

  export default {
    name: 'ServiceProviderPicker',

    /**
     * 📡 組件事件定義 (Component Events)
     */
    emits: ['provider-selected'],

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
      const selectedProvider = computed({
        get: () => dataStore.selectedServiceProvider,
        set: (value) => {
          dataStore.setServiceProviderFilter(value);
        },
      });

      const availableProviders = computed(() => dataStore.availableServiceProviders);

      /**
       * 🚀 載入服務人員清單
       */
      const loadProviders = async () => {
        try {
          isLoading.value = true;
          error.value = null;
          await dataStore.loadAvailableServiceProviders();
        } catch (err) {
          error.value = '載入服務人員清單失敗';
          console.error('ServiceProviderPicker: 載入服務人員清單失敗', err);
        } finally {
          isLoading.value = false;
        }
      };

      /**
       * 🎯 處理服務人員選擇
       */
      const handleProviderSelected = async (providerId) => {
        if (providerId) {
          dataStore.setServiceProviderFilter(providerId);
          emit('provider-selected', providerId);
        }
      };

      /**
       * 🚀 組件掛載時載入服務人員清單
       */
      onMounted(async () => {
        await loadProviders();
      });

      // 📤 返回給模板使用
      return {
        selectedProvider,
        availableProviders,
        isLoading,
        error,
        handleProviderSelected,
        loadProviders,
      };
    },
  };
</script>

<template>
  <div class="service-provider-picker">
    <!-- 載入狀態 -->
    <div v-if="isLoading" class="text-center py-2">
      <div class="spinner-border spinner-border-sm" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
      <span class="ms-2 my-content-xs-gray">載入服務人員清單...</span>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="alert alert-warning py-2" role="alert">
      <i class="fas fa-exclamation-triangle me-2"></i>
      {{ error }}
      <button class="btn btn-sm btn-outline-warning ms-2" @click="loadProviders">
        <i class="fas fa-redo"></i> 重試
      </button>
    </div>

    <!-- 選擇器 -->
    <div v-else>
      <select
        v-model="selectedProvider"
        @change="handleProviderSelected($event.target.value)"
        class="form-select form-select-sm px-3 py-2"
        :disabled="isLoading"
      >
        <option v-for="provider in availableProviders" :key="provider.id" :value="provider.id">
          {{ provider.name }} ({{ provider.dateCount }})
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
  .service-provider-picker .form-select {
    border-radius: 0.375rem;
    border: 1px solid var(--my-color-gray-300);
    background-color: var(--my-color-white);
    color: var(--my-color-black);
    font-size: 0.875rem;
  }

  .service-provider-picker .form-select:focus {
    border-color: var(--my-color-blue);
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  .service-provider-picker .form-select:disabled {
    background-color: var(--my-color-gray-100);
    opacity: 0.6;
  }

  .spinner-border-sm {
    width: 1rem;
    height: 1rem;
  }
</style>
