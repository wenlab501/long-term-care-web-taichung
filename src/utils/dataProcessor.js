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

    let id = 1;

    // 遍歷所有服務人員的資料，只處理特定日期的資料
    jsonData.forEach((serviceProvider) => {
      // 只處理服務日期為 1140701 的資料
      if (serviceProvider['服務日期(請輸入7碼)'] !== 1140701) {
        return; // 跳過非目標日期的資料
      }

      if (serviceProvider.data && Array.isArray(serviceProvider.data)) {
        let servicePoints = []; // 將 servicePoints 移到外層作用域

        // 檢查是否有 route 欄位包含路線幾何資料
        if (
          serviceProvider.route &&
          serviceProvider.route.features &&
          Array.isArray(serviceProvider.route.features)
        ) {
          // 使用 route 欄位中的 features 來繪製路線和座標點
          serviceProvider.route.features.forEach((routeFeature) => {
            if (routeFeature.geometry && routeFeature.geometry.type === 'LineString') {
              // 繪製路線
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
                  ...routeFeature.properties, // 包含原始 route feature 的屬性
                },
              });

              // 繪製路線上的每個座標點
              routeFeature.geometry.coordinates.forEach((coordinate, index) => {
                const [lng, lat] = coordinate;

                const propertyData = {
                  座標順序: index + 1,
                  經度: lng,
                  緯度: lat,
                  服務人員身分證: serviceProvider.服務人員身分證,
                  服務日期: serviceProvider['服務日期(請輸入7碼)'],
                };

                const popupData = {
                  name: `路線點位 ${index + 1}`,
                  coordinate: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                  order: index + 1,
                };

                const tableData = {
                  '#': id,
                  color: getComputedStyle(document.documentElement)
                    .getPropertyValue(`--my-color-${colorName}`)
                    .trim(),
                  座標順序: index + 1,
                  經度: lng.toFixed(6),
                  緯度: lat.toFixed(6),
                  服務人員身分證: serviceProvider.服務人員身分證,
                };

                geoJsonData.features.push({
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [lng, lat],
                  },
                  properties: {
                    id: id,
                    layerId: layerId,
                    layerName: layer.layerName,
                    name: `路線點位 ${index + 1}`,
                    fillColor: getComputedStyle(document.documentElement)
                      .getPropertyValue(`--my-color-${colorName}`)
                      .trim(),
                    propertyData: propertyData,
                    popupData: popupData,
                    tableData: tableData,
                    serviceProviderId: serviceProvider.服務人員身分證,
                    routeOrder: index + 1,
                    isRoutePoint: true, // 標記這是路線點位
                  },
                });

                id++;
              });
            }
          });
        } else {
          // 如果沒有 route 欄位，則根據服務時間生成路線
          const routeCoordinates = [];

          // 收集所有服務點位並按時間排序
          serviceProvider.data.forEach((serviceRecord) => {
            if (serviceRecord.datail && serviceRecord.datail.Lat && serviceRecord.datail.Lon) {
              const lat = parseFloat(serviceRecord.datail.Lat);
              const lon = parseFloat(serviceRecord.datail.Lon);

              if (!isNaN(lat) && !isNaN(lon)) {
                // 計算時間（小時 + 分鐘/60）
                const startTime = serviceRecord.hour_start + serviceRecord.min_start / 60;

                servicePoints.push({
                  lat,
                  lon,
                  startTime,
                  serviceRecord,
                  coordinates: [lon, lat],
                });
              }
            }
          });

          // 按時間排序服務點位
          servicePoints.sort((a, b) => a.startTime - b.startTime);

          // 生成路線座標
          servicePoints.forEach((point) => {
            routeCoordinates.push(point.coordinates);
          });

          // 如果有路線資料，創建路線 Feature
          if (routeCoordinates.length > 1) {
            geoJsonData.features.push({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates,
              },
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
                pointCount: routeCoordinates.length,
              },
            });
          }
        }

        // 為每個服務點位創建點 Feature
        servicePoints.forEach((point, index) => {
          const propertyData = {
            編號: point.serviceRecord.datail.編號,
            姓名: point.serviceRecord.datail.姓名,
            性別: point.serviceRecord.datail.性別,
            個案戶籍縣市: point.serviceRecord.datail.個案戶籍縣市,
            鄉鎮區: point.serviceRecord.datail.鄉鎮區,
            里別: point.serviceRecord.datail.里別,
            個案戶籍地址: point.serviceRecord.datail.個案戶籍地址,
            個案居住縣市: point.serviceRecord.datail.個案居住縣市,
            個案居住地址: point.serviceRecord.datail.個案居住地址,
            服務時間: `${point.serviceRecord.hour_start}:${point.serviceRecord.min_start.toString().padStart(2, '0')}`,
            路線順序: index + 1,
          };

          const popupData = {
            name: point.serviceRecord.datail.姓名,
            serviceTime: `${point.serviceRecord.hour_start}:${point.serviceRecord.min_start.toString().padStart(2, '0')}`,
            routeOrder: index + 1,
          };

          const tableData = {
            '#': id,
            color: getComputedStyle(document.documentElement)
              .getPropertyValue(`--my-color-${colorName}`)
              .trim(),
            姓名: point.serviceRecord.datail.姓名,
            個案居住地址: point.serviceRecord.datail.個案居住地址,
            服務時間: `${point.serviceRecord.hour_start}:${point.serviceRecord.min_start.toString().padStart(2, '0')}`,
            路線順序: index + 1,
          };

          geoJsonData.features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: point.coordinates,
            },
            properties: {
              id: id,
              layerId: layerId,
              layerName: layer.layerName,
              name: point.serviceRecord.datail.姓名,
              fillColor: getComputedStyle(document.documentElement)
                .getPropertyValue(`--my-color-${colorName}`)
                .trim(),
              propertyData: propertyData,
              popupData: popupData,
              tableData: tableData,
              serviceProviderId: serviceProvider.服務人員身分證,
              routeOrder: index + 1,
            },
          });

          id++;
        });
      }
    });

    // 包含為表格量身打造的數據陣列
    const tableData = geoJsonData.features
      .filter((feature) => feature.geometry.type === 'Point')
      .map((feature) => ({
        ...feature.properties.tableData,
      }));

    // 統計各行政區的數量
    const districtCounts = {};
    geoJsonData.features
      .filter((feature) => feature.geometry.type === 'Point')
      .forEach((feature) => {
        const district = feature.properties.propertyData.鄉鎮區;
        if (district) {
          districtCounts[district] = (districtCounts[district] || 0) + 1;
        }
      });

    // 轉換為陣列格式並排序
    const districtCount = Object.entries(districtCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // 按數量降序排列

    // 包含摘要資訊
    const summaryData = {
      totalCount: geoJsonData.features.filter((f) => f.geometry.type === 'Point').length,
      routeCount: geoJsonData.features.filter((f) => f.geometry.type === 'LineString').length,
      districtCount: districtCount,
    };

    return {
      geoJsonData, // 包含原始且完整的 GeoJSON 數據
      tableData, // 包含為表格量身打造的數據陣列
      summaryData, // 包含摘要資訊
    };
  } catch (error) {
    console.error('❌ 數據載入失敗:', error);
    throw error;
  }
}

