<template>
  <!-- 📊 統計分析視圖組件 -->
  <div class="d-flex flex-column my-bgcolor-gray-200 h-100">
    <!-- 📑 統計分頁導航 -->
    <div class="">
      <ul class="nav nav-tabs nav-fill">
        <li class="nav-item d-flex flex-column align-items-center">
          <!-- 服務日期統計按鈕 -->
          <div
            class="btn nav-link rounded-0 border-0 position-relative d-flex align-items-center justify-content-center my-bgcolor-gray-200"
            :class="{
              active: activeStatisticsTab === 'service-date',
            }"
            @click="setActiveStatisticsTab('service-date')"
          >
            <span class="my-title-sm-black">服務日期統計</span>
          </div>
          <div
            class="w-100"
            :class="
              activeStatisticsTab === 'service-date' ? 'my-bgcolor-blue' : 'my-bgcolor-gray-300'
            "
            style="min-height: 4px"
          ></div>
        </li>
        <li class="nav-item d-flex flex-column align-items-center">
          <!-- 服務人員統計按鈕 -->
          <div
            class="btn nav-link rounded-0 border-0 position-relative d-flex align-items-center justify-content-center my-bgcolor-gray-200"
            :class="{
              active: activeStatisticsTab === 'service-provider',
            }"
            @click="setActiveStatisticsTab('service-provider')"
          >
            <span class="my-title-sm-black">服務人員統計</span>
          </div>
          <div
            class="w-100"
            :class="
              activeStatisticsTab === 'service-provider' ? 'my-bgcolor-blue' : 'my-bgcolor-gray-300'
            "
            style="min-height: 4px"
          ></div>
        </li>
      </ul>
    </div>

    <!-- 統計內容 -->
    <div class="flex-grow-1 overflow-auto my-bgcolor-white p-3">
      <!-- 📊 服務日期統計 -->
      <div v-if="activeStatisticsTab === 'service-date'">
        <div class="mb-4">
          <h5 class="my-title-md-black">
            <i class="fas fa-calendar-alt me-2 text-primary"></i>
            服務日期統計
          </h5>
          <div class="my-content-sm-gray">選擇的日期：{{ selectedServiceDate || '未選擇' }}</div>
        </div>

        <!-- 服務人員列表 -->
        <div v-if="serviceDateStatistics.length > 0">
          <div class="mb-3">
            <h6 class="my-title-sm-black">服務人員列表（有開啟圖層的交通時間）</h6>
          </div>
          <div class="row">
            <div
              v-for="provider in serviceDateStatistics"
              :key="provider.serviceProviderId"
              class="col-12 mb-3"
            >
              <div class="rounded-4 my-bgcolor-gray-100 p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="my-title-sm-black mb-0">{{ provider.serviceProviderId }}</h6>
                  <span class="badge bg-primary"
                    >{{ provider.trafficTimes.length }} 個交通時間</span
                  >
                </div>
                <div v-if="provider.trafficTimes.length > 0">
                  <div class="row">
                    <div
                      v-for="(trafficTime, index) in provider.trafficTimes"
                      :key="index"
                      class="col-6 col-md-4 mb-2"
                    >
                      <div class="rounded-3 my-bgcolor-white p-2 text-center">
                        <div class="my-content-sm-black">{{ trafficTime.time }}</div>
                        <div class="my-content-xs-gray">{{ trafficTime.description }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-2">
                  <div class="my-content-sm-gray">無交通時間資料</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-5">
          <div class="my-content-sm-gray">請先選擇服務日期並開啟相關圖層</div>
        </div>
      </div>

      <!-- 📊 服務人員統計 -->
      <div v-if="activeStatisticsTab === 'service-provider'">
        <div class="mb-4">
          <h5 class="my-title-md-black">
            <i class="fas fa-user-md me-2 text-primary"></i>
            服務人員統計
          </h5>
          <div class="my-content-sm-gray">
            選擇的服務人員：{{ selectedServiceProvider || '未選擇' }}
          </div>
        </div>

        <!-- 服務日期列表 -->
        <div v-if="serviceProviderStatistics.length > 0">
          <div class="mb-3">
            <h6 class="my-title-sm-black">服務日期列表（有開啟圖層的交通時間）</h6>
          </div>
          <div class="row">
            <div
              v-for="date in serviceProviderStatistics"
              :key="date.serviceDate"
              class="col-12 mb-3"
            >
              <div class="rounded-4 my-bgcolor-gray-100 p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="my-title-sm-black mb-0">{{ date.serviceDate }}</h6>
                  <span class="badge bg-primary">{{ date.trafficTimes.length }} 個交通時間</span>
                </div>
                <div v-if="date.trafficTimes.length > 0">
                  <div class="row">
                    <div
                      v-for="(trafficTime, index) in date.trafficTimes"
                      :key="index"
                      class="col-6 col-md-4 mb-2"
                    >
                      <div class="rounded-3 my-bgcolor-white p-2 text-center">
                        <div class="my-content-sm-black">{{ trafficTime.time }}</div>
                        <div class="my-content-xs-gray">{{ trafficTime.description }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-2">
                  <div class="my-content-sm-gray">無交通時間資料</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-5">
          <div class="my-content-sm-gray">請先選擇服務人員並開啟相關圖層</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch } from 'vue';
  import { useDataStore } from '@/stores/dataStore.js';

  const dataStore = useDataStore();
  const activeStatisticsTab = ref('service-date'); /** 📑 當前作用中的統計分頁 */

  /**
   * 📑 設定作用中統計分頁 (Set Active Statistics Tab)
   * @param {string} tabType - 分頁類型 ('service-date' 或 'service-provider')
   */
  const setActiveStatisticsTab = (tabType) => {
    activeStatisticsTab.value = tabType;
  };

  // 獲取當前選擇的服務日期和服務人員
  const selectedServiceDate = computed(() => dataStore.selectedServiceDate);
  const selectedServiceProvider = computed(() => dataStore.selectedServiceProvider);

  /**
   * 📊 從圖層數據中提取交通時間信息
   * @param {Object} layer - 圖層對象
   * @returns {Array} 交通時間列表
   */
  const extractTrafficTimesFromLayer = (layer) => {
    const trafficTimes = [];

    if (!layer.geoJsonData || !layer.geoJsonData.features) {
      return trafficTimes;
    }

    layer.geoJsonData.features.forEach((feature) => {
      if (feature.properties) {
        // 檢查是否有交通時間相關的屬性
        const hourTraffic = feature.properties.hour_traffic;
        const minTraffic = feature.properties.min_traffic;

        if (hourTraffic !== undefined && minTraffic !== undefined) {
          const totalMinutes = hourTraffic * 60 + minTraffic;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;

          const timeString = hours > 0 ? `${hours}小時${minutes}分鐘` : `${minutes}分鐘`;

          trafficTimes.push({
            time: timeString,
            description: feature.properties.姓名 || feature.properties.name || '服務點',
            totalMinutes: totalMinutes,
            hourTraffic: hourTraffic,
            minTraffic: minTraffic,
          });
        }
      }
    });

    return trafficTimes;
  };

  /**
   * 📊 服務日期統計：獲取選擇日期的服務人員列表中的交通時間
   */
  const serviceDateStatistics = computed(() => {
    if (!selectedServiceDate.value) {
      return [];
    }

    // 獲取服務人員列表群組中可見的圖層
    const serviceProviderGroup = dataStore.layers.find(
      (group) => group.groupName === '服務人員列表'
    );
    if (!serviceProviderGroup) {
      return [];
    }

    const visibleLayers = serviceProviderGroup.groupLayers.filter((layer) => layer.visible);

    return visibleLayers
      .map((layer) => {
        const trafficTimes = extractTrafficTimesFromLayer(layer);
        return {
          serviceProviderId: layer.serviceProviderId || layer.layerName,
          trafficTimes: trafficTimes,
        };
      })
      .filter((provider) => provider.trafficTimes.length > 0);
  });

  /**
   * 📊 服務人員統計：獲取選擇服務人員的服務日期列表中的交通時間
   */
  const serviceProviderStatistics = computed(() => {
    if (!selectedServiceProvider.value) {
      return [];
    }

    // 獲取服務日期列表群組中可見的圖層
    const serviceDateGroup = dataStore.layers.find((group) => group.groupName === '服務日期列表');
    if (!serviceDateGroup) {
      return [];
    }

    const visibleLayers = serviceDateGroup.groupLayers.filter((layer) => layer.visible);

    return visibleLayers
      .map((layer) => {
        const trafficTimes = extractTrafficTimesFromLayer(layer);
        return {
          serviceDate: layer.serviceDate || layer.layerName,
          trafficTimes: trafficTimes,
        };
      })
      .filter((date) => date.trafficTimes.length > 0);
  });

  // 監聽圖層可見性變化，觸發重新計算
  watch(
    () => dataStore.layers,
    () => {
      // 當圖層狀態變化時，computed 會自動重新計算
      // 圖層狀態變化，統計數據會自動更新
    },
    { deep: true }
  );
</script>

<style scoped></style>
