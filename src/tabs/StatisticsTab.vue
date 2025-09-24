<template>
  <!-- 📊 統計分析視圖組件 -->
  <div class="d-flex flex-column my-bgcolor-gray-200 h-100">
    <!-- 統計內容 -->
    <div class="flex-grow-1 overflow-auto my-bgcolor-white p-3">
      <!-- 📊 服務日期統計：當選擇了服務日期時顯示 -->
      <div v-if="isServiceDateMode">
        <div class="mb-4">
          <h5 class="my-title-md-black">
            <i class="fas fa-calendar-alt me-2 text-primary"></i>
            服務日期統計
          </h5>
          <div class="my-content-sm-gray">選擇的日期：{{ selectedServiceDate || '未選擇' }}</div>
        </div>

        <!-- 服務人員列表表格 -->
        <div v-if="serviceDateStatistics.length > 0">
          <div class="mb-3">
            <h6 class="my-title-sm-black">服務人員列表交通時間統計</h6>
          </div>
          <div
            v-for="provider in serviceDateStatistics"
            :key="provider.serviceProviderId"
            class="mb-4"
          >
            <div class="mb-2">
              <h6 class="my-title-sm-black">{{ provider.serviceProviderId }}</h6>
            </div>
            <div class="table-responsive">
              <table class="table table-hover table-sm">
                <thead class="table-light">
                  <tr>
                    <th class="my-title-sm-black">序號</th>
                    <th class="my-title-sm-black">交通時間</th>
                    <th class="my-title-sm-black">路線說明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(trafficTime, index) in provider.trafficTimes" :key="index">
                    <td class="my-content-sm-black">{{ index + 1 }}</td>
                    <td class="my-content-sm-black">{{ trafficTime.time }}</td>
                    <td class="my-content-sm-black">{{ trafficTime.routeDescription }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div v-else class="text-center">
          <div class="my-title-md-gray p-3">請先選擇服務日期並開啟相關圖層</div>
        </div>
      </div>

      <!-- 📊 服務人員統計：當選擇了服務人員時顯示 -->
      <div v-else-if="isServiceProviderMode">
        <div class="mb-4">
          <h5 class="my-title-md-black">
            <i class="fas fa-user-md me-2 text-primary"></i>
            服務人員統計
          </h5>
          <div class="my-content-sm-gray">
            選擇的服務人員：{{ selectedServiceProvider || '未選擇' }}
          </div>
        </div>

        <!-- 服務日期列表表格 -->
        <div v-if="serviceProviderStatistics.length > 0">
          <div class="mb-3">
            <h6 class="my-title-sm-black">服務日期列表交通時間統計</h6>
          </div>
          <div v-for="date in serviceProviderStatistics" :key="date.serviceDate" class="mb-4">
            <div class="mb-2">
              <h6 class="my-title-sm-black">{{ date.serviceDate }}</h6>
            </div>
            <div class="table-responsive">
              <table class="table table-hover table-sm">
                <thead class="table-light">
                  <tr>
                    <th class="my-title-sm-black">序號</th>
                    <th class="my-title-sm-black">交通時間</th>
                    <th class="my-title-sm-black">路線說明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(trafficTime, index) in date.trafficTimes" :key="index">
                    <td class="my-content-sm-black">{{ index + 1 }}</td>
                    <td class="my-content-sm-black">{{ trafficTime.time }}</td>
                    <td class="my-content-sm-black">{{ trafficTime.routeDescription }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-5">
          <div class="my-content-sm-gray">請先選擇服務人員並開啟相關圖層</div>
        </div>
      </div>

      <!-- 📊 未選擇任何模式時顯示 -->
      <div v-else class="text-center py-5">
        <div class="my-content-sm-gray">
          <i class="fas fa-info-circle me-2"></i>
          請先選擇服務日期或服務人員
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, watch } from 'vue';
  import { useDataStore } from '@/stores/dataStore.js';

  const dataStore = useDataStore();

  // 獲取當前選擇的服務日期和服務人員
  const selectedServiceDate = computed(() => dataStore.selectedServiceDate);
  const selectedServiceProvider = computed(() => dataStore.selectedServiceProvider);

  // 判斷當前模式：根據左側面板的分頁狀態
  const isServiceDateMode = computed(() => {
    return dataStore.activeLeftTab === 'date' && selectedServiceDate.value;
  });

  const isServiceProviderMode = computed(() => {
    return dataStore.activeLeftTab === 'server' && selectedServiceProvider.value;
  });

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

    // 按 routeOrder 排序，確保順序正確
    const sortedFeatures = layer.geoJsonData.features
      .filter((feature) => feature.properties && feature.properties.routeOrder !== undefined)
      .sort((a, b) => a.properties.routeOrder - b.properties.routeOrder);

    sortedFeatures.forEach((feature, index) => {
      if (feature.properties) {
        // 檢查是否有交通時間相關的屬性
        const hourTraffic = feature.properties.hour_traffic;
        const minTraffic = feature.properties.min_traffic;

        if (hourTraffic !== undefined && minTraffic !== undefined) {
          const totalMinutes = hourTraffic * 60 + minTraffic;
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;

          const timeString = hours > 0 ? `${hours}小時${minutes}分鐘` : `${minutes}分鐘`;

          // 生成路線說明
          let routeDescription = '-';
          if (index === 0) {
            // 第一個點：起點
            routeDescription = `起點 → ${feature.properties.姓名 || feature.properties.name || '服務點'}`;
          } else if (index === sortedFeatures.length - 1) {
            // 最後一個點：終點
            const prevFeature = sortedFeatures[index - 1];
            routeDescription = `${prevFeature.properties.姓名 || prevFeature.properties.name || '服務點'} → 終點`;
          } else {
            // 中間點：前一個點到當前點
            const prevFeature = sortedFeatures[index - 1];
            routeDescription = `${prevFeature.properties.姓名 || prevFeature.properties.name || '服務點'} → ${feature.properties.姓名 || feature.properties.name || '服務點'}`;
          }

          trafficTimes.push({
            time: timeString,
            description: feature.properties.姓名 || feature.properties.name || '服務點',
            routeDescription: routeDescription,
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
        if (trafficTimes.length === 0) return null;

        return {
          serviceProviderId: layer.serviceProviderId || layer.layerName,
          trafficTimes: trafficTimes,
        };
      })
      .filter((provider) => provider !== null);
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
        if (trafficTimes.length === 0) return null;

        return {
          serviceDate: layer.serviceDate || layer.layerName,
          trafficTimes: trafficTimes,
        };
      })
      .filter((date) => date !== null);
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