// 社區整體照顧服務體系C級單位

// 社區照顧關懷據點辦理社區喘息服務(C+單位)

// 公辦民營老人福利機構
export async function loadPublicElderlyWelfareInstitutionData(layer) {
  try {
    const layerId = layer.layerId;
    const colorName = layer.colorName;

    const filePath = `/long-term-care-web-taichung/data/csv/${layer.fileName}`;

    const response = await fetch(filePath);

    if (!response.ok) {
      console.error('HTTP 錯誤:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();

    // 將完整的 CSV 文字內容，首先按換行符號('\n')分割成陣列的每一行
    // 然後對每一行再用逗號(',')分割成欄位，最終形成一個二維陣列
    const rows = csvText.split('\n').map((row) => row.split('\t'));

    console.log('rows', rows);

    // 取得二維陣列的第一行(rows[0])作為標頭，並對每個標頭使用 trim() 去除前後可能存在的空白字元
    const headers = rows[0].map((h) => h.trim());

    const headerIndices = {
      機構名稱: headers.indexOf('機構名稱'),
      受託單位: headers.indexOf('受託單位'),
      地址: headers.indexOf('地址'),
      聯絡電話: headers.indexOf('聯絡電話'),
      連結網址: headers.indexOf('連結網址'),
      收住床數: headers.indexOf('收住床數'),
      服務對象: headers.indexOf('服務對象'),
      收費標準: headers.indexOf('收費標準'),
      lat: headers.indexOf('lat'),
      lon: headers.indexOf('lon'),
    };

    const geoJsonData = {
      type: 'FeatureCollection',
      features: rows
        .slice(1) // 使用 .slice(1) 方法，從索引 1 開始提取所有元素，即跳過第一行(標頭)
        .map((row, index) => {
          const lat = parseFloat(row[headerIndices.lat]);
          const lon = parseFloat(row[headerIndices.lon]);

          const id = index + 1;

          if (isNaN(lat) || isNaN(lon)) {
            console.warn(`第 ${id} 行 ${row[headerIndices.address]} 的座標無效:`, {
              lat: row[headerIndices.lat],
              lon: row[headerIndices.lon],
            });
            return null;
          }

          const propertyData = {
            機構名稱: row[headerIndices.機構名稱],
            受託單位: row[headerIndices.受託單位],
            地址: row[headerIndices.地址],
            聯絡電話: row[headerIndices.聯絡電話],
            連結網址: row[headerIndices.連結網址],
            收住床數: row[headerIndices.收住床數],
            服務對象: row[headerIndices.服務對象],
            收費標準: row[headerIndices.收費標準],
          };

          const popupData = {
            name: row[headerIndices.機構名稱],
          };

          const tableData = {
            '#': id,
            color: getComputedStyle(document.documentElement)
              .getPropertyValue(`--my-color-${colorName}`)
              .trim(),
            機構名稱: row[headerIndices.機構名稱],
            地址: row[headerIndices.地址],
          };

          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lon, lat],
            },
            properties: {
              id: id,
              layerId: layerId,
              layerName: layer.layerName,
              name: row[headerIndices.機構名稱],
              fillColor: getComputedStyle(document.documentElement)
                .getPropertyValue(`--my-color-${colorName}`)
                .trim(),
              propertyData: propertyData,
              popupData: popupData,
              tableData: tableData,
            },
          };
        })
        .filter((feature) => feature !== null), // 使用 .filter() 方法過濾掉陣列中所有為 null 的項目 (即那些因座標無效而返回 null 的資料)
    };

    // 包含為表格量身打造的數據陣列
    const tableData = geoJsonData.features.map((feature) => ({
      ...feature.properties.tableData,
    }));

    // 統計各行政區的數量 - 從地址中提取行政區
    const districtCounts = {};
    geoJsonData.features.forEach((feature) => {
      const address = feature.properties.propertyData.地址;
      if (address) {
        // 從地址中提取行政區（假設地址格式為：臺北市XX區...）
        const districtMatch = address.match(/臺北市([^市]*?區)/);
        if (districtMatch) {
          const district = districtMatch[1];
          districtCounts[district] = (districtCounts[district] || 0) + 1;
        }
      }
    });

    // 轉換為陣列格式並排序
    const districtCount = Object.entries(districtCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // 按數量降序排列

    // 包含摘要資訊
    const summaryData = {
      totalCount: geoJsonData.features.length,
      districtCount: districtCount,
    };

    return {
      geoJsonData, // 包含原始且完整的 GeoJSON 數據
      tableData, // 包含為表格量身打造的數據陣列
      summaryData, // 包含摘要資訊
    };
  } catch (error) {
    console.error('❌ 數據載入失敗:', error);
    throw error;
  }
}

