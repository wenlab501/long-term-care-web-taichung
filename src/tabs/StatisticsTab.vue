<template>
  <!-- 📊 統計分析視圖組件 -->
  <div class="d-flex flex-column my-bgcolor-gray-200 h-100">
    <!-- 統計內容 -->
    <div class="flex-grow-1 overflow-auto my-bgcolor-white p-3">
      <!-- 📊 服務日期統計：當選擇了服務日期時顯示 -->
      <div v-if="isServiceDateMode">
        <div class="mb-4">
          <div class="my-title-lg-black">服務日期統計 - {{ selectedServiceDate || '未選擇' }}</div>
        </div>

        <!-- 📊 統計圖表區塊 -->
        <div v-if="serviceDateStatistics.length > 0" class="mb-3">
          <div class="row">
            <!-- 總時間分布圖表 -->
            <div class="col-12 col-md-6 mb-3">
              <div class="rounded-4 my-bgcolor-gray-100 pt-3 h-100">
                <h6 class="my-title-sm-black text-center mb-3">總時間分布統計</h6>
                <div
                  ref="totalTimeChartContainer"
                  class="d-flex justify-content-center"
                  style="min-height: 200px"
                >
                  <div v-if="totalTimeDistribution.length === 0" class="text-center text-muted">
                    暫無數據
                  </div>
                </div>
              </div>
            </div>

            <!-- 交通時間分布圖表 -->
            <div class="col-12 col-md-6 mb-3">
              <div class="rounded-4 my-bgcolor-gray-100 pt-3 h-100">
                <h6 class="my-title-sm-black text-center mb-3">交通時間分布統計</h6>
                <div
                  ref="trafficTimeChartContainer"
                  class="d-flex justify-content-center"
                  style="min-height: 200px"
                >
                  <div v-if="trafficTimeDistribution.length === 0" class="text-center text-muted">
                    暫無數據
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 服務人員列表表格 -->
        <div
          v-if="serviceDateStatistics.length > 0"
          class="rounded-4 my-bgcolor-gray-100 p-4 h-100"
        >
          <div class="my-title-sm-black text-center mb-3">服務人員列表交通時間統計</div>
          <div
            v-for="provider in serviceDateStatistics"
            :key="provider.serviceProviderId"
            class="mb-4"
          >
            <div class="my-title-xs-gray text-center mb-2">{{ provider.serviceProviderId }}</div>
            <div class="table-responsive">
              <table class="table w-100 mb-0">
                <thead class="sticky-top my-table-thead">
                  <tr class="text-center text-nowrap">
                    <th class="p-1">
                      <span class="my-title-xs-gray text-nowrap">#</span>
                    </th>
                    <th class="p-1">
                      <span class="my-title-xs-gray text-nowrap">路線說明</span>
                    </th>
                    <th class="p-1">
                      <span class="my-title-xs-gray text-nowrap">總時間</span>
                    </th>
                    <th class="p-1">
                      <span class="my-title-xs-gray text-nowrap">交通時間</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(trafficTime, index) in provider.trafficTimes"
                    :key="index"
                    class="text-center text-nowrap border-bottom"
                  >
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 80px">
                      <div class="my-content-xs-black px-3 py-2">{{ index + 1 }}</div>
                    </td>
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 120px">
                      <div class="my-content-xs-black px-3 py-2">
                        {{ trafficTime.routeDescription }}
                      </div>
                    </td>
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 80px">
                      <div class="my-content-xs-black px-3 py-2">{{ trafficTime.totalTime }}</div>
                    </td>
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 80px">
                      <div class="my-content-xs-black px-3 py-2">{{ trafficTime.time }}</div>
                    </td>
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
          <div class="my-title-lg-black">
            服務人員統計 - {{ selectedServiceProvider || '未選擇' }}
          </div>
        </div>

        <!-- 📊 統計圖表區塊 -->
        <div v-if="serviceProviderStatistics.length > 0" class="mb-4">
          <div class="row">
            <!-- 總時間分布圖表 -->
            <div class="col-12 col-md-6 mb-3">
              <div class="rounded-4 my-bgcolor-gray-100 p-3 h-100">
                <h6 class="my-title-sm-black text-center mb-3">總時間分布統計</h6>
                <div
                  ref="totalTimeChartContainer"
                  class="d-flex justify-content-center"
                  style="min-height: 200px"
                >
                  <div v-if="totalTimeDistribution.length === 0" class="text-center text-muted">
                    暫無數據
                  </div>
                </div>
              </div>
            </div>
            <!-- 交通時間分布圖表 -->
            <div class="col-12 col-md-6 mb-3">
              <div class="rounded-4 my-bgcolor-gray-100 p-3 h-100">
                <h6 class="my-title-sm-black text-center mb-3">交通時間分布統計</h6>
                <div
                  ref="trafficTimeChartContainer"
                  class="d-flex justify-content-center"
                  style="min-height: 200px"
                >
                  <div v-if="trafficTimeDistribution.length === 0" class="text-center text-muted">
                    暫無數據
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 服務日期列表表格 -->
        <div
          v-if="serviceProviderStatistics.length > 0"
          class="rounded-4 my-bgcolor-gray-100 p-4 h-100"
        >
          <div class="my-title-sm-black text-center mb-3">服務日期列表交通時間統計</div>
          <div v-for="date in serviceProviderStatistics" :key="date.serviceDate" class="mb-4">
            <div class="my-title-xs-gray text-center mb-2">{{ date.serviceDate }}</div>
            <div class="table-responsive">
              <table class="table w-100 mb-0">
                <thead class="sticky-top my-table-thead">
                  <tr class="text-center text-nowrap">
                    <th class="p-1">
                      <span class="my-title-xs-gray text-nowrap">#</span>
                    </th>
                    <th class="p-1">
                      <span class="my-title-xs-gray text-nowrap">路線說明</span>
                    </th>
                    <th class="p-1">
                      <span class="my-title-xs-gray text-nowrap">總時間</span>
                    </th>
                    <th class="p-1">
                      <span class="my-title-xs-gray text-nowrap">交通時間</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(trafficTime, index) in date.trafficTimes"
                    :key="index"
                    class="text-center text-nowrap border-bottom"
                  >
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 80px">
                      <div class="my-content-xs-black px-3 py-2">{{ index + 1 }}</div>
                    </td>
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 120px">
                      <div class="my-content-xs-black px-3 py-2">
                        {{ trafficTime.routeDescription }}
                      </div>
                    </td>
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 80px">
                      <div class="my-content-xs-black px-3 py-2">{{ trafficTime.totalTime }}</div>
                    </td>
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 80px">
                      <div class="my-content-xs-black px-3 py-2">{{ trafficTime.time }}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-5">
          <div class="my-title-md-gray">沒有開啟的圖層</div>
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
  import { computed, watch, ref, onMounted, onUnmounted, nextTick } from 'vue';
  import { useDataStore } from '@/stores/dataStore.js';
  import * as d3 from 'd3';

  // 定義 props
  const props = defineProps({
    activeUpperTab: {
      type: String,
      default: 'map',
    },
    containerHeight: {
      type: Number,
      default: 500,
    },
    isPanelDragging: {
      type: Boolean,
      default: false,
    },
    activeMarkers: {
      type: Number,
      default: 0,
    },
  });

  const dataStore = useDataStore();
  const trafficTimeChartContainer = ref(null);
  const totalTimeChartContainer = ref(null);

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
   * 📊 計算總時間分布統計
   */
  const totalTimeDistribution = computed(() => {
    let allTotalTimes = [];

    if (isServiceDateMode.value) {
      // 服務日期模式：收集所有服務人員的總時間
      const serviceProviderGroup = dataStore.layers.find(
        (group) => group.groupName === '服務人員列表'
      );
      if (serviceProviderGroup) {
        const visibleLayers = serviceProviderGroup.groupLayers.filter((layer) => layer.visible);
        visibleLayers.forEach((layer) => {
          const totalTimes = extractServiceTotalTimesFromLayer(layer);
          allTotalTimes.push(...totalTimes);
        });
      }
    } else if (isServiceProviderMode.value) {
      // 服務人員模式：收集所有服務日期的總時間
      const serviceDateGroup = dataStore.layers.find((group) => group.groupName === '服務日期列表');
      if (serviceDateGroup) {
        const visibleLayers = serviceDateGroup.groupLayers.filter((layer) => layer.visible);
        visibleLayers.forEach((layer) => {
          const totalTimes = extractServiceTotalTimesFromLayer(layer);
          allTotalTimes.push(...totalTimes);
        });
      }
    }

    // 按30分鐘區間分組，超過5小時的合併為1個bar，最小刻度是5
    const distribution = {};

    // 初始化所有可能的區間（0-29, 30-59, ..., 270-299, >300）
    for (let i = 0; i <= 270; i += 30) {
      const intervalKey = `${i}-${i + 29}`;
      distribution[intervalKey] = 0;
    }
    distribution['>300'] = 0;

    // 統計實際數據（過濾掉小於0或NaN的值）
    allTotalTimes.forEach((totalMinutes) => {
      // 確保是有效的正數值
      if (totalMinutes > 0 && !isNaN(totalMinutes)) {
        if (totalMinutes > 300) {
          distribution['>300'] += 1;
        } else {
          const interval = Math.floor(totalMinutes / 30) * 30;
          const intervalKey = `${interval}-${interval + 29}`;
          distribution[intervalKey] += 1;
        }
      }
    });

    // 轉換為數組格式供D3使用
    return Object.entries(distribution)
      .map(([interval, count]) => ({
        interval,
        count,
      }))
      .sort((a, b) => {
        // 處理">"的區間，將其排在最後
        if (a.interval.includes('>')) return 1;
        if (b.interval.includes('>')) return -1;

        const aStart = parseInt(a.interval.split('-')[0]);
        const bStart = parseInt(b.interval.split('-')[0]);
        return aStart - bStart;
      });
  });

  /**
   * 📊 計算交通時間分布統計
   */
  const trafficTimeDistribution = computed(() => {
    let allTrafficTimes = [];

    // console.log('🔍 trafficTimeDistribution computed:', {
    //   isServiceDateMode: isServiceDateMode.value,
    //   isServiceProviderMode: isServiceProviderMode.value,
    //   selectedServiceDate: selectedServiceDate.value,
    //   selectedServiceProvider: selectedServiceProvider.value,
    //   activeLeftTab: dataStore.activeLeftTab
    // });

    if (isServiceDateMode.value) {
      // 服務日期模式：收集所有服務人員的交通時間
      const serviceProviderGroup = dataStore.layers.find(
        (group) => group.groupName === '服務人員列表'
      );
      console.log('🔍 serviceProviderGroup:', serviceProviderGroup);
      if (serviceProviderGroup) {
        const visibleLayers = serviceProviderGroup.groupLayers.filter((layer) => layer.visible);
        console.log('🔍 visible service provider layers:', visibleLayers.length);
        visibleLayers.forEach((layer) => {
          const trafficTimes = extractTrafficTimesFromLayer(layer);
          console.log('🔍 extracted traffic times:', trafficTimes.length);
          allTrafficTimes.push(...trafficTimes);
        });
      }
    } else if (isServiceProviderMode.value) {
      // 服務人員模式：收集所有服務日期的交通時間
      const serviceDateGroup = dataStore.layers.find((group) => group.groupName === '服務日期列表');
      console.log('🔍 serviceDateGroup:', serviceDateGroup);
      if (serviceDateGroup) {
        const visibleLayers = serviceDateGroup.groupLayers.filter((layer) => layer.visible);
        console.log('🔍 visible service date layers:', visibleLayers.length);
        visibleLayers.forEach((layer) => {
          const trafficTimes = extractTrafficTimesFromLayer(layer);
          console.log('🔍 extracted traffic times:', trafficTimes.length);
          allTrafficTimes.push(...trafficTimes);
        });
      }
    }

    console.log('🔍 allTrafficTimes collected:', allTrafficTimes.length);

    // 過濾掉序號1的交通時間（略過序號1）
    const filteredTrafficTimes = allTrafficTimes.filter((traffic) => {
      // 略過序號1，其他都要計算
      return traffic.sequenceNumber !== 1;
    });

    // 按10分鐘區間分組，超過2小時的合併為1個bar，最小刻度是5
    const distribution = {};

    // 初始化所有可能的區間（0-9, 10-19, ..., 110-119, >120）
    for (let i = 0; i <= 110; i += 10) {
      const intervalKey = `${i}-${i + 9}`;
      distribution[intervalKey] = 0;
    }
    distribution['>120'] = 0;

    // 統計實際數據（過濾掉小於0或NaN的值）
    filteredTrafficTimes.forEach((traffic) => {
      // 確保是有效的正數值
      if (traffic.totalMinutes > 0 && !isNaN(traffic.totalMinutes)) {
        if (traffic.totalMinutes > 120) {
          distribution['>120'] += 1;
        } else {
          const interval = Math.floor(traffic.totalMinutes / 10) * 10;
          const intervalKey = `${interval}-${interval + 9}`;
          distribution[intervalKey] += 1;
        }
      }
    });

    // 轉換為數組格式供D3使用
    return Object.entries(distribution)
      .map(([interval, count]) => ({
        interval,
        count,
      }))
      .sort((a, b) => {
        // 處理">"的區間，將其排在最後
        if (a.interval.includes('>')) return 1;
        if (b.interval.includes('>')) return -1;

        const aStart = parseInt(a.interval.split('-')[0]);
        const bStart = parseInt(b.interval.split('-')[0]);
        return aStart - bStart;
      });
  });

  /**
   * 📊 從圖層數據中提取服務總時間信息（底部面板的總時間）
   * @param {Object} layer - 圖層對象
   * @returns {Array} 服務總時間列表（分鐘）
   */
  const extractServiceTotalTimesFromLayer = (layer) => {
    const totalTimes = [];

    if (!layer.tableData || !Array.isArray(layer.tableData)) {
      return totalTimes;
    }

    layer.tableData.forEach((item) => {
      // 計算服務時間的總時間（結束時間 - 起始時間）
      if (
        item.hour_start !== undefined &&
        item.min_start !== undefined &&
        item.hour_end !== undefined &&
        item.min_end !== undefined
      ) {
        const startMinutes = item.hour_start * 60 + item.min_start;
        const endMinutes = item.hour_end * 60 + item.min_end;
        const totalMinutes = endMinutes - startMinutes;

        // 只收集有效的正數值
        if (totalMinutes > 0 && !isNaN(totalMinutes)) {
          totalTimes.push(totalMinutes);
        }
      }
    });

    return totalTimes;
  };

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

    // 獲取對應的服務時間總時間數據
    const getServiceTotalTime = (serviceName) => {
      if (!layer.tableData || !Array.isArray(layer.tableData)) {
        return null;
      }

      const serviceItem = layer.tableData.find(
        (item) => item.姓名 === serviceName || item.name === serviceName
      );

      if (serviceItem) {
        // 計算服務時間的總時間（結束時間 - 起始時間）
        if (
          serviceItem.hour_start !== undefined &&
          serviceItem.min_start !== undefined &&
          serviceItem.hour_end !== undefined &&
          serviceItem.min_end !== undefined
        ) {
          const startMinutes = serviceItem.hour_start * 60 + serviceItem.min_start;
          const endMinutes = serviceItem.hour_end * 60 + serviceItem.min_end;
          const totalMinutes = endMinutes - startMinutes;

          if (totalMinutes > 0 && !isNaN(totalMinutes)) {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
          }
        }
      }
      return null;
    };

    // 按 routeOrder 排序，確保順序正確
    const sortedFeatures = layer.geoJsonData.features
      .filter((feature) => feature.properties && feature.properties.routeOrder !== undefined)
      .sort((a, b) => a.properties.routeOrder - b.properties.routeOrder);

    // 計算累積總時間
    let cumulativeTotalMinutes = 0;

    sortedFeatures.forEach((feature, index) => {
      if (feature.properties) {
        // 檢查是否有交通時間相關的屬性
        const hourTraffic = feature.properties.hour_traffic;
        const minTraffic = feature.properties.min_traffic;

        if (hourTraffic !== undefined && minTraffic !== undefined) {
          const totalMinutes = hourTraffic * 60 + minTraffic;
          cumulativeTotalMinutes += totalMinutes;

          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          const timeString = hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;

          // 獲取對應服務項目的服務時間總時間
          const serviceName = feature.properties.姓名 || feature.properties.name || '服務點';
          const serviceTotalTime = getServiceTotalTime(serviceName);
          const totalTimeString = serviceTotalTime || '-';

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
            totalTime: totalTimeString,
            description: feature.properties.姓名 || feature.properties.name || '服務點',
            routeDescription: routeDescription,
            totalMinutes: totalMinutes,
            cumulativeTotalMinutes: cumulativeTotalMinutes,
            hourTraffic: hourTraffic,
            minTraffic: minTraffic,
            sequenceNumber: index + 1, // 添加#
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

  /**
   * 📊 繪製交通時間分布長條圖
   */
  const drawTrafficTimeChart = () => {
    console.log('🔍 drawTrafficTimeChart called:', {
      container: !!trafficTimeChartContainer.value,
      dataLength: trafficTimeDistribution.value.length,
      data: trafficTimeDistribution.value,
    });

    if (!trafficTimeChartContainer.value || trafficTimeDistribution.value.length === 0) {
      console.log('❌ Cannot draw chart - missing container or data');
      return;
    }

    // 清除之前的圖表
    d3.select(trafficTimeChartContainer.value).selectAll('*').remove();

    const data = trafficTimeDistribution.value;
    const containerRect = trafficTimeChartContainer.value.getBoundingClientRect();
    const containerWidth = containerRect.width || 400; // 如果寬度為 0，使用默認值
    const containerHeight = 200;
    const margin = { top: 32, right: 0, bottom: 0, left: 32 };
    const width = containerWidth - margin.left - margin.right;
    const height = 160 - margin.top;

    console.log('🔍 Container dimensions:', { containerWidth, containerHeight, width, height });

    const svg = d3
      .select(trafficTimeChartContainer.value)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // 設定比例尺 - 使用固定寬度柱子
    const barWidth = 8;
    const dataCount = data.length;
    const totalBarWidth = dataCount * barWidth;
    const availableSpaceWidth = width - totalBarWidth;
    const spaceUnit = availableSpaceWidth / (dataCount * 2);

    const xScale = (interval) => {
      const index = data.findIndex((d) => d.interval === interval);
      if (index === -1) return 0;
      return spaceUnit + index * (barWidth + 2 * spaceUnit) + barWidth / 2;
    };

    const maxValue = d3.max(data, (d) => d.count) || 1;
    const roundedMaxValue = Math.ceil(maxValue / 5) * 5;
    const yScale = d3.scaleLinear().domain([0, roundedMaxValue]).range([height, 0]);

    // 計算Y軸刻度
    const yTicks = [0];
    let interval = 5;
    while (roundedMaxValue / interval > 4) {
      interval += 5;
    }
    for (let i = interval; i <= roundedMaxValue; i += interval) {
      yTicks.push(i);
      if (yTicks.length >= 5) break;
    }

    // 繪製水平虛線網格
    g.selectAll('.grid-line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#bdbdbd')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', (d) => (d === 0 ? 0.8 : 0.4));

    // 繪製長條
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.interval) - barWidth / 2)
      .attr('width', barWidth)
      .attr('y', (d) => (d.count > 0 ? yScale(d.count) : height))
      .attr('height', (d) => (d.count > 0 ? height - yScale(d.count) : 0))
      .attr('fill', 'var(--my-color-blue)');

    // 添加數值標籤
    g.selectAll('.bar-label')
      .data(data.filter((d) => d.count > 0))
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (d) => xScale(d.interval))
      .attr('y', (d) => yScale(d.count) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#333')
      .style('font-weight', 'bold')
      .text((d) => d3.format(',')(d.count));

    // 添加 X 軸標籤
    const xAxisGroup = g.append('g').attr('transform', `translate(0,${height})`);

    data.forEach((dataItem) => {
      const x = xScale(dataItem.interval);
      // 顯示整數結尾，例如 "0-9" 顯示為 "10", "10-19" 顯示為 "20"
      const text = dataItem.interval.includes('>')
        ? dataItem.interval
        : (parseInt(dataItem.interval.split('-')[1]) + 1).toString();

      const textGroup = xAxisGroup.append('g').attr('transform', `translate(${x}, 20)`);

      // 橫向顯示文字
      textGroup
        .append('text')
        .text(text)
        .attr('x', 0)
        .attr('y', 0)
        .style('font-size', '12px')
        .style('font-family', 'Arial, sans-serif')
        .style('fill', '#333')
        .style('text-anchor', 'middle');
    });

    // 添加 Y 軸
    g.append('g')
      .call(
        d3
          .axisLeft(yScale)
          .tickValues(yTicks)
          .tickSize(0)
          .tickFormat((d) => d3.format(',')(d))
      )
      .style('font-size', '11px')
      .select('.domain')
      .remove();

    g.selectAll('.tick text')
      .style('fill', '#666')
      .style('font-weight', 'normal')
      .style('text-anchor', 'end')
      .attr('transform', 'rotate(0)');

    // 在X軸左側添加"分鐘"標籤，與X軸刻度文字對齊
    g.append('text')
      .text('分鐘')
      .attr('x', -8)
      .attr('y', height + 15)
      .style('font-size', '12px')
      .style('font-family', 'Arial, sans-serif')
      .style('fill', '#333')
      .style('text-anchor', 'end');
  };

  /**
   * 📊 繪製總時間分布長條圖
   */
  const drawTotalTimeChart = () => {
    console.log('🔍 drawTotalTimeChart called:', {
      container: !!totalTimeChartContainer.value,
      dataLength: totalTimeDistribution.value.length,
      data: totalTimeDistribution.value,
    });

    if (!totalTimeChartContainer.value || totalTimeDistribution.value.length === 0) {
      console.log('❌ Cannot draw total time chart - missing container or data');
      return;
    }

    // 清除之前的圖表
    d3.select(totalTimeChartContainer.value).selectAll('*').remove();

    const data = totalTimeDistribution.value;
    const containerRect = totalTimeChartContainer.value.getBoundingClientRect();
    const containerWidth = containerRect.width || 400; // 如果寬度為 0，使用默認值
    const containerHeight = 200;
    const margin = { top: 32, right: 0, bottom: 0, left: 32 };
    const width = containerWidth - margin.left - margin.right;
    const height = 160 - margin.top;

    console.log('🔍 Total time container dimensions:', {
      containerWidth,
      containerHeight,
      width,
      height,
    });

    const svg = d3
      .select(totalTimeChartContainer.value)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // 設定比例尺 - 使用固定寬度柱子
    const barWidth = 8;
    const dataCount = data.length;
    const totalBarWidth = dataCount * barWidth;
    const availableSpaceWidth = width - totalBarWidth;
    const spaceUnit = availableSpaceWidth / (dataCount * 2);

    const xScale = (interval) => {
      const index = data.findIndex((d) => d.interval === interval);
      if (index === -1) return 0;
      return spaceUnit + index * (barWidth + 2 * spaceUnit) + barWidth / 2;
    };

    const maxValue = d3.max(data, (d) => d.count) || 1;
    const roundedMaxValue = Math.ceil(maxValue / 5) * 5;
    const yScale = d3.scaleLinear().domain([0, roundedMaxValue]).range([height, 0]);

    // 計算Y軸刻度
    const yTicks = [0];
    let interval = 5;
    while (roundedMaxValue / interval > 4) {
      interval += 5;
    }
    for (let i = interval; i <= roundedMaxValue; i += interval) {
      yTicks.push(i);
      if (yTicks.length >= 5) break;
    }

    // 繪製水平虛線網格
    g.selectAll('.grid-line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#bdbdbd')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', (d) => (d === 0 ? 0.8 : 0.4));

    // 繪製長條
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.interval) - barWidth / 2)
      .attr('width', barWidth)
      .attr('y', (d) => (d.count > 0 ? yScale(d.count) : height))
      .attr('height', (d) => (d.count > 0 ? height - yScale(d.count) : 0))
      .attr('fill', 'var(--my-color-green)');

    // 添加數值標籤
    g.selectAll('.bar-label')
      .data(data.filter((d) => d.count > 0))
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (d) => xScale(d.interval))
      .attr('y', (d) => yScale(d.count) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#333')
      .style('font-weight', 'bold')
      .text((d) => d3.format(',')(d.count));

    // 添加 X 軸標籤
    const xAxisGroup = g.append('g').attr('transform', `translate(0,${height})`);

    data.forEach((dataItem) => {
      const x = xScale(dataItem.interval);
      // 顯示整數結尾，例如 "0-9" 顯示為 "10", "10-19" 顯示為 "20"
      const text = dataItem.interval.includes('>')
        ? dataItem.interval
        : (parseInt(dataItem.interval.split('-')[1]) + 1).toString();

      const textGroup = xAxisGroup.append('g').attr('transform', `translate(${x}, 20)`);

      // 橫向顯示文字
      textGroup
        .append('text')
        .text(text)
        .attr('x', 0)
        .attr('y', 0)
        .style('font-size', '12px')
        .style('font-family', 'Arial, sans-serif')
        .style('fill', '#333')
        .style('text-anchor', 'middle');
    });

    // 添加 Y 軸
    g.append('g')
      .call(
        d3
          .axisLeft(yScale)
          .tickValues(yTicks)
          .tickSize(0)
          .tickFormat((d) => d3.format(',')(d))
      )
      .style('font-size', '11px')
      .select('.domain')
      .remove();

    g.selectAll('.tick text')
      .style('fill', '#666')
      .style('font-weight', 'normal')
      .style('text-anchor', 'end')
      .attr('transform', 'rotate(0)');

    // 在X軸左側添加"分鐘"標籤，與X軸刻度文字對齊
    g.append('text')
      .text('分鐘')
      .attr('x', -8)
      .attr('y', height + 15)
      .style('font-size', '12px')
      .style('font-family', 'Arial, sans-serif')
      .style('fill', '#333')
      .style('text-anchor', 'end');
  };

  // 監聽交通時間分布變化，重新繪製圖表
  watch(
    () => trafficTimeDistribution.value,
    () => {
      nextTick(() => {
        drawTrafficTimeChart();
      });
    },
    { deep: true, immediate: true }
  );

  // 監聽總時間分布變化，重新繪製圖表
  watch(
    () => totalTimeDistribution.value,
    () => {
      nextTick(() => {
        drawTotalTimeChart();
      });
    },
    { deep: true, immediate: true }
  );

  // 監聽圖層可見性變化，觸發重新計算
  watch(
    () => dataStore.layers,
    () => {
      // 當圖層狀態變化時，computed 會自動重新計算
      // 圖層狀態變化，統計數據會自動更新
    },
    { deep: true }
  );

  // 監聽 activeUpperTab 變化，當切換到 StatisticsTab 時立即繪製圖表
  watch(
    () => props.activeUpperTab,
    (newTab, oldTab) => {
      console.log('🔍 activeUpperTab changed:', { newTab, oldTab });
      if (newTab === 'statistics' && oldTab !== 'statistics') {
        console.log('✅ Switching to statistics tab, drawing charts');
        nextTick(() => {
          // 延遲一點時間確保 DOM 完全渲染
          setTimeout(() => {
            drawTrafficTimeChart();
            drawTotalTimeChart();
          }, 100);
        });
      }
    },
    { immediate: false }
  );

  // 防抖計時器
  let resizeTimer = null;

  // 窗口大小變化處理函數（帶防抖）
  const handleResize = () => {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(() => {
      // 只有在 StatisticsTab 可見時才重繪圖表
      if (props.activeUpperTab === 'statistics') {
        nextTick(() => {
          drawTrafficTimeChart();
          drawTotalTimeChart();
        });
      }
    }, 150); // 150ms防抖延遲
  };

  // 組件掛載後添加監聽器
  onMounted(() => {
    // 只有在 StatisticsTab 可見時才繪製圖表
    if (props.activeUpperTab === 'statistics') {
      nextTick(() => {
        drawTrafficTimeChart();
        drawTotalTimeChart();
      });
    }

    // 添加窗口大小變化監聽器
    window.addEventListener('resize', handleResize);
  });

  // 組件卸載時移除監聽器和清理計時器
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
  });
</script>

<style scoped></style>
