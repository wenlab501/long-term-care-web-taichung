/**
 * dataProcessor.js
 *
 * Purpose:
 * - Load and transform data for the "新基準中央服務紀錄" feature set.
 * - Returns geojson, table data, and summary stats; color resolution is deferred to store.
 *
 * Notes:
 * - Documentation-only refactor for maintainability; logic unchanged.
 */
// 注意：getColorForServiceProvider 函數已移除
// 現在顏色分配統一在 dataStore.js 中處理

// 注意：getUnifiedLayerColor 函數已移除
// 現在顏色分配統一在 dataStore.js 中處理

/**
 * 新基準中央服務紀錄數據加載函數
 * 處理長照服務人員的服務記錄，包含路線、服務點和服務項目
 * @param {Object} layer - 圖層配置物件
 * @param {string|null} dateFilter - 日期篩選器 (格式: YYYYMMDD)
 * @returns {Promise<Object>} 包含 GeoJSON 數據和表格數據的物件
 */
export async function loadNewStandardCentralServiceData(layer, dateFilter = null) {
  try {
    const layerId = layer.layerId;

    const filePath = `/long-term-care-web-taichung/data/json/${layer.fileName}`;

    const response = await fetch(filePath);

    if (!response.ok) {
      console.error('HTTP 錯誤:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonData = await response.json();

    console.log('📅 載入服務紀錄數據，日期篩選:', dateFilter);

    // 按服務人員分組的圖層數據
    const serviceProviderLayers = new Map();
    const allGeoJsonData = {
      type: 'FeatureCollection',
      features: [],
    };

    // 用於 Bottom Panel 的服務人員資料
    const serviceProviderData = new Map();

    jsonData.forEach((serviceProvider) => {
      // 日期篩選邏輯
      if (dateFilter) {
        // 如果有日期篩選，只處理符合條件的資料
        const filterValue = parseInt(dateFilter);
        const serviceDate = serviceProvider['服務日期(請輸入7碼)'];
        console.log('🔍 日期篩選檢查:', {
          filterValue,
          serviceDate,
          serviceDateType: typeof serviceDate,
          matches: serviceDate === filterValue,
        });

        if (serviceDate !== filterValue) {
          return;
        }
      } else {
        // 如果沒有日期篩選，預設只處理 1140701 的資料
        if (serviceProvider['服務日期(請輸入7碼)'] !== 1140701) {
          return;
        }
      }

      // 為每個服務人員創建獨立的圖層
      const serviceProviderId = serviceProvider.服務人員身分證;

      // 注意：不在這裡分配顏色，留給 dataStore.js 統一處理
      // 使用臨時的預設顏色，稍後會被 dataStore.js 覆蓋
      const unifiedColor = 'category20b-1'; // 臨時顏色，稍後會被覆蓋
      if (!serviceProviderLayers.has(serviceProviderId)) {
        serviceProviderLayers.set(serviceProviderId, {
          type: 'FeatureCollection',
          features: [],
        });
      }

      if (serviceProvider.service_points && Array.isArray(serviceProvider.service_points)) {
        // 1. 處理 service_points_routes 路線（如果存在）
        if (
          serviceProvider.service_points_routes &&
          Array.isArray(serviceProvider.service_points_routes)
        ) {
          serviceProvider.service_points_routes.forEach((routeCollection) => {
            if (routeCollection.features && Array.isArray(routeCollection.features)) {
              routeCollection.features.forEach((routeFeature) => {
                if (routeFeature.geometry && routeFeature.geometry.type === 'LineString') {
                  const routeFeatureData = {
                    type: 'Feature',
                    geometry: routeFeature.geometry,
                    properties: {
                      id: `route_${serviceProvider.服務人員身分證}`,
                      layerId: layerId,
                      layerName: `${layer.layerName}_路線`,
                      name: `服務路線_${serviceProvider.服務人員身分證}`,
                      strokeColor: unifiedColor, // 使用顏色名稱，方便統一處理
                      routeColor: unifiedColor, // 添加routeColor屬性，使用統一的顏色
                      strokeWidth: 3,
                      strokeOpacity: 0.8,
                      serviceProviderId: serviceProvider.服務人員身分證,
                      serviceDate: serviceProvider['服務日期(請輸入7碼)'],
                      pointCount: routeFeature.geometry.coordinates.length,
                      distance: routeFeature.properties?.summary?.distance || 0,
                      duration: routeFeature.properties?.summary?.duration || 0,
                      segments: routeFeature.properties?.segments?.length || 0,
                      ...routeFeature.properties,
                    },
                  };

                  // 添加到對應的服務人員圖層
                  serviceProviderLayers.get(serviceProviderId).features.push(routeFeatureData);
                  // 也添加到總圖層
                  allGeoJsonData.features.push(routeFeatureData);
                }
              });
            }
          });
        }

        // 2. 處理 service_points_routes_center 中心點（如果存在）
        if (
          serviceProvider.service_points_routes_center &&
          Array.isArray(serviceProvider.service_points_routes_center) &&
          serviceProvider.service_points_routes_center.length > 0
        ) {
          const routeTimesArray = Array.isArray(serviceProvider.service_points_routes_time)
            ? serviceProvider.service_points_routes_time
            : [];
          serviceProvider.service_points_routes_center.forEach((centerCoords, index) => {
            if (Array.isArray(centerCoords) && centerCoords.length >= 2) {
              const [lng, lat] = centerCoords; // GeoJSON 格式：[經度, 緯度]

              // 驗證座標有效性
              if (
                typeof lng === 'number' &&
                typeof lat === 'number' &&
                !isNaN(lng) &&
                !isNaN(lat) &&
                lat >= -90 &&
                lat <= 90 &&
                lng >= -180 &&
                lng <= 180
              ) {
                // 對應該路線中心點的交通時間（依序對應 service_points_routes_time）
                const timeEntry = routeTimesArray[index] || null;
                const timeMinutes = (() => {
                  if (timeEntry && typeof timeEntry.time_interval === 'number') {
                    return timeEntry.time_interval;
                  }
                  const h = timeEntry?.hour_interval ?? null;
                  const m = timeEntry?.min_interval ?? null;
                  if (typeof h === 'number' && typeof m === 'number') {
                    return h * 60 + m;
                  }
                  return null; // 若無資料則返回 null
                })();

                const timeLabel = (() => {
                  if (typeof timeMinutes === 'number' && !isNaN(timeMinutes)) {
                    const hours = Math.floor(timeMinutes / 60);
                    const minutes = timeMinutes % 60;
                    return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
                  }
                  return 'N/A';
                })();

                const routeCenterFeatureData = {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [lng, lat],
                  },
                  properties: {
                    id: `route_center_${serviceProvider.服務人員身分證}_${index}`,
                    layerId: layerId,
                    layerName: `${layer.layerName}_路線中心點`,
                    name: `路線中心點_${serviceProvider.服務人員身分證}_${index + 1}`,
                    type: 'route-center-point', // 特殊類型標記
                    fillColor: unifiedColor, // 使用顏色名稱
                    routeColor: unifiedColor,
                    serviceProviderId: serviceProvider.服務人員身分證,
                    serviceDate: serviceProvider['服務日期(請輸入7碼)'],
                    centerIndex: index + 1,
                    緯度: lat,
                    經度: lng,
                    // 新增：於路線中心點顯示交通時間（依序對應 route_time）
                    traffic_time_minutes: typeof timeMinutes === 'number' ? timeMinutes : undefined,
                    traffic_time_label: timeLabel,
                  },
                };

                // 添加到對應的服務人員圖層
                serviceProviderLayers.get(serviceProviderId).features.push(routeCenterFeatureData);
                // 也添加到總圖層
                allGeoJsonData.features.push(routeCenterFeatureData);
              } else {
                console.warn(
                  `🚫 無效的路線中心點座標: serviceProvider=${serviceProvider.服務人員身分證}, index=${index}, coords=[${lng}, ${lat}]`
                );
              }
            }
          });
        }

        // 3. 處理服務點（service_points 裡面的點）
        const servicePoints = serviceProvider.service_points.filter((record) => record.detail);

        if (servicePoints.length > 0) {
          // 按服務時間排序
          servicePoints.sort((a, b) => {
            const timeA = a.hour_start + a.min_start / 60;
            const timeB = b.hour_start + b.min_start / 60;
            return timeA - timeB;
          });

          // 3. 在地圖上繪製有座標的服務點
          servicePoints.forEach((serviceRecord, index) => {
            if (serviceRecord.detail.Lat && serviceRecord.detail.Lon) {
              const lat = parseFloat(serviceRecord.detail.Lat);
              const lon = parseFloat(serviceRecord.detail.Lon);

              if (!isNaN(lat) && !isNaN(lon)) {
                const pointFeatureData = {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [lon, lat],
                  },
                  properties: {
                    id: `point_${serviceProvider.服務人員身分證}_${index}`,
                    layerId: layerId,
                    layerName: layer.layerName,
                    name: serviceRecord.detail.姓名,
                    fillColor: unifiedColor, // 使用顏色名稱，方便統一處理
                    serviceProviderId: serviceProvider.服務人員身分證,
                    routeOrder: index + 1,
                    serviceTime: `${serviceRecord.hour_start}:${serviceRecord.min_start.toString().padStart(2, '0')}`,
                    address: serviceRecord.detail.個案居住地址,
                    // 添加 service_items 資料
                    service_items: serviceRecord.service_items || [],
                    service_items_count: Array.isArray(serviceRecord.service_items)
                      ? serviceRecord.service_items.length
                      : 0,
                    // 添加其他原始資料欄位
                    編號: serviceRecord.detail.編號,
                    姓名: serviceRecord.detail.姓名,
                    性別: serviceRecord.detail.性別,
                    個案戶籍縣市: serviceRecord.detail.個案戶籍縣市,
                    鄉鎮區: serviceRecord.detail.鄉鎮區,
                    里別: serviceRecord.detail.里別,
                    個案戶籍地址: serviceRecord.detail.個案戶籍地址,
                    個案居住縣市: serviceRecord.detail.個案居住縣市,
                    hour_start: serviceRecord.hour_start,
                    min_start: serviceRecord.min_start,
                    hour_end: serviceRecord.hour_end,
                    min_end: serviceRecord.min_end,
                    time_total: serviceRecord.time_total,
                    // 交通時間與完整 detail 物件
                    hour_traffic: serviceRecord.hour_traffic || 0,
                    min_traffic: serviceRecord.min_traffic || 0,
                    time_traffic:
                      serviceRecord.time_traffic ||
                      (serviceRecord.hour_traffic || 0) * 60 + (serviceRecord.min_traffic || 0),
                    detail: serviceRecord.detail,
                  },
                };

                // 添加到對應的服務人員圖層
                serviceProviderLayers.get(serviceProviderId).features.push(pointFeatureData);
                // 也添加到總圖層
                allGeoJsonData.features.push(pointFeatureData);
              }
            }
          });

          // 4. 為 Bottom Panel 準備服務人員資料
          const firstService = servicePoints[0];
          const lastService = servicePoints[servicePoints.length - 1];

          // 找到第一個有座標的服務點作為地圖定位點
          const firstPointWithCoords = servicePoints.find(
            (point) => point.detail.Lat && point.detail.Lon
          );

          serviceProviderData.set(serviceProvider.服務人員身分證, {
            '#': serviceProviderData.size + 1,
            color: getComputedStyle(document.documentElement)
              .getPropertyValue(`--my-color-${unifiedColor}`)
              .trim(),
            服務人員身分證: serviceProvider.服務人員身分證,
            服務日期: serviceProvider['服務日期(請輸入7碼)'],
            服務點位數: serviceProvider.service_points_count || servicePoints.length,
            開始時間: `${serviceProvider.hour_start}:${serviceProvider.min_start.toString().padStart(2, '0')}`,
            結束時間: `${serviceProvider.hour_end}:${serviceProvider.min_end.toString().padStart(2, '0')}`,
            總服務時間: `${serviceProvider.hour_total}h${serviceProvider.min_total}m`,
            總時間分鐘: serviceProvider.time_total || 0,
            交通時間: (() => {
              // 計算服務人員的總交通時間（所有服務點的交通時間總和）
              const totalTrafficMinutes = servicePoints.reduce((total, point) => {
                return total + (point.hour_traffic || 0) * 60 + (point.min_traffic || 0);
              }, 0);
              const hours = Math.floor(totalTrafficMinutes / 60);
              const minutes = totalTrafficMinutes % 60;
              return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
            })(),
            交通時間分鐘: servicePoints.reduce((total, point) => {
              return total + (point.hour_traffic || 0) * 60 + (point.min_traffic || 0);
            }, 0),
            服務數量: servicePoints.reduce(
              (total, point) => total + (point.service_items_count || 0),
              0
            ),
            第一個服務點: firstService.detail.姓名,
            最後一個服務點: lastService.detail.姓名,
            // 用於地圖定位的第一個服務點
            firstServicePoint: firstPointWithCoords
              ? {
                  lat: parseFloat(firstPointWithCoords.detail.Lat),
                  lon: parseFloat(firstPointWithCoords.detail.Lon),
                  name: firstPointWithCoords.detail.姓名,
                  address: firstPointWithCoords.detail.個案居住地址,
                  time: `${firstPointWithCoords.hour_start}:${firstPointWithCoords.min_start.toString().padStart(2, '0')}`,
                }
              : null,
            // 用於 Right Panel 的所有服務點
            allServicePoints: servicePoints.map((point, index) => ({
              順序: index + 1,
              姓名: point.detail.姓名,
              地址: point.detail.個案居住地址,
              時間: `${point.hour_start}:${point.min_start.toString().padStart(2, '0')}`,
              編號: point.detail.編號,
              性別: point.detail.性別,
              個案戶籍縣市: point.detail.個案戶籍縣市,
              鄉鎮區: point.detail.鄉鎮區,
              里別: point.detail.里別,
              個案戶籍地址: point.detail.個案戶籍地址,
              個案居住縣市: point.detail.個案居住縣市,
              緯度: point.detail.Lat ? parseFloat(point.detail.Lat) : null,
              經度: point.detail.Lon ? parseFloat(point.detail.Lon) : null,
              // 添加時間相關欄位
              hour_start: point.hour_start,
              min_start: point.min_start,
              hour_end: point.hour_end,
              min_end: point.min_end,
              service_items_count:
                point.service_items_count ||
                (Array.isArray(point.service_items) ? point.service_items.length : 0),
              service_items: point.service_items || [],
              總服務時間分鐘: point.time_total || 0,
              交通時間: `${point.hour_traffic || 0}h${point.min_traffic || 0}m`,
              交通時間分鐘: (point.hour_traffic || 0) * 60 + (point.min_traffic || 0),
              hour_traffic: point.hour_traffic || 0,
              min_traffic: point.min_traffic || 0,
            })),
          });
        }
      }
    });

    // 5. 準備表格資料
    const tableData = Array.from(serviceProviderData.values());

    // 6. 統計資料
    const districtCounts = {};
    let validPointCount = 0;

    allGeoJsonData.features
      .filter((feature) => feature.geometry.type === 'Point')
      .forEach((feature) => {
        // 這裡需要從服務人員資料中獲取鄉鎮區資訊
        const serviceProviderId = feature.properties.serviceProviderId;
        const serviceProvider = serviceProviderData.get(serviceProviderId);
        if (serviceProvider && serviceProvider.allServicePoints.length > 0) {
          const district = serviceProvider.allServicePoints[0].鄉鎮區;
          if (district && typeof district === 'string' && district.trim() !== '') {
            districtCounts[district] = (districtCounts[district] || 0) + 1;
            validPointCount++;
          }
        }
      });

    // 如果沒有有效的行政區資料，創建一個預設的統計
    if (Object.keys(districtCounts).length === 0) {
      console.warn('[loadNewStandardCentralServiceData] 沒有找到有效的行政區資料，使用預設統計');
      districtCounts['未知區域'] = validPointCount || 1;
    }

    const districtCount = Object.entries(districtCounts)
      .map(([name, count]) => ({
        name: name || '未知區域',
        count: Math.max(0, count || 0), // 確保計數不會是負數
      }))
      .filter((item) => item.count > 0) // 過濾掉計數為0的項目
      .sort((a, b) => b.count - a.count);

    const summaryData = {
      totalCount: allGeoJsonData.features.filter((f) => f.geometry.type === 'Point').length,
      routeCount: allGeoJsonData.features.filter((f) => f.geometry.type === 'LineString').length,
      districtCount: districtCount,
    };

    // 將服務人員圖層轉換為陣列格式
    const serviceProviderLayersArray = Array.from(serviceProviderLayers.entries()).map(
      ([serviceProviderId, geoJsonData]) => {
        // 為每個服務人員準備 service_points 的 tableData
        const serviceProviderInfo = serviceProviderData.get(serviceProviderId);
        const servicePointsTableData = serviceProviderInfo
          ? serviceProviderInfo.allServicePoints.map((point, index) => {
              // 從 GeoJSON features 中找到對應的 service_items
              let serviceItems = [];
              if (geoJsonData && geoJsonData.features) {
                const servicePointFeature = geoJsonData.features.find(
                  (feature) =>
                    feature.properties &&
                    (feature.properties.編號 === point.編號 ||
                      feature.properties.姓名 === point.姓名)
                );
                if (servicePointFeature && servicePointFeature.properties.service_items) {
                  serviceItems = servicePointFeature.properties.service_items;
                }
              }

              return {
                '#': index + 1,
                id: `point_${serviceProviderId}_${index}`, // 添加與 GeoJSON feature 一致的 ID
                姓名: point.姓名,
                個案居住地址: point.地址,
                時間: point.時間,
                服務項目代碼: point.服務項目代碼 || 'N/A',
                順序: point.順序,
                緯度: point.緯度,
                經度: point.經度,
                編號: point.編號,
                性別: point.性別,
                個案戶籍縣市: point.個案戶籍縣市,
                鄉鎮區: point.鄉鎮區,
                里別: point.里別,
                個案戶籍地址: point.個案戶籍地址,
                個案居住縣市: point.個案居住縣市,
                // 添加時間相關欄位
                hour_start: point.hour_start,
                min_start: point.min_start,
                hour_end: point.hour_end,
                min_end: point.min_end,
                // 交通時間欄位
                交通時間: point.交通時間,
                交通時間分鐘: point.交通時間分鐘,
                hour_traffic: point.hour_traffic,
                min_traffic: point.min_traffic,
                // 原始 detail 物件，方便右側面板顯示
                detail: {
                  編號: point.編號,
                  姓名: point.姓名,
                  性別: point.性別,
                  個案戶籍縣市: point.個案戶籍縣市,
                  鄉鎮區: point.鄉鎮區,
                  里別: point.里別,
                  個案戶籍地址: point.個案戶籍地址,
                  個案居住縣市: point.個案居住縣市,
                  個案居住地址: point.地址,
                  Lat: point.緯度,
                  Lon: point.經度,
                },
                // 添加 service_items
                service_items: serviceItems,
                service_items_count: Array.isArray(serviceItems) ? serviceItems.length : 0,
                color: serviceProviderInfo.color,
              };
            })
          : [];

        // 獲取原始服務人員數據以取得 service_points_count
        const originalServiceProvider = jsonData.find(
          (sp) => sp.服務人員身分證 === serviceProviderId
        );

        return {
          serviceProviderId,
          layerName: serviceProviderId, // 直接使用服務人員身分證作為圖層名稱
          geoJsonData,
          tableData: servicePointsTableData, // 添加 service_points 的表格資料
          pointCount: geoJsonData.features.filter((f) => f.geometry.type === 'Point').length,
          routeCount: geoJsonData.features.filter((f) => f.geometry.type === 'LineString').length,
          servicePointsCount: originalServiceProvider?.service_points_count || 0, // 添加原始的 service_points_count
        };
      }
    );

    return {
      geoJsonData: allGeoJsonData,
      tableData,
      summaryData,
      serviceProviderLayers: serviceProviderLayersArray,
    };
  } catch (error) {
    console.error('❌ 數據載入失敗:', error);
    throw error;
  }
}
