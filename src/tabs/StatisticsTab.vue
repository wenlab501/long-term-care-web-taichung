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
        <div
          v-if="
            serviceDateStatistics.length > 0 &&
            (trafficTimeDistribution.length > 0 || totalTimeDistribution.length > 0)
          "
          class="mb-3"
        >
          <div class="row">
            <!-- 交通時間分布圖表 -->
            <div class="col-12 col-md-6 mb-3">
              <div
                v-if="trafficTimeDistribution.length > 0"
                class="rounded-4 my-bgcolor-gray-100 p-3 h-100"
              >
                <h6 class="my-title-sm-black text-center mb-3">交通時間分布統計</h6>
                <div ref="chartContainer" class="d-flex justify-content-center"></div>
              </div>
            </div>

            <!-- 總時間分布圖表 -->
            <div class="col-12 col-md-6 mb-3">
              <div
                v-if="totalTimeDistribution.length > 0"
                class="rounded-4 my-bgcolor-gray-100 p-3 h-100"
              >
                <h6 class="my-title-sm-black text-center mb-3">總時間分布統計</h6>
                <div ref="totalTimeChartContainer" class="d-flex justify-content-center"></div>
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
                      <span class="my-title-xs-gray text-nowrap">交通時間</span>
                    </th>
                    <th class="p-1">
                      <span class="my-title-xs-gray text-nowrap">總時間</span>
                    </th>
                    <th class="p-1">
                      <span class="my-title-xs-gray text-nowrap">路線說明</span>
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
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 80px">
                      <div class="my-content-xs-black px-3 py-2">{{ trafficTime.time }}</div>
                    </td>
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 80px">
                      <div class="my-content-xs-black px-3 py-2">{{ trafficTime.totalTime }}</div>
                    </td>
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 120px">
                      <div class="my-content-xs-black px-3 py-2">
                        {{ trafficTime.routeDescription }}
                      </div>
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
        <div
          v-if="
            serviceProviderStatistics.length > 0 &&
            (trafficTimeDistribution.length > 0 || totalTimeDistribution.length > 0)
          "
          class="mb-4"
        >
          <div class="row">
            <!-- 交通時間分布圖表 -->
            <div class="col-12 col-md-6 mb-3">
              <div
                v-if="trafficTimeDistribution.length > 0"
                class="rounded-4 my-bgcolor-gray-100 p-3 h-100"
              >
                <h6 class="my-title-sm-black text-center mb-3">交通時間分布統計</h6>
                <div ref="chartContainer" class="d-flex justify-content-center"></div>
              </div>
            </div>

            <!-- 總時間分布圖表 -->
            <div class="col-12 col-md-6 mb-3">
              <div
                v-if="totalTimeDistribution.length > 0"
                class="rounded-4 my-bgcolor-gray-100 p-3 h-100"
              >
                <h6 class="my-title-sm-black text-center mb-3">總時間分布統計</h6>
                <div ref="totalTimeChartContainer" class="d-flex justify-content-center"></div>
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
                      <span class="my-title-xs-gray text-nowrap">交通時間</span>
                    </th>
                    <th class="p-1">
                      <span class="my-title-xs-gray text-nowrap">總時間</span>
                    </th>
                    <th class="p-1">
                      <span class="my-title-xs-gray text-nowrap">路線說明</span>
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
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 80px">
                      <div class="my-content-xs-black px-3 py-2">{{ trafficTime.time }}</div>
                    </td>
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 80px">
                      <div class="my-content-xs-black px-3 py-2">{{ trafficTime.totalTime }}</div>
                    </td>
                    <td class="border-0 text-nowrap text-truncate p-0" style="max-width: 120px">
                      <div class="my-content-xs-black px-3 py-2">
                        {{ trafficTime.routeDescription }}
                      </div>
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
  import { computed, watch, ref, onMounted, nextTick } from 'vue';
  import { useDataStore } from '@/stores/dataStore.js';
  import * as d3 from 'd3';

  const dataStore = useDataStore();
  const chartContainer = ref(null);
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
   * 📊 計算交通時間分布統計
   */
  const trafficTimeDistribution = computed(() => {
    let allTrafficTimes = [];

    if (isServiceDateMode.value) {
      // 服務日期模式：收集所有服務人員的交通時間
      const serviceProviderGroup = dataStore.layers.find(
        (group) => group.groupName === '服務人員列表'
      );
      if (serviceProviderGroup) {
        const visibleLayers = serviceProviderGroup.groupLayers.filter((layer) => layer.visible);
        visibleLayers.forEach((layer) => {
          const trafficTimes = extractTrafficTimesFromLayer(layer);
          allTrafficTimes.push(...trafficTimes);
        });
      }
    } else if (isServiceProviderMode.value) {
      // 服務人員模式：收集所有服務日期的交通時間
      const serviceDateGroup = dataStore.layers.find((group) => group.groupName === '服務日期列表');
      if (serviceDateGroup) {
        const visibleLayers = serviceDateGroup.groupLayers.filter((layer) => layer.visible);
        visibleLayers.forEach((layer) => {
          const trafficTimes = extractTrafficTimesFromLayer(layer);
          allTrafficTimes.push(...trafficTimes);
        });
      }
    }

    // 過濾掉#1的0分鐘交通時間（起點），其他0分鐘要計算
    const filteredTrafficTimes = allTrafficTimes.filter((traffic) => {
      // 只有#1的0分鐘不計算，其他0分鐘都要計算
      return !(traffic.sequenceNumber === 1 && traffic.totalMinutes === 0);
    });

    // 按10分鐘區間分組，超過2小時的合併為1個bar，最小刻度是5
    const distribution = {};

    // 初始化所有可能的區間（5-14, 15-24, ..., 115-124, >125）
    for (let i = 5; i <= 125; i += 10) {
      const intervalKey = `${i}-${i + 9}`;
      distribution[intervalKey] = 0;
    }
    distribution['>125'] = 0;

    // 統計實際數據（過濾掉小於0或NaN的值）
    filteredTrafficTimes.forEach((traffic) => {
      // 確保是有效的正數值
      if (traffic.totalMinutes > 0 && !isNaN(traffic.totalMinutes)) {
        if (traffic.totalMinutes > 125) {
          distribution['>125'] += 1;
        } else {
          const interval = Math.floor((traffic.totalMinutes - 5) / 10) * 10 + 5;
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
          const trafficTimes = extractTrafficTimesFromLayer(layer);
          // 收集每個交通時間的累積總時間（每一筆都要算，包括#1）
          trafficTimes.forEach((traffic) => {
            allTotalTimes.push(traffic.cumulativeTotalMinutes);
          });
        });
      }
    } else if (isServiceProviderMode.value) {
      // 服務人員模式：收集所有服務日期的總時間
      const serviceDateGroup = dataStore.layers.find((group) => group.groupName === '服務日期列表');
      if (serviceDateGroup) {
        const visibleLayers = serviceDateGroup.groupLayers.filter((layer) => layer.visible);
        visibleLayers.forEach((layer) => {
          const trafficTimes = extractTrafficTimesFromLayer(layer);
          // 收集每個交通時間的累積總時間（每一筆都要算，包括#1）
          trafficTimes.forEach((traffic) => {
            allTotalTimes.push(traffic.cumulativeTotalMinutes);
          });
        });
      }
    }

    // 按30分鐘區間分組，超過5小時的合併為1個bar，最小刻度是5
    const distribution = {};

    // 初始化所有可能的區間（5-34, 35-64, ..., 275-304, >305）
    for (let i = 5; i <= 305; i += 30) {
      const intervalKey = `${i}-${i + 29}`;
      distribution[intervalKey] = 0;
    }
    distribution['>305'] = 0;

    // 統計實際數據（過濾掉小於0或NaN的值）
    allTotalTimes.forEach((totalMinutes) => {
      // 確保是有效的正數值
      if (totalMinutes > 0 && !isNaN(totalMinutes)) {
        if (totalMinutes > 305) {
          distribution['>305'] += 1;
        } else {
          const interval = Math.floor((totalMinutes - 5) / 30) * 30 + 5;
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
          const timeString = hours > 0 ? `${hours}小時${minutes}分鐘` : `${minutes}分鐘`;

          // 計算總時間
          const totalHours = Math.floor(cumulativeTotalMinutes / 60);
          const totalMinutesRemainder = cumulativeTotalMinutes % 60;
          const totalTimeString =
            totalHours > 0
              ? `${totalHours}小時${totalMinutesRemainder}分鐘`
              : `${totalMinutesRemainder}分鐘`;

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
    if (!chartContainer.value || trafficTimeDistribution.value.length === 0) {
      return;
    }

    // 清除之前的圖表
    d3.select(chartContainer.value).selectAll('*').remove();

    const data = trafficTimeDistribution.value;
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 400 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = d3
      .select(chartContainer.value)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // 設定比例尺
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.interval))
      .range([0, width])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count)])
      .range([height, 0]);

    // 繪製長條（只繪製數量大於0的bar）
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.interval) + (xScale.bandwidth() - 8) / 2)
      .attr('width', 8)
      .attr('y', (d) => (d.count > 0 ? yScale(d.count) : height))
      .attr('height', (d) => (d.count > 0 ? height - yScale(d.count) : 0))
      .attr('fill', '#007bff');

    // 添加數值標籤
    g.selectAll('.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (d) => xScale(d.interval) + xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(d.count) - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text((d) => d.count);

    // 添加 X 軸
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em')
      .attr('font-size', '10px');

    // 添加 Y 軸
    g.append('g').call(d3.axisLeft(yScale).ticks(5)).attr('font-size', '10px');
  };

  /**
   * 📊 繪製總時間分布長條圖
   */
  const drawTotalTimeChart = () => {
    if (!totalTimeChartContainer.value || totalTimeDistribution.value.length === 0) {
      return;
    }

    // 清除之前的圖表
    d3.select(totalTimeChartContainer.value).selectAll('*').remove();

    const data = totalTimeDistribution.value;
    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = 400 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const svg = d3
      .select(totalTimeChartContainer.value)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // 設定比例尺
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.interval))
      .range([0, width])
      .padding(0.1);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count)])
      .range([height, 0]);

    // 繪製長條
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.interval) + (xScale.bandwidth() - 8) / 2)
      .attr('width', 8)
      .attr('y', (d) => yScale(d.count))
      .attr('height', (d) => height - yScale(d.count))
      .attr('fill', '#28a745');

    // 添加數值標籤
    g.selectAll('.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (d) => xScale(d.interval) + xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(d.count) - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text((d) => d.count);

    // 添加 X 軸
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em')
      .attr('font-size', '10px');

    // 添加 Y 軸
    g.append('g').call(d3.axisLeft(yScale).ticks(5)).attr('font-size', '10px');
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

  // 組件掛載後繪製圖表
  onMounted(() => {
    nextTick(() => {
      drawTrafficTimeChart();
      drawTotalTimeChart();
    });
  });
</script>

<style scoped></style>