// 老人福利機構

// 一般護理之家

// 住宿式長照機構

// 住宿式喘息(GA05)及住宿式短照(SC05)服務單位

// 居家式喘息(GA09)及居家式短照(SC09)服務單位
export async function load142Data(layer) {
  try {
    const layerId = layer.layerId;
    const colorName = layer.colorName;

    const filePath = `/long-term-care-web-taichung/data/csv/${layer.fileName}`;

    const response = await fetch(filePath);

    if (!response.ok) {
      console.error('HTTP 錯誤:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvText = await response.text();

    // 將完整的 CSV 文字內容，首先按換行符號('\n')分割成陣列的每一行
    // 然後對每一行再用逗號(',')分割成欄位，最終形成一個二維陣列
    const rows = csvText.split('\n').map((row) => row.split(','));

    // 取得二維陣列的第一行(rows[0])作為標頭，並對每個標頭使用 trim() 去除前後可能存在的空白字元
    const headers = rows[0].map((h) => h.trim());

    const headerIndices = {
      序號: headers.indexOf('序號'),
      機構名稱: headers.indexOf('機構名稱'),
      服務區別: headers.indexOf('服務區別'),
      郵遞區號: headers.indexOf('郵遞區號'),
      機構服務地址: headers.indexOf('機構(服務)地址'),
      聯絡電話: headers.indexOf('聯絡電話'),
      聯絡窗口: headers.indexOf('聯絡窗口'),
      住宿式短照服務: headers.indexOf('住宿式短照服務(SC05)'),
      lat: headers.indexOf('lat'),
      lon: headers.indexOf('lon'),
    };

    const geoJsonData = {
      type: 'FeatureCollection',
      features: rows
        .slice(1) // 使用 .slice(1) 方法，從索引 1 開始提取所有元素，即跳過第一行(標頭)
        .map((row, index) => {
          const lat = parseFloat(row[headerIndices.lat]);
          const lon = parseFloat(row[headerIndices.lon]);

          const id = index + 1;

          if (isNaN(lat) || isNaN(lon)) {
            console.warn(`第 ${id} 行 ${row[headerIndices.address]} 的座標無效:`, {
              lat: row[headerIndices.lat],
              lon: row[headerIndices.lon],
            });
            return null;
          }

          const propertyData = {
            序號: row[headerIndices.序號],
            機構名稱: row[headerIndices.機構名稱],
            服務區別: row[headerIndices.服務區別],
            郵遞區號: row[headerIndices.郵遞區號],
            機構服務地址: row[headerIndices.機構服務地址],
            聯絡電話: row[headerIndices.聯絡電話],
            聯絡窗口: row[headerIndices.聯絡窗口],
            住宿式短照服務: row[headerIndices.住宿式短照服務],
          };

          const popupData = {
            name: row[headerIndices.機構名稱],
          };

          const tableData = {
            '#': id,
            color: getComputedStyle(document.documentElement)
              .getPropertyValue(`--my-color-${colorName}`)
              .trim(),
            機構名稱: row[headerIndices.機構名稱],
            機構服務地址: row[headerIndices.機構服務地址],
          };

          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [lon, lat],
            },
            properties: {
              id: id,
              layerId: layerId,
              layerName: layer.layerName,
              name: row[headerIndices.機構名稱],
              fillColor: getComputedStyle(document.documentElement)
                .getPropertyValue(`--my-color-${colorName}`)
                .trim(),
              propertyData: propertyData,
              popupData: popupData,
              tableData: tableData,
            },
          };
        })
        .filter((feature) => feature !== null), // 使用 .filter() 方法過濾掉陣列中所有為 null 的項目 (即那些因座標無效而返回 null 的資料)
    };

    // 包含為表格量身打造的數據陣列
    const tableData = geoJsonData.features.map((feature) => ({
      ...feature.properties.tableData,
    }));

    // 統計各行政區的數量 - 從地址中提取行政區
    const districtCounts = {};
    geoJsonData.features.forEach((feature) => {
      const address = feature.properties.propertyData.機構服務地址;
      if (address) {
        // 從地址中提取行政區（假設地址格式為：臺北市XX區...）
        const districtMatch = address.match(/臺北市([^市]*?區)/);
        if (districtMatch) {
          const district = districtMatch[1];
          districtCounts[district] = (districtCounts[district] || 0) + 1;
        }
      }
    });

    // 轉換為陣列格式並排序
    const districtCount = Object.entries(districtCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // 按數量降序排列

    // 包含摘要資訊
    const summaryData = {
      totalCount: geoJsonData.features.length,
      districtCount: districtCount,
    };

    return {
      geoJsonData, // 包含原始且完整的 GeoJSON 數據
      tableData, // 包含為表格量身打造的數據陣列
      summaryData, // 包含摘要資訊
    };
  } catch (error) {
    console.error('❌ 數據載入失敗:', error);
    throw error;
  }
}

// 社區式喘息(GA03/GA04/GA06)及社區式短照(SC03/SC04/SC06) 服務單位

// 4大超商

// 臺北市區界圖
