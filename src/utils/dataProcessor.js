// 新基準中央服務紀錄
export async function loadNewStandardCentralServiceData(layer) {
  try {
    const layerId = layer.layerId;
    const colorName = layer.colorName;

    const filePath = `/long-term-care-web-taichung/data/geojson/${layer.fileName}`;

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

    const geoJsonData = {
      type: 'FeatureCollection',
      features: [],
    };

    // 用於 Bottom Panel 的服務人員資料
    const serviceProviderData = new Map();

    jsonData.forEach((serviceProvider) => {
      // 只處理 1140701 的資料
      if (serviceProvider['服務日期(請輸入7碼)'] !== 1140701) {
        return;
      }

      if (serviceProvider.data && Array.isArray(serviceProvider.data)) {
        // 1. 處理 route 路線（如果存在）
        if (
          serviceProvider.route &&
          serviceProvider.route.features &&
          Array.isArray(serviceProvider.route.features)
        ) {
          serviceProvider.route.features.forEach((routeFeature) => {
            if (routeFeature.geometry && routeFeature.geometry.type === 'LineString') {
              geoJsonData.features.push({
                type: 'Feature',
                geometry: routeFeature.geometry,
                properties: {
                  id: `route_${serviceProvider.服務人員身分證}`,
                  layerId: layerId,
                  layerName: `${layer.layerName}_路線`,
                  name: `服務路線_${serviceProvider.服務人員身分證}`,
                  strokeColor: getComputedStyle(document.documentElement)
                    .getPropertyValue(`--my-color-${colorName}`)
                    .trim(),
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
              });
            }
          });
        }

        // 2. 處理服務點（data 裡面的點）
        const servicePoints = serviceProvider.data.filter((record) => record.datail);

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
                geoJsonData.features.push({
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
                    fillColor: getComputedStyle(document.documentElement)
                      .getPropertyValue(`--my-color-${colorName}`)
                      .trim(),
                    serviceProviderId: serviceProvider.服務人員身分證,
                    routeOrder: index + 1,
                    serviceTime: `${serviceRecord.hour_start}:${serviceRecord.min_start.toString().padStart(2, '0')}`,
                    address: serviceRecord.datail.個案居住地址,
                  },
                });
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
              .getPropertyValue(`--my-color-${colorName}`)
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
            })),
          });
        }
      }
    });

    // 5. 準備表格資料
    const tableData = Array.from(serviceProviderData.values());

    // 6. 統計資料
    const districtCounts = {};
    geoJsonData.features
      .filter((feature) => feature.geometry.type === 'Point')
      .forEach((feature) => {
        // 這裡需要從服務人員資料中獲取鄉鎮區資訊
        const serviceProviderId = feature.properties.serviceProviderId;
        const serviceProvider = serviceProviderData.get(serviceProviderId);
        if (serviceProvider && serviceProvider.allServicePoints.length > 0) {
          const district = serviceProvider.allServicePoints[0].鄉鎮區;
          if (district) {
            districtCounts[district] = (districtCounts[district] || 0) + 1;
          }
        }
      });

    const districtCount = Object.entries(districtCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const summaryData = {
      totalCount: geoJsonData.features.filter((f) => f.geometry.type === 'Point').length,
      routeCount: geoJsonData.features.filter((f) => f.geometry.type === 'LineString').length,
      districtCount: districtCount,
    };

    return {
      geoJsonData,
      tableData,
      summaryData,
    };
  } catch (error) {
    console.error('❌ 數據載入失敗:', error);
    throw error;
  }
}
