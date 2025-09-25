<template>
  <!-- 📊 統計分析視圖組件 -->
  <div class="d-flex flex-column my-bgcolor-gray-200 h-100">
    <!-- 統計內容 -->
    <div class="flex-grow-1 overflow-auto my-bgcolor-white p-3">
      <!-- 📊 統計分析內容：統一處理服務日期和服務人員模式 -->
      <div v-if="isServiceDateMode || isServiceProviderMode">
        <div class="mb-4">
          <!-- 子 Tab 導航 -->
          <div class="mt-3">
            <div class="d-flex" style="border-radius: 0">
              <!-- 當前結果 Tab -->
              <button
                type="button"
                class="flex-fill border-0 py-2 px-3 text-center"
                :style="{
                  'border-bottom': '3px solid var(--bs-primary)',
                  'border-radius': '0',
                  'font-weight': isCurrentTabActive() ? 'bold' : 'normal',
                }"
                @click="
                  isServiceDateMode
                    ? (activeServiceDateSubTab = 'current')
                    : (activeServiceProviderSubTab = 'current')
                "
              >
                {{ getCurrentResultTabTitle() }}
              </button>

              <!-- 全部內容 Tab -->
              <button
                type="button"
                class="flex-fill border-0 py-2 px-3 text-center"
                :class="{
                  'bg-light': isAllContentTabActive(),
                  'bg-white': !isAllContentTabActive(),
                }"
                :style="{
                  'border-bottom': '3px solid var(--bs-primary)',
                  'border-radius': '0',
                  'font-weight': isAllContentTabActive() ? 'bold' : 'normal',
                }"
                @click="
                  isServiceDateMode
                    ? (activeServiceDateSubTab = 'all')
                    : (activeServiceProviderSubTab = 'all')
                "
              >
                {{ getDataSourceName() }}
              </button>
            </div>
          </div>
          <div class="my-title-lg-black mt-4">
            {{ getStatisticsTitle() }}
          </div>
        </div>

        <!-- 📊 統計圖表區塊 -->
        <div v-if="displayStatistics.length > 0" class="mb-3">
          <div class="row">
            <!-- 總服務時間分布圖表 -->
            <div class="col-12 col-md-6 mb-3">
              <div class="rounded-4 my-bgcolor-gray-100 pt-3 h-100">
                <h6 class="my-title-sm-black text-center mb-3">總服務時間分布統計</h6>
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

        <!-- 統計表格 -->
        <div
          v-if="displayStatistics.length > 0"
          class="rounded-4 my-bgcolor-gray-100 p-4 mb-3 h-100"
        >
          <div class="my-title-sm-black text-center mb-3">
            {{ isServiceDateMode ? '服務人員列表交通時間統計' : '服務日期列表交通時間統計' }}
            <span
              v-if="
                (isServiceDateMode && activeServiceDateSubTab === 'all') ||
                (isServiceProviderMode && activeServiceProviderSubTab === 'all')
              "
              class="text-muted"
            >
              (全部內容)
            </span>
          </div>
          <div v-for="item in displayStatistics" :key="item.key" class="mb-4">
            <div class="my-title-xs-gray text-center mb-2">{{ item.label }}</div>
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
                      <span class="my-title-xs-gray text-nowrap">總服務時間</span>
                    </th>
                    <th class="p-1">
                      <span class="my-title-xs-gray text-nowrap">交通時間</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(trafficTime, index) in item.trafficTimes"
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
          <div class="my-title-md-gray p-3">
            {{
              (isServiceDateMode && activeServiceDateSubTab === 'all') ||
              (isServiceProviderMode && activeServiceProviderSubTab === 'all')
                ? '該資料來源暫無數據'
                : '沒有開啟的圖層'
            }}
          </div>
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

  // 子 tab 狀態管理
  const activeServiceDateSubTab = ref('current'); // 'current' | 'all'
  const activeServiceProviderSubTab = ref('current'); // 'current' | 'all'

  /**
   * 📊 獲取統計標題
   */
  const getStatisticsTitle = () => {
    const baseTitle = isServiceDateMode.value ? '服務日期統計' : '服務人員統計';

    // 如果是全部內容 tab，不顯示具體的日期或人員
    const isAllContentActive =
      (isServiceDateMode.value && activeServiceDateSubTab.value === 'all') ||
      (isServiceProviderMode.value && activeServiceProviderSubTab.value === 'all');

    if (isAllContentActive) {
      return `${baseTitle} - 全部數據`;
    } else {
      const selectedItem = isServiceDateMode.value
        ? selectedServiceDate.value
        : selectedServiceProvider.value;
      return `${baseTitle} - ${selectedItem || '未選擇'}`;
    }
  };

  /**
   * 📊 檢查當前結果 tab 是否激活
   */
  const isCurrentTabActive = () => {
    return (
      (isServiceDateMode.value && activeServiceDateSubTab.value === 'current') ||
      (isServiceProviderMode.value && activeServiceProviderSubTab.value === 'current')
    );
  };

  /**
   * 📊 檢查全部內容 tab 是否激活
   */
  const isAllContentTabActive = () => {
    return (
      (isServiceDateMode.value && activeServiceDateSubTab.value === 'all') ||
      (isServiceProviderMode.value && activeServiceProviderSubTab.value === 'all')
    );
  };

  /**
   * 📊 獲取當前結果 tab 的標題
   */
  const getCurrentResultTabTitle = () => {
    if (isServiceDateMode.value) {
      return selectedServiceDate.value || '未選擇日期';
    } else if (isServiceProviderMode.value) {
      return selectedServiceProvider.value || '未選擇人員';
    }
    return '當前結果';
  };

  /**
   * 📊 獲取資料來源名稱
   */
  const getDataSourceName = () => {
    // 獲取當前選中的資料來源檔案名稱
    const selectedFile = dataStore.selectedFileFilter;

    if (selectedFile === 'all') {
      return '全部資料來源';
    }

    // 從檔案名稱中提取機構名稱
    // 例如: "filtered_臺中洪幸雪-20250801-20250831 全部的服務記錄_final.json" -> "臺中洪幸雪"
    const match = selectedFile.match(/filtered_(.+?)-/);
    if (match && match[1]) {
      return match[1];
    }

    // 如果無法解析，返回原始檔案名稱（去掉前綴和後綴）
    return selectedFile
      .replace(/^filtered_/, '')
      .replace(/-20250801-20250831 全部的服務記錄_final\.json$/, '');
  };

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
   * 📊 當前結果統計數據（受圖層開關影響）
   */
  const currentStatistics = computed(() => {
    if (isServiceDateMode.value) {
      return serviceDateStatistics.value.map((provider) => ({
        key: provider.serviceProviderId,
        label: provider.serviceProviderId,
        trafficTimes: provider.trafficTimes,
      }));
    } else if (isServiceProviderMode.value) {
      return serviceProviderStatistics.value.map((date) => ({
        key: date.serviceDate,
        label: date.serviceDate,
        trafficTimes: date.trafficTimes,
      }));
    }
    return [];
  });

  /**
   * 📊 全部內容統計數據（不受圖層開關影響，只看選擇的資料來源）
   */
  const allContentStatistics = computed(() => {
    if (isServiceDateMode.value) {
      // 服務日期模式：顯示選擇的服務日期的所有服務人員數據
      const selectedDate = selectedServiceDate.value;
      if (!selectedDate) return [];

      // 從所有圖層中收集該日期的數據（不受可見性影響）
      const allData = [];
      const serviceProviderGroup = dataStore.layers.find(
        (group) => group.groupName === '服務人員列表'
      );

      if (serviceProviderGroup) {
        console.log('🔍 AllContentStatistics - 服務日期模式:');
        console.log('  - 總圖層數:', serviceProviderGroup.groupLayers.length);
        console.log(
          '  - 可見圖層數:',
          serviceProviderGroup.groupLayers.filter((layer) => layer.visible).length
        );

        serviceProviderGroup.groupLayers.forEach((layer) => {
          // 收集所有數據，不管圖層是否可見
          const trafficTimes = extractTrafficTimesFromLayer(layer);
          console.log(
            `  - 圖層 ${layer.layerName} (可見: ${layer.visible}): ${trafficTimes.length} 筆數據`
          );
          allData.push(...trafficTimes);
        });
      }

      // 按服務人員分組
      const groupedByProvider = {};
      allData.forEach((item) => {
        if (!groupedByProvider[item.serviceProviderId]) {
          groupedByProvider[item.serviceProviderId] = [];
        }
        groupedByProvider[item.serviceProviderId].push(item);
      });

      return Object.keys(groupedByProvider).map((providerId) => ({
        key: providerId,
        label: providerId,
        trafficTimes: groupedByProvider[providerId].map((item) => ({
          routeDescription: item.routeDescription,
          totalTime: item.totalTime,
          time: item.time,
        })),
      }));
    } else if (isServiceProviderMode.value) {
      // 服務人員模式：顯示選擇的服務人員的所有服務日期數據
      const selectedProvider = selectedServiceProvider.value;
      if (!selectedProvider) return [];

      // 從所有圖層中收集該服務人員的數據（不受可見性影響）
      const allData = [];
      const serviceDateGroup = dataStore.layers.find((group) => group.groupName === '服務日期列表');

      if (serviceDateGroup) {
        serviceDateGroup.groupLayers.forEach((layer) => {
          // 收集所有數據，不管圖層是否可見
          const trafficTimes = extractTrafficTimesFromLayer(layer);
          allData.push(...trafficTimes);
        });
      }

      // 按服務日期分組
      const groupedByDate = {};
      allData.forEach((item) => {
        if (!groupedByDate[item.serviceDate]) {
          groupedByDate[item.serviceDate] = [];
        }
        groupedByDate[item.serviceDate].push(item);
      });

      return Object.keys(groupedByDate).map((date) => ({
        key: date,
        label: date,
        trafficTimes: groupedByDate[date].map((item) => ({
          routeDescription: item.routeDescription,
          totalTime: item.totalTime,
          time: item.time,
        })),
      }));
    }
    return [];
  });

  /**
   * 📊 根據當前子 tab 獲取統計數據
   */
  const displayStatistics = computed(() => {
    if (isServiceDateMode.value) {
      return activeServiceDateSubTab.value === 'current'
        ? currentStatistics.value
        : allContentStatistics.value;
    } else if (isServiceProviderMode.value) {
      return activeServiceProviderSubTab.value === 'current'
        ? currentStatistics.value
        : allContentStatistics.value;
    }
    return [];
  });

  /**
   * 📊 根據當前子 tab 計算總服務時間分布統計
   */
  const totalTimeDistribution = computed(() => {
    const statistics = displayStatistics.value;
    if (!statistics || statistics.length === 0) return [];

    // 收集所有交通時間數據
    const allTimes = [];
    statistics.forEach((item) => {
      if (item.trafficTimes && Array.isArray(item.trafficTimes)) {
        item.trafficTimes.forEach((trafficTime) => {
          if (trafficTime.totalTime && trafficTime.totalTime !== 'N/A') {
            const timeValue = parseTimeToMinutes(trafficTime.totalTime);
            if (timeValue > 0) {
              allTimes.push(timeValue);
            }
          }
        });
      }
    });

    return calculateTimeDistribution(allTimes);
  });

  /**
   * 📊 根據當前子 tab 計算交通時間分布統計
   */
  const trafficTimeDistribution = computed(() => {
    const statistics = displayStatistics.value;
    if (!statistics || statistics.length === 0) return [];

    // 收集所有交通時間數據
    const allTimes = [];
    statistics.forEach((item) => {
      if (item.trafficTimes && Array.isArray(item.trafficTimes)) {
        item.trafficTimes.forEach((trafficTime) => {
          if (trafficTime.time && trafficTime.time !== 'N/A') {
            const timeValue = parseTimeToMinutes(trafficTime.time);
            if (timeValue > 0) {
              allTimes.push(timeValue);
            }
          }
        });
      }
    });

    return calculateTrafficTimeDistribution(allTimes);
  });

  /**
   * 📊 解析時間字符串為分鐘數
   * @param {string} timeStr - 時間字符串，如 "1h43m", "26m", "2h56m"
   * @returns {number} 總分鐘數
   */
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || timeStr === 'N/A') return 0;

    let totalMinutes = 0;

    // 解析小時部分 (如 "1h43m" 中的 "1h")
    const hourMatch = timeStr.match(/(\d+)h/);
    if (hourMatch) {
      totalMinutes += parseInt(hourMatch[1]) * 60;
    }

    // 解析分鐘部分 (如 "1h43m" 中的 "43m" 或 "26m")
    const minuteMatch = timeStr.match(/(\d+)m/);
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1]);
    }

    return totalMinutes;
  };

  /**
   * 📊 計算總服務時間分布統計（30分鐘區間）
   */
  const calculateTimeDistribution = (times) => {
    if (!times || times.length === 0) return [];

    // 按30分鐘區間分組，超過5小時的合併為1個bar
    const distribution = {};

    // 初始化所有可能的區間（0-29, 30-59, ..., 270-299, >300）
    for (let i = 0; i <= 270; i += 30) {
      const intervalKey = `${i}-${i + 29}`;
      distribution[intervalKey] = 0;
    }
    distribution['>300'] = 0;

    // 統計實際數據
    times.forEach((minutes) => {
      if (minutes > 0 && !isNaN(minutes)) {
        if (minutes > 300) {
          distribution['>300'] += 1;
        } else {
          const interval = Math.floor(minutes / 30) * 30;
          const intervalKey = `${interval}-${interval + 29}`;
          distribution[intervalKey] += 1;
        }
      }
    });

    return Object.entries(distribution)
      .map(([interval, count]) => ({ interval, count }))
      .sort((a, b) => {
        if (a.interval.includes('>')) return 1;
        if (b.interval.includes('>')) return -1;
        const aStart = parseInt(a.interval.split('-')[0]);
        const bStart = parseInt(b.interval.split('-')[0]);
        return aStart - bStart;
      });
  };

  /**
   * 📊 計算交通時間分布統計（10分鐘區間）
   */
  const calculateTrafficTimeDistribution = (times) => {
    if (!times || times.length === 0) return [];

    // 按10分鐘區間分組，超過2小時的合併為1個bar
    const distribution = {};

    // 初始化所有可能的區間（0-9, 10-19, ..., 110-119, >120）
    for (let i = 0; i <= 110; i += 10) {
      const intervalKey = `${i}-${i + 9}`;
      distribution[intervalKey] = 0;
    }
    distribution['>120'] = 0;

    // 統計實際數據
    times.forEach((minutes) => {
      if (minutes > 0 && !isNaN(minutes)) {
        if (minutes > 120) {
          distribution['>120'] += 1;
        } else {
          const interval = Math.floor(minutes / 10) * 10;
          const intervalKey = `${interval}-${interval + 9}`;
          distribution[intervalKey] += 1;
        }
      }
    });

    return Object.entries(distribution)
      .map(([interval, count]) => ({ interval, count }))
      .sort((a, b) => {
        if (a.interval.includes('>')) return 1;
        if (b.interval.includes('>')) return -1;
        const aStart = parseInt(a.interval.split('-')[0]);
        const bStart = parseInt(b.interval.split('-')[0]);
        return aStart - bStart;
      });
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

    // 獲取對應的服務時間總服務時間數據
    const getServiceTotalTime = (serviceName) => {
      if (!layer.tableData || !Array.isArray(layer.tableData)) {
        return null;
      }

      const serviceItem = layer.tableData.find(
        (item) => item.姓名 === serviceName || item.name === serviceName
      );

      if (serviceItem) {
        // 計算服務時間的總服務時間（結束時間 - 起始時間）
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

    // 計算累積總服務時間
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

          // 獲取對應服務項目的服務時間總服務時間
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

    console.log('🔍 CurrentStatistics - 服務日期模式:');
    console.log('  - 總圖層數:', serviceProviderGroup.groupLayers.length);
    console.log('  - 可見圖層數:', visibleLayers.length);

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
   * 📊 通用圖表繪製函數
   * @param {Object} container - 圖表容器元素
   * @param {Array} data - 圖表數據
   * @param {string} color - 圖表顏色
   * @param {string} title - 圖表標題
   */
  const drawChart = (container, data, color) => {
    if (!container || data.length === 0) {
      return;
    }

    // 清除之前的圖表
    d3.select(container).selectAll('*').remove();

    // 獲取容器實際尺寸，確保圖表填滿容器
    const containerRect = container.getBoundingClientRect();
    const containerWidth = Math.max(containerRect.width || 400, 300); // 最小寬度300px

    // 設定比例尺 - 使用固定寬度柱子
    const barWidth = 8;
    const rightPadding = barWidth; // 右邊增加一個長條圖寬度的緩衝

    const margin = { top: 32, right: rightPadding, bottom: 0, left: 40 };
    const width = containerWidth - margin.left - margin.right;
    const height = 160 - margin.top;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '200px')
      .attr('viewBox', `0 0 ${containerWidth} 200`)
      .attr('preserveAspectRatio', 'none');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // 計算長條圖的佈局
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
      .attr('fill', color);

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
      const text = dataItem.interval.includes('>')
        ? dataItem.interval
        : (parseInt(dataItem.interval.split('-')[1]) + 1).toString();

      const textGroup = xAxisGroup.append('g').attr('transform', `translate(${x}, 20)`);

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
      .attr('x', 0)
      .attr('y', height + 20)
      .style('font-size', '12px')
      .style('font-family', 'Arial, sans-serif')
      .style('fill', '#333')
      .style('text-anchor', 'end');
  };

  /**
   * 📊 繪製交通時間分布長條圖
   */
  const drawTrafficTimeChart = () => {
    drawChart(
      trafficTimeChartContainer.value,
      trafficTimeDistribution.value,
      'var(--my-color-blue)'
    );
  };

  /**
   * 📊 繪製總服務時間分布長條圖
   */
  const drawTotalTimeChart = () => {
    drawChart(totalTimeChartContainer.value, totalTimeDistribution.value, 'var(--my-color-green)');
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

  // 監聽總服務時間分布變化，重新繪製圖表
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

  // 監聽 isPanelDragging 變化，當面板拖拽結束時重繪圖表
  watch(
    () => props.isPanelDragging,
    (isDragging, wasDragging) => {
      console.log('🔍 isPanelDragging changed:', { isDragging, wasDragging });
      // 當拖拽結束時重繪圖表
      if (wasDragging && !isDragging && props.activeUpperTab === 'statistics') {
        console.log('✅ Panel drag ended, redrawing charts');
        nextTick(() => {
          setTimeout(() => {
            redrawCharts();
          }, 100);
        });
      }
    },
    { immediate: false }
  );

  // 防抖計時器
  let resizeTimer = null;
  let resizeObserver = null;

  // 重繪圖表函數
  const redrawCharts = () => {
    console.log('🔄 redrawCharts called, activeUpperTab:', props.activeUpperTab);
    if (props.activeUpperTab === 'statistics') {
      nextTick(() => {
        console.log('📊 Redrawing charts...');
        drawTrafficTimeChart();
        drawTotalTimeChart();
      });
    }
  };

  // 窗口大小變化處理函數（帶防抖）
  const handleResize = () => {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(() => {
      redrawCharts();
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

    // 添加 ResizeObserver 監聽容器尺寸變化
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver((entries) => {
        console.log('🔍 ResizeObserver triggered, entries:', entries.length);
        // 檢查是否有容器尺寸變化
        for (let entry of entries) {
          console.log('📏 Entry target:', entry.target.className, 'size:', entry.contentRect);
          // 任何尺寸變化都觸發重繪，因為面板拖拽可能影響到任何父級容器
          handleResize();
          break;
        }
      });

      // 監聽圖表容器及其所有父級元素
      nextTick(() => {
        let element = trafficTimeChartContainer.value;
        let level = 0;
        while (element && level < 5) {
          // 最多監聽5層父級元素
          console.log(
            '👀 Observing element level',
            level,
            ':',
            element.className || element.tagName
          );
          resizeObserver.observe(element);
          element = element.parentElement;
          level++;
        }

        element = totalTimeChartContainer.value;
        level = 0;
        while (element && level < 5) {
          resizeObserver.observe(element);
          element = element.parentElement;
          level++;
        }
      });
    }
  });

  // 組件卸載時移除監聽器和清理計時器
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });
</script>

<style scoped></style>
