<script>
  /**
   * PropertiesTab.vue
   *
   * Purpose:
   * - Displays details for the currently selected feature (layer meta, detail list, service info).
   * - Shows analysis-in-range summaries when selecting analysis features.
   *
   * Notes:
   * - Non-functional refactor: documentation added only; logic and UI remain unchanged.
   */
  import DetailItem from '../components/DetailItem.vue';
  import { useDataStore } from '../stores/dataStore';
  import { computed, ref } from 'vue';

  export default {
    name: 'PropertiesTab',

    /**
     * 🧩 組件註冊 (Component Registration)
     * 註冊物件屬性分頁內使用的子組件
     */
    components: {
      DetailItem, // 詳細資訊項目組件
    },

    /**
     * 🔧 組件設定函數 (Component Setup)
     * 使用 Composition API 設定組件邏輯
     */
    setup() {
      // 📦 取得 Pinia 數據存儲實例
      const dataStore = useDataStore();

      /**
       * 📊 選中物件計算屬性 (Selected Feature Computed Property)
       * 從 Pinia store 獲取當前選中的地圖物件
       * 提供響應式的選中物件數據
       */
      const selectedFeature = computed(() => {
        return dataStore.selectedFeature;
      });

      const selectedLayer = computed(() => {
        if (!selectedFeature.value?.properties?.layerId) {
          return null;
        }

        const layerId = selectedFeature.value.properties.layerId;
        const layer = dataStore.findLayerById(layerId);
        return layer;
      });

      // 右側標色需與地圖一致：優先使用 feature 上的 fillColor/routeColor，其次使用 layer.colorName
      const selectedLayerColor = computed(() => {
        const layer = selectedLayer.value;
        if (!layer) return 'var(--my-color-gray-300)';
        if (
          layer.geoJsonData &&
          layer.geoJsonData.features &&
          layer.geoJsonData.features.length > 0
        ) {
          const f =
            layer.geoJsonData.features.find(
              (ff) => ff.properties && (ff.properties.fillColor || ff.properties.routeColor)
            ) || layer.geoJsonData.features[0];
          const props = f.properties || {};
          if (props.fillColor) return `var(--my-color-${props.fillColor})`;
          if (props.routeColor) return `var(--my-color-${props.routeColor})`;
        }
        if (layer.colorName) return `var(--my-color-${layer.colorName})`;
        return 'var(--my-color-gray-300)';
      });

      /**
       * 🏷️ 圖層名稱計算屬性 (Layer Name Computed Property)
       * 根據 selectedFeature.properties.layerId 從 dataStore 的 layers 中找到對應的圖層名稱
       */
      const layerName = computed(() => {
        if (!selectedFeature.value?.properties?.layerId) {
          return null;
        }

        const layerId = selectedFeature.value.properties.layerId;
        const layer = dataStore.findLayerById(layerId);
        return layer ? layer.layerName : layerId;
      });

      /**
       * 🏷️ 服務人員標籤計算屬性 (Service Provider Label Computed Property)
       * 獲取當前選中的服務人員信息
       */
      const serviceProviderLabel = computed(() => {
        // 若有選中的服務點，優先從該點取得服務人員
        if (selectedServicePoint.value) {
          const sp = selectedServicePoint.value;
          if (sp.serviceProviderId) return sp.serviceProviderId;
          if (sp['服務人員身分證']) return sp['服務人員身分證'];
          if (sp.detail?.['服務人員身分證']) return sp.detail['服務人員身分證'];
        }

        // 優先從 bottom panel 選中的物件獲取服務人員信息
        if (selectedFeature.value?.properties) {
          const props = selectedFeature.value.properties;

          // 從選中物件的屬性中獲取服務人員身分證
          if (props.serviceProviderId) {
            return props.serviceProviderId;
          }

          if (props.服務人員身分證) {
            return props.服務人員身分證;
          }

          // 如果是 detail 物件，從 detail 中獲取
          if (props.detail?.服務人員身分證) {
            return props.detail.服務人員身分證;
          }
        }

        // 回退到 left panel 的選擇
        if (dataStore.selectedServiceProvider) {
          return dataStore.selectedServiceProvider;
        }

        // 如果是在日期篩選模式下（服務日期 tab 活躍），顯示 "所有服務人員"
        if (dataStore.isDateFilterActive && !dataStore.isServiceProviderFilterActive) {
          return '所有服務人員';
        }

        // 其他情況顯示未選擇
        return '未選擇';
      });

      /**
       * 🏷️ 服務日期標籤計算屬性 (Service Date Label Computed Property)
       * 獲取當前選中的服務日期信息
       */
      const serviceDateLabel = computed(() => {
        // 若有選中的服務點，優先從該點取得服務日期
        if (selectedServicePoint.value) {
          const sp = selectedServicePoint.value;
          if (sp.serviceDate) return sp.serviceDate;
          if (sp['服務日期(請輸入7碼)']) return sp['服務日期(請輸入7碼)'];
          if (sp.服務日期) return sp.服務日期;
          if (sp.detail?.['服務日期(請輸入7碼)']) return sp.detail['服務日期(請輸入7碼)'];
          if (sp.detail?.服務日期) return sp.detail.服務日期;
        }

        // 優先從 bottom panel 選中的物件獲取服務日期信息
        if (selectedFeature.value?.properties) {
          const props = selectedFeature.value.properties;

          // 從選中物件的屬性中獲取服務日期
          if (props.serviceDate) {
            return props.serviceDate;
          }

          if (props['服務日期(請輸入7碼)']) {
            return props['服務日期(請輸入7碼)'];
          }

          // 如果是 detail 物件，從 detail 中獲取
          if (props.detail?.['服務日期(請輸入7碼)']) {
            return props.detail['服務日期(請輸入7碼)'];
          }

          // 也檢查其他可能的服務日期欄位
          if (props.服務日期) {
            return props.服務日期;
          }

          if (props.detail?.服務日期) {
            return props.detail.服務日期;
          }
        }

        // 回退到 left panel 的選擇
        if (dataStore.selectedServiceDate) {
          return dataStore.selectedServiceDate;
        }

        // 如果在服務人員模式下但沒有選擇日期
        if (dataStore.isServiceProviderFilterActive) {
          return '所有日期';
        }

        return '未選擇';
      });

      /**
       * 📑 根據左側面板活躍分頁決定標籤順序 (Label Order Based on Active Left Tab)
       * 當左側面板是 'date' 時，先顯示服務日期，再顯示服務人員
       * 當左側面板是 'server' 時，先顯示服務人員，再顯示服務日期
       */
      const firstLabel = computed(() => {
        return dataStore.activeLeftTab === 'date' ? '服務日期' : '服務人員';
      });

      const secondLabel = computed(() => {
        return dataStore.activeLeftTab === 'date' ? '服務人員' : '服務日期';
      });

      const firstValue = computed(() => {
        return dataStore.activeLeftTab === 'date'
          ? serviceDateLabel.value
          : serviceProviderLabel.value;
      });

      const secondValue = computed(() => {
        return dataStore.activeLeftTab === 'date'
          ? serviceProviderLabel.value
          : serviceDateLabel.value;
      });

      /**
       * 📋 是否有屬性計算屬性 (Has Properties Computed Property)
       * 檢查選中物件是否包含有效的屬性資料
       *
       * @returns {boolean} 是否有屬性資料
       */
      const hasProperties = computed(() => {
        return (
          !!selectedFeature.value?.properties?.propertyData &&
          Object.keys(selectedFeature.value.properties.propertyData).length > 0
        );
      });

      /**
       * 🎯 是否為分析圖層物件 (Is Analysis Layer Object)
       * 檢查選中物件是否為分析圖層的物件
       */
      const isAnalysisObject = computed(() => {
        return selectedFeature.value?.properties?.layerId === 'analysis-layer';
      });

      // 注意：路徑規劃和路徑優化相關的計算屬性已移除

      /**
       * 👨‍⚕️ 是否為服務人員物件 (Is Service Provider Object)
       * 檢查選中物件是否為服務人員物件
       */
      const isServiceProviderObject = computed(() => {
        return selectedFeature.value?.properties?.type === 'service-provider';
      });

      /**
       * ⭐ 是否為路線中心點物件 (Is Route Center Point Object)
       * 檢查選中物件是否為路線中心點
       */
      const isRouteCenterPointObject = computed(() => {
        return selectedFeature.value?.properties?.type === 'route-center-point-selected';
      });

      /**
       * 📋 是否為服務項目列表物件 (Is Service Items Object)
       * 檢查選中物件是否包含服務項目列表
       */
      const isServiceItemsObject = computed(() => {
        const selectedFeatureProps = selectedFeature.value?.properties;
        const type = selectedFeatureProps?.type;
        const serviceItems = selectedFeatureProps?.serviceItems;
        const serviceItemsLength = serviceItems?.length;

        const result =
          type === 'service-items' && Array.isArray(serviceItems) && serviceItemsLength > 0;

        return result;
      });

      /**
       * 📍 選中的服務點 (Selected Service Point)
       * 用於顯示個案詳細信息
       */
      const selectedServicePoint = ref(null);

      /**
       * 🎯 選擇服務點 (Select Service Point)
       * 點擊個案列表中的項目時調用
       */
      const selectServicePoint = (point) => {
        selectedServicePoint.value = point;
      };

      // 注意：路徑規劃和路徑優化詳細信息計算屬性已移除

      /**
       * 📍 範圍內點位清單 (Points In Range List)
       * 獲取分析圖層物件範圍內的點清單
       */
      const pointsInRange = computed(() => {
        if (!isAnalysisObject.value) return [];
        return selectedFeature.value?.properties?.pointsInRange || [];
      });

      /**
       * 🏢 範圍內多邊形清單 (Polygon In Range List)
       * 獲取分析圖層物件範圍內的多邊形清單
       */
      const polygonInRange = computed(() => {
        if (!isAnalysisObject.value) return [];
        return selectedFeature.value?.properties?.polygonInRange || [];
      });

      /**
       * 📋 範圍內所有物件清單 (All Objects In Range List)
       * 整合點物件和多邊形物件的統一清單
       */
      const allObjectsInRange = computed(() => {
        const points = pointsInRange.value.map((obj) => ({ ...obj, objectType: 'point' }));
        const polygons = polygonInRange.value.map((obj) => ({ ...obj, objectType: 'polygon' }));
        return [...points, ...polygons];
      });

      /**
       * 📊 圖層統計 (Layer Statistics)
       * 獲取範圍內各圖層的統計信息（點物件）
       */
      const layerStats = computed(() => {
        if (!isAnalysisObject.value) return {};
        return selectedFeature.value?.properties?.layerStats || {};
      });

      /**
       * 🏢 多邊形圖層統計 (Polygon Layer Statistics)
       * 獲取範圍內各圖層的統計信息（多邊形物件）
       */
      const polygonStats = computed(() => {
        if (!isAnalysisObject.value) return {};
        return selectedFeature.value?.properties?.polygonStats || {};
      });

      /**
       * 📊 整合統計 (Combined Statistics)
       * 整合點物件和多邊形物件的統計
       */
      const combinedStats = computed(() => {
        const combined = { ...layerStats.value };
        Object.entries(polygonStats.value).forEach(([layerName, count]) => {
          const key = `${layerName} (多邊形)`;
          combined[key] = count;
        });
        return combined;
      });

      /**
       * 🕐 格式化日期時間 (Format Date Time)
       * 將 ISO 字串轉換為本地化的日期時間格式
       * @param {string} isoString - ISO 格式的日期時間字串
       * @returns {string} - 格式化後的日期時間字串
       */
      const formatDateTime = (isoString) => {
        if (!isoString) return '';
        try {
          return new Date(isoString).toLocaleString('zh-TW');
        } catch (error) {
          console.warn('日期格式化失敗:', error);
          return isoString;
        }
      };

      // 📤 返回響應式數據給模板使用
      return {
        selectedFeature, // 選中物件
        selectedLayer, // 選中圖層
        selectedLayerColor, // 圖層顯示顏色（與地圖一致）
        layerName, // 圖層名稱
        serviceProviderLabel, // 服務人員標籤
        serviceDateLabel, // 服務日期標籤
        firstLabel, // 第一個標籤（根據左側面板分頁決定）
        secondLabel, // 第二個標籤（根據左側面板分頁決定）
        firstValue, // 第一個值（根據左側面板分頁決定）
        secondValue, // 第二個值（根據左側面板分頁決定）
        hasProperties, // 是否有屬性
        isAnalysisObject, // 是否為分析圖層物件
        // 注意：路徑規劃和路徑優化相關的計算屬性已移除
        isServiceProviderObject, // 是否為服務人員物件
        isServiceItemsObject, // 是否為服務項目列表物件
        isRouteCenterPointObject, // 是否為路線中心點物件
        selectedServicePoint, // 選中的服務點
        selectServicePoint, // 選擇服務點方法
        pointsInRange, // 範圍內點位清單
        polygonInRange, // 範圍內多邊形清單
        allObjectsInRange, // 範圍內所有物件清單
        layerStats, // 點圖層統計
        polygonStats, // 多邊形圖層統計
        combinedStats, // 整合統計
        formatDateTime, // 日期時間格式化函數
        selectedServiceDate: computed(() => dataStore.selectedServiceDate), // 當前選中的服務日期
      };
    },

    /**
     * 🛠️ 組件方法定義 (Component Methods)
     * 定義資料格式化和處理方法
     */
    methods: {
      /**
       * 📝 格式化屬性標籤 (Format Property Label)
       * 將英文屬性名稱轉換為中文顯示名稱
       *
       * @param {string} key - 原始屬性名稱
       * @returns {string} 格式化後的顯示名稱
       */
      formatLabel(key) {
        // 屬性名稱對照表，提供中文化顯示
        const labelMap = {
          PTVNAME: '區域名稱',
          中位數: '中位數',
          name: '名稱',
          count: '數量',
          area: '面積',
          population: '人口',
          density: '密度',
          // 分析圖層專用標籤
          分析點名稱: '分析點名稱',
          分析範圍名稱: '分析範圍名稱',
          緯度: '緯度',
          經度: '經度',
          中心緯度: '中心緯度',
          中心經度: '中心經度',
          分析半徑: '分析半徑',
          建立時間: '建立時間',
          關聯分析點: '關聯分析點',
        };
        return labelMap[key] || key;
      },

      /**
       * 🎨 格式化屬性值 (Format Property Value)
       * 根據值的類型進行適當的格式化處理
       *
       * @param {any} value - 原始屬性值
       * @returns {string} 格式化後的顯示值
       */
      formatValue(value) {
        // 數字類型：添加千分位分隔符
        if (typeof value === 'number') {
          return value.toLocaleString();
        }
        // 其他類型：直接返回
        return value;
      },
    },
  };
