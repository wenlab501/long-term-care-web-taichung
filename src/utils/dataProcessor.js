// tab20 顏色陣列
const TAB20_COLORS = [
  'tab20-1',
  'tab20-2',
  'tab20-3',
  'tab20-4',
  'tab20-5',
  'tab20-6',
  'tab20-7',
  'tab20-8',
  'tab20-9',
  'tab20-10',
  'tab20-11',
  'tab20-12',
  'tab20-13',
  'tab20-14',
  'tab20-15',
  'tab20-16',
  'tab20-17',
  'tab20-18',
  'tab20-19',
  'tab20-20',
];

// 根據服務人員ID生成一致的顏色（與dataStore.js保持一致）
function getColorForServiceProvider(serviceProviderId, dateStr = null, colorMap = null) {
  // 如果有colorMap且包含該服務人員的顏色，使用colorMap
  if (colorMap && colorMap.has && colorMap.has(serviceProviderId)) {
    return colorMap.get(serviceProviderId);
  }

  // 使用確定性的哈希算法，確保同一個ID總是得到相同顏色
  let hash = 0;
  // 如果有日期，將日期也加入哈希計算
  const combinedId = dateStr ? `${serviceProviderId}_${dateStr}` : serviceProviderId;
  for (let i = 0; i < combinedId.length; i++) {
    hash = (hash << 5) - hash + combinedId.charCodeAt(i);
    hash = hash & hash; // 轉換為32位整數
  }
  const colorIndex = Math.abs(hash) % TAB20_COLORS.length;
  return TAB20_COLORS[colorIndex];
}

// 統一的顏色獲取函數 - 確保所有圖層物件使用相同顏色
function getUnifiedLayerColor(serviceProviderId, colorMap, dateStr = null) {
  // 優先級：colorMap > 服務人員ID生成的顏色
  if (colorMap && colorMap.has && colorMap.has(serviceProviderId)) {
    return colorMap.get(serviceProviderId);
  }

  // 如果沒有colorMap，使用服務人員ID生成的顏色
  return getColorForServiceProvider(serviceProviderId, dateStr);
}

// 新基準中央服務紀錄
export async function loadNewStandardCentralServiceData(layer, dateFilter = null, colorMap = null) {
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

      // 使用統一的顏色獲取函數 - 確保所有物件使用相同顏色
      const unifiedColor = getUnifiedLayerColor(serviceProviderId, colorMap, dateFilter);
      if (!serviceProviderLayers.has(serviceProviderId)) {
        serviceProviderLayers.set(serviceProviderId, {
          type: 'FeatureCollection',
          features: [],
        });
      }

      if (serviceProvider.service_points && Array.isArray(serviceProvider.service_points)) {
        // 1. 處理 route 路線（如果存在）
        if (
          serviceProvider.route &&
          serviceProvider.route.features &&
          Array.isArray(serviceProvider.route.features)
        ) {
          serviceProvider.route.features.forEach((routeFeature) => {
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

        // 2. 處理服務點（service_points 裡面的點）
        const servicePoints = serviceProvider.service_points.filter((record) => record.datail);

        if (servicePoints.length > 0) {
          // 按服務時間排序
          servicePoints.sort((a, b) => {
            const timeA = a.hour_start + a.min_start / 60;
            const timeB = b.hour_start + b.min_start / 60;
            return timeA - timeB;
          });

          // 3. 在地圖上繪製有座標的服務點
          servicePoints.forEach((serviceRecord, index) => {
            if (serviceRecord.datail.Lat && serviceRecord.datail.Lon) {
              const lat = parseFloat(serviceRecord.datail.Lat);
              const lon = parseFloat(serviceRecord.datail.Lon);

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
                    name: serviceRecord.datail.姓名,
                    fillColor: unifiedColor, // 使用顏色名稱，方便統一處理
                    serviceProviderId: serviceProvider.服務人員身分證,
                    routeOrder: index + 1,
                    serviceTime: `${serviceRecord.hour_start}:${serviceRecord.min_start.toString().padStart(2, '0')}`,
                    address: serviceRecord.datail.個案居住地址,
                    // 添加 service_items 資料
                    service_items: serviceRecord.service_items || [],
                    // 添加其他原始資料欄位
                    編號: serviceRecord.datail.編號,
                    姓名: serviceRecord.datail.姓名,
                    性別: serviceRecord.datail.性別,
                    個案戶籍縣市: serviceRecord.datail.個案戶籍縣市,
                    鄉鎮區: serviceRecord.datail.鄉鎮區,
                    里別: serviceRecord.datail.里別,
                    個案戶籍地址: serviceRecord.datail.個案戶籍地址,
                    個案居住縣市: serviceRecord.datail.個案居住縣市,
                    hour_start: serviceRecord.hour_start,
                    min_start: serviceRecord.min_start,
                    hour_end: serviceRecord.hour_end,
                    min_end: serviceRecord.min_end,
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
            (point) => point.datail.Lat && point.datail.Lon
          );

          serviceProviderData.set(serviceProvider.服務人員身分證, {
            '#': serviceProviderData.size + 1,
            color: getComputedStyle(document.documentElement)
              .getPropertyValue(`--my-color-${unifiedColor}`)
              .trim(),
            服務人員身分證: serviceProvider.服務人員身分證,
            服務日期: serviceProvider['服務日期(請輸入7碼)'],
            服務點位數: servicePoints.length,
            開始時間: `${firstService.hour_start}:${firstService.min_start.toString().padStart(2, '0')}`,
            結束時間: `${lastService.hour_start}:${lastService.min_start.toString().padStart(2, '0')}`,
            第一個服務點: firstService.datail.姓名,
            最後一個服務點: lastService.datail.姓名,
            // 用於地圖定位的第一個服務點
            firstServicePoint: firstPointWithCoords
              ? {
                  lat: parseFloat(firstPointWithCoords.datail.Lat),
                  lon: parseFloat(firstPointWithCoords.datail.Lon),
                  name: firstPointWithCoords.datail.姓名,
                  address: firstPointWithCoords.datail.個案居住地址,
                  time: `${firstPointWithCoords.hour_start}:${firstPointWithCoords.min_start.toString().padStart(2, '0')}`,
                }
              : null,
            // 用於 Right Panel 的所有服務點
            allServicePoints: servicePoints.map((point, index) => ({
              順序: index + 1,
              姓名: point.datail.姓名,
              地址: point.datail.個案居住地址,
              時間: `${point.hour_start}:${point.min_start.toString().padStart(2, '0')}`,
              編號: point.datail.編號,
              性別: point.datail.性別,
              個案戶籍縣市: point.datail.個案戶籍縣市,
              鄉鎮區: point.datail.鄉鎮區,
              里別: point.datail.里別,
              個案戶籍地址: point.datail.個案戶籍地址,
              個案居住縣市: point.datail.個案居住縣市,
              緯度: point.datail.Lat ? parseFloat(point.datail.Lat) : null,
              經度: point.datail.Lon ? parseFloat(point.datail.Lon) : null,
              // 添加時間相關欄位
              hour_start: point.hour_start,
              min_start: point.min_start,
              hour_end: point.hour_end,
              min_end: point.min_end,
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
                // 添加 service_items
                service_items: serviceItems,
                color: serviceProviderInfo.color,
              };
            })
          : [];

        return {
          serviceProviderId,
          layerName: serviceProviderId, // 直接使用服務人員身分證作為圖層名稱
          geoJsonData,
          tableData: servicePointsTableData, // 添加 service_points 的表格資料
          pointCount: geoJsonData.features.filter((f) => f.geometry.type === 'Point').length,
          routeCount: geoJsonData.features.filter((f) => f.geometry.type === 'LineString').length,
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