</script>

<template>
  <div class="h-100 flex-grow-1 d-flex flex-column my-bgcolor-gray-200">
    <!-- 當有選中物件時顯示詳細資訊 -->
    <div v-if="selectedFeature" class="my-bgcolor-white h-100">
      <div>
        <div
          v-if="selectedLayer"
          :style="{
            backgroundColor: selectedLayerColor,
            minHeight: '4px',
          }"
        ></div>

        <div class="p-3">
          <DetailItem :label="firstLabel" :value="firstValue" />
          <DetailItem :label="secondLabel" :value="secondValue" />
          <template v-if="hasProperties">
            <DetailItem
              v-for="(value, key) in selectedFeature.properties.propertyData"
              :key="key"
              :label="formatLabel(key)"
              :value="formatValue(value)"
            />
          </template>

          <!-- 🎯 分析圖層專用：範圍內物件清單 -->
          <template
            v-if="isAnalysisObject && (pointsInRange.length > 0 || polygonInRange.length > 0)"
          >
            <!-- 📍 點物件清單 -->
            <template v-if="pointsInRange.length > 0">
              <hr class="my-3" />

              <div class="my-title-xs-gray mb-3">範圍內點物件 {{ pointsInRange.length }}</div>
              <DetailItem
                v-for="(point, index) in pointsInRange"
                :key="index"
                :label="point.properties.layerName"
                :value="`${point.properties.name} (${point.distance}m)`"
              />
            </template>

            <!-- 🏢 多邊形物件清單 -->
            <template v-if="polygonInRange.length > 0">
              <hr class="my-3" />

              <div class="my-title-xs-gray mb-3">範圍內面域物件 {{ polygonInRange.length }}</div>
              <DetailItem
                v-for="(polygon, index) in polygonInRange"
                :key="index"
                :label="polygon.properties.layerName"
                :value="polygon.properties.name"
              />
            </template>
          </template>

          <!-- 👨‍⚕️ 服務人員專用：服務點詳細信息 -->
          <template v-if="isServiceProviderObject && selectedFeature.properties.allServicePoints">
            <hr class="my-3" />

            <!-- 服務人員基本信息 -->
            <div class="my-title-xs-gray mb-3">服務人員信息</div>
            <DetailItem label="服務人員身分證" :value="serviceProviderLabel" />
            <DetailItem label="服務日期" :value="serviceDateLabel" />
            <DetailItem label="資料來源" :value="selectedFeature.properties.filename" />
            <DetailItem
              label="服務點位數"
              :value="`${selectedFeature.properties.allServicePoints.length} 個`"
            />

            <!-- 個案列表 -->
            <template v-if="selectedFeature.properties.allServicePoints.length > 0">
              <hr class="my-3" />
              <div class="my-title-xs-gray mb-3">
                個案列表 ({{ selectedFeature.properties.allServicePoints.length }} 個)
              </div>

              <!-- 個案列表表格 -->
              <div class="table-responsive">
                <table class="table table-sm table-hover">
                  <thead class="table-light">
                    <tr>
                      <th style="width: 50px">順序</th>
                      <th style="width: 80px">姓名</th>
                      <th style="width: 100px">時間</th>
                      <th>地址</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(point, index) in selectedFeature.properties.allServicePoints"
                      :key="index"
                      @click="selectServicePoint(point)"
                    >
                      <td class="text-center">
                        <span class="badge bg-primary">{{ point.順序 }}</span>
                      </td>
                      <td class="fw-bold">{{ point.姓名 }}</td>
                      <td class="text-muted">{{ point.時間 }}</td>
                      <td class="text-muted small">{{ point.地址 }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 選中個案的詳細信息（僅顯示指定欄位） -->
              <template v-if="selectedServicePoint">
                <hr class="my-3" />
                <div class="my-title-xs-gray mb-3">
                  個案詳細信息 - {{ selectedServicePoint.姓名 }}
                </div>
                <DetailItem label="案號" :value="selectedServicePoint.案號" />
                <DetailItem
                  label="資料來源"
                  :value="selectedServicePoint.filename || selectedFeature.properties.filename"
                />
                <div class="pb-2">
                  <div class="my-title-xs-gray pb-1">姓名</div>
                  <div class="my-content-sm-black pb-1">
                    <span>
                      {{ selectedServicePoint.姓名 }}
                    </span>
                  </div>
                </div>
                <DetailItem label="身分證字號" :value="selectedServicePoint.身分證字號" />
                <DetailItem label="戶籍地" :value="selectedServicePoint.戶籍地" />
                <DetailItem label="戶籍地址" :value="selectedServicePoint.戶籍地址" />
                <DetailItem label="居住地" :value="selectedServicePoint.居住地" />
                <DetailItem
                  label="居住地址"
                  :value="selectedServicePoint.居住地址 || selectedServicePoint.地址"
                />
              </template>
            </template>
          </template>

          <!-- 📋 服務點 detail + 服務項目列表顯示 -->
          <template v-if="isServiceItemsObject">
            <hr class="my-3" />
            <!-- 服務點資料：僅顯示指定欄位 -->
            <div class="my-title-sm-black mb-2">服務點資料</div>
            <div class="mb-3">
              <div v-if="selectedFeature.properties.detail">
                <DetailItem label="資料來源" :value="selectedFeature.properties.filename" />
                <DetailItem label="案號" :value="selectedFeature.properties.detail.案號" />
                <div class="pb-2">
                  <div class="my-title-xs-gray pb-1">姓名</div>
                  <div class="my-content-sm-black pb-1">
                    <span>
                      {{ selectedFeature.properties.detail.姓名 }}
                    </span>
                  </div>
                </div>
                <DetailItem
                  label="身分證字號"
                  :value="
                    selectedFeature.properties['身分證字號'] ||
                    (Array.isArray(selectedFeature.properties.serviceItems)
                      ? selectedFeature.properties.serviceItems[0]?.['身分證字號']
                      : null) ||
                    (Array.isArray(selectedFeature.properties.service_items)
                      ? selectedFeature.properties.service_items[0]?.['身分證字號']
                      : null) ||
                    ''
                  "
                />
                <DetailItem label="戶籍地" :value="selectedFeature.properties.detail.戶籍地" />
                <DetailItem label="戶籍地址" :value="selectedFeature.properties.detail.戶籍地址" />
                <DetailItem label="居住地" :value="selectedFeature.properties.detail.居住地" />
                <DetailItem label="居住地址" :value="selectedFeature.properties.detail.居住地址" />
              </div>
              <div v-else class="text-muted small">此服務點缺少 detail 資料</div>

              <div class="pb-2">
                <div class="my-title-xs-gray pb-1">
                  服務項目列表 ({{ selectedFeature.properties.serviceItems.length }})
                </div>

                <div v-if="selectedFeature.properties.serviceItems.length > 0" class="pb-1">
                  <div class="table-responsive">
                    <table class="table w-100 mb-0">
                      <thead class="sticky-top my-table-thead">
                        <tr class="text-center text-nowrap">
                          <th class="p-1">
                            <span class="my-title-xs-gray text-nowrap">服務項目代碼</span>
                          </th>
                          <th class="p-1">
                            <span class="my-title-xs-gray text-nowrap">單價</span>
                          </th>
                          <th class="p-1">
                            <span class="my-title-xs-gray text-nowrap">服務時間</span>
                          </th>
                          <th class="p-1">
                            <span class="my-title-xs-gray text-nowrap">總服務時間</span>
                          </th>
                          <!-- <th class="p-1">
                            <span class="my-title-xs-gray text-nowrap">row_id</span>
                          </th> -->
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(item, index) in selectedFeature.properties.serviceItems"
                          :key="item.row_id || index"
                          class="text-center text-nowrap border-bottom"
                        >
                          <td
                            class="border-0 text-nowrap text-truncate p-0"
                            style="max-width: 80px"
                          >
                            <div class="my-content-xs-black px-3 py-2">
                              {{ item.服務項目代碼 }}
                            </div>
                          </td>
                          <td
                            class="border-0 text-nowrap text-truncate p-0"
                            style="max-width: 80px"
                          >
                            <div class="my-content-xs-black px-3 py-2">
                              {{ item.單價 || item.unitPrice }}
                            </div>
                          </td>
                          <td
                            class="border-0 text-nowrap text-truncate p-0"
                            style="max-width: 80px"
                          >
                            <div class="my-content-xs-black px-3 py-2">
                              {{
                                `${item.hour_start}:${(item.min_start || 0).toString().padStart(2, '0')} - ${item.hour_end}:${(item.min_end || 0).toString().padStart(2, '0')}`
                              }}
                            </div>
                          </td>
                          <td
                            class="border-0 text-nowrap text-truncate p-0"
                            style="max-width: 80px"
                          >
                            <div class="my-content-xs-black px-3 py-2">
                              {{ (item.hour_total || 0) > 0 ? `${item.hour_total || 0}h` : ''
                              }}{{ item.min_total || 0 }}m
                            </div>
                          </td>
                          <!-- <td
                            class="border-0 text-nowrap text-truncate p-0"
                            style="max-width: 80px"
                          >
                            <div class="my-content-xs-black px-3 py-2">
                              {{ item.row_id }}
                            </div>
                          </td> -->
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div v-else class="text-muted">
                  <i class="fas fa-info-circle me-2"></i>
                  此服務點沒有服務項目記錄
                </div>
              </div>
            </div>
          </template>

          <!-- ⭐ 路線中心點顯示 -->
          <template v-if="isRouteCenterPointObject">
            <hr class="my-3" />
            <div class="my-title-sm-black mb-3">路線中心點資訊</div>
            <DetailItem label="服務人員身分證" :value="serviceProviderLabel" />
            <DetailItem label="服務日期" :value="serviceDateLabel" />
            <DetailItem label="中心點編號" :value="selectedFeature.properties.centerIndex" />
            <DetailItem label="緯度" :value="selectedFeature.properties.緯度?.toFixed(6)" />
            <DetailItem label="經度" :value="selectedFeature.properties.經度?.toFixed(6)" />

            <hr class="my-2" />
            <div class="my-content-xs-gray">
              <div class="mb-1">
                <i class="fas fa-star me-2 text-warning"></i>
                此點為服務人員路線的中心位置
              </div>
              <div class="mb-1">
                <i class="fas fa-info-circle me-2 text-info"></i>
                中心點座標來自系統計算的路線幾何中心
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 📭 無點擊地圖上物件的空狀態 -->
    <div v-else class="flex-grow-1 d-flex align-items-center justify-content-center">
      <div class="text-center">
        <div class="my-title-md-gray p-3">沒有點擊地圖上的物件</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .my-table-thead {
    border-bottom: 2px solid var(--my-color-gray-300) !important;
  }
</style>
