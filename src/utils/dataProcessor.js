
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

    // 遍歷所有服務人員的資料
    jsonData.forEach((serviceProvider) => {
      if (serviceProvider.data && Array.isArray(serviceProvider.data)) {
        serviceProvider.data.forEach((serviceRecord) => {
          if (serviceRecord.datail && serviceRecord.datail.Lat && serviceRecord.datail.Lon) {
            const lat = parseFloat(serviceRecord.datail.Lat);
            const lon = parseFloat(serviceRecord.datail.Lon);

            if (!isNaN(lat) && !isNaN(lon)) {
              const propertyData = {
                編號: serviceRecord.datail.編號,
                姓名: serviceRecord.datail.姓名,
                性別: serviceRecord.datail.性別,
                個案戶籍縣市: serviceRecord.datail.個案戶籍縣市,
                鄉鎮區: serviceRecord.datail.鄉鎮區,
                里別: serviceRecord.datail.里別,
                個案戶籍地址: serviceRecord.datail.個案戶籍地址,
                個案居住縣市: serviceRecord.datail.個案居住縣市,
                個案居住地址: serviceRecord.datail.個案居住地址,
              };

              const popupData = {
                name: serviceRecord.datail.姓名,
              };

              const tableData = {
                '#': id,
                color: getComputedStyle(document.documentElement)
                  .getPropertyValue(`--my-color-${colorName}`)
                  .trim(),
                姓名: serviceRecord.datail.姓名,
                個案居住地址: serviceRecord.datail.個案居住地址,
              };

              geoJsonData.features.push({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [lon, lat],
                },
                properties: {
                  id: id,
                  layerId: layerId,
                  layerName: layer.layerName,
                  name: serviceRecord.datail.姓名,
                  fillColor: getComputedStyle(document.documentElement)
                    .getPropertyValue(`--my-color-${colorName}`)
                    .trim(),
                  propertyData: propertyData,
                  popupData: popupData,
                  tableData: tableData,
                },
              });

              id++;
            }
          }
        });
      }
    });

    // 包含為表格量身打造的數據陣列
    const tableData = geoJsonData.features.map((feature) => ({
      ...feature.properties.tableData,
    }));

    // 統計各行政區的數量
    const districtCounts = {};
    geoJsonData.features.forEach((feature) => {
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

// 社區照顧關懷據點
export async function loadCommunityCareCenterData(layer) {
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
      行政區: headers.indexOf('行政區'),
      里別: headers.indexOf('里別'),
      據點名稱: headers.indexOf('據點名稱'),
      據點類型: headers.indexOf('據點類型'),
      據點地址: headers.indexOf('據點地址'),
      聯絡電話: headers.indexOf('聯絡電話'),
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
            行政區: row[headerIndices.行政區],
            里別: row[headerIndices.里別],
            據點名稱: row[headerIndices.據點名稱],
            據點類型: row[headerIndices.據點類型],
            據點地址: row[headerIndices.據點地址],
            聯絡電話: row[headerIndices.聯絡電話],
          };

          const popupData = {
            name: row[headerIndices.機構名稱],
          };

          const tableData = {
            '#': id,
            color: getComputedStyle(document.documentElement)
              .getPropertyValue(`--my-color-${colorName}`)
              .trim(),
            據點名稱: row[headerIndices.據點名稱],
            據點地址: row[headerIndices.據點地址],
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
              name: row[headerIndices.據點名稱],
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
      const address = feature.properties.propertyData.據點地址;
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

// 社區整體照顧服務體系C級單位
export async function loadCLevelUnitData(layer) {
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
      編號: headers.indexOf('編號'),
      據點名稱: headers.indexOf('據點名稱'),
      行政區: headers.indexOf('行政區'),
      里別: headers.indexOf('里別'),
      據點地址: headers.indexOf('據點地址'),
      電話: headers.indexOf('電話'),
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
            編號: row[headerIndices.編號],
            據點名稱: row[headerIndices.據點名稱],
            行政區: row[headerIndices.行政區],
            里別: row[headerIndices.里別],
            據點地址: row[headerIndices.據點地址],
            電話: row[headerIndices.電話],
          };

          const popupData = {
            name: row[headerIndices.據點名稱],
          };

          const tableData = {
            '#': id,
            color: getComputedStyle(document.documentElement)
              .getPropertyValue(`--my-color-${colorName}`)
              .trim(),
            據點名稱: row[headerIndices.據點名稱],
            據點地址: row[headerIndices.據點地址],
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
              name: row[headerIndices.據點名稱],
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
      const address = feature.properties.propertyData.據點地址;
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

// 社區照顧關懷據點辦理社區喘息服務(C+單位)
export async function loadRespiteCareCPlusUnitData(layer) {
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
      編號: headers.indexOf('編號'),
      據點名稱: headers.indexOf('據點名稱'),
      行政區: headers.indexOf('行政區'),
      里別: headers.indexOf('里別'),
      據點地址: headers.indexOf('據點地址'),
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
            編號: row[headerIndices.編號],
            據點名稱: row[headerIndices.據點名稱],
            行政區: row[headerIndices.行政區],
            里別: row[headerIndices.里別],
            據點地址: row[headerIndices.據點地址],
          };

          const popupData = {
            name: row[headerIndices.據點名稱],
          };

          const tableData = {
            '#': id,
            color: getComputedStyle(document.documentElement)
              .getPropertyValue(`--my-color-${colorName}`)
              .trim(),
            據點名稱: row[headerIndices.據點名稱],
            據點地址: row[headerIndices.據點地址],
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
              name: row[headerIndices.據點名稱],
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
      const address = feature.properties.propertyData.據點地址;
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
export async function loadElderlyWelfareInstitutionData(layer) {
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
      編號: headers.indexOf('編號'),
      屬性: headers.indexOf('屬性'),
      機構名稱: headers.indexOf('機構名稱'),
      區域別: headers.indexOf('區域別'),
      地址: headers.indexOf('地址'),
      電話: headers.indexOf('電話'),
      收容對象: headers.indexOf('收容對象'),
      核定床數_核定總床位數: headers.indexOf('核定床數-核定總床位數'),
      核定床數_長照床數: headers.indexOf('核定床數-長照床數'),
      核定床數_養護床數: headers.indexOf('核定床數-養護床數'),
      核定床數_失智床數: headers.indexOf('核定床數-失智床數'),
      核定床數_安養床數: headers.indexOf('核定床數-安養床數'),
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
            編號: row[headerIndices.編號],
            屬性: row[headerIndices.屬性],
            機構名稱: row[headerIndices.機構名稱],
            區域別: row[headerIndices.區域別],
            地址: row[headerIndices.地址],
            電話: row[headerIndices.電話],
            收容對象: row[headerIndices.收容對象],
            核定床數_核定總床位數: row[headerIndices.核定床數_核定總床位數],
            核定床數_長照床數: row[headerIndices.核定床數_長照床數],
            核定床數_養護床數: row[headerIndices.核定床數_養護床數],
            核定床數_失智床數: row[headerIndices.核定床數_失智床數],
            核定床數_安養床數: row[headerIndices.核定床數_安養床數],
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

// 社區整合型服務中心(A單位)
export async function loadCommunityIntegrationServiceCenterData(layer) {
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
      單位名稱: headers.indexOf('單位名稱'),
      行政區: headers.indexOf('行政區'),
      服務區域: headers.indexOf('服務區域'),
      服務地址_聯絡電話: headers.indexOf('服務地址/聯絡電話'),
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
            單位名稱: row[headerIndices.單位名稱],
            行政區: row[headerIndices.行政區],
            服務區域: row[headerIndices.服務區域],
            服務地址_聯絡電話: row[headerIndices.服務地址_聯絡電話],
          };

          const popupData = {
            name: row[headerIndices.單位名稱],
          };

          const tableData = {
            '#': id,
            color: getComputedStyle(document.documentElement)
              .getPropertyValue(`--my-color-${colorName}`)
              .trim(),
            單位名稱: row[headerIndices.單位名稱],
            服務地址_聯絡電話: row[headerIndices.服務地址_聯絡電話],
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
              name: row[headerIndices.單位名稱],
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
      const address = feature.properties.propertyData.服務地址_聯絡電話;
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

// 一般護理之家
export async function loadGeneralNursingHomeData(layer) {
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
      開放床數: headers.indexOf('開放床數'),
      地址: headers.indexOf('地址'),
      電話: headers.indexOf('電話'),
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
            開放床數: row[headerIndices.開放床數],
            地址: row[headerIndices.地址],
            電話: row[headerIndices.電話],
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

// 住宿式長照機構
export async function loadResidentialLongTermCareData(layer) {
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
      立案日期: headers.indexOf('立案日期'),
      評鑑資訊: headers.indexOf('評鑑資訊'),
      地址: headers.indexOf('地址'),
      電話: headers.indexOf('電話'),
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
            開放床數: row[headerIndices.開放床數],
            立案日期: row[headerIndices.立案日期],
            評鑑資訊: row[headerIndices.評鑑資訊],
            地址: row[headerIndices.地址],
            電話: row[headerIndices.電話],
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

// 住宿式喘息(GA05)及住宿式短照(SC05)服務單位
export async function load66Data(layer) {
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

// 巷弄長照站喘息(C+)(GA07)及巷弄長照站短照(SC07)服務單位
export async function load25Data(layer) {
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
      巷弄長照站短照服務: headers.indexOf('巷弄長照站短照服務(SC07)'),
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
            巷弄長照站短照服務: row[headerIndices.巷弄長照站短照服務],
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
export async function load41Data(layer) {
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
      GA03: headers.indexOf('GA03'),
      GA04: headers.indexOf('GA04'),
      GA06: headers.indexOf('GA06'),
      SC03: headers.indexOf('SC03'),
      SC04: headers.indexOf('SC04'),
      SC06: headers.indexOf('SC06'),
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
            GA03: row[headerIndices.GA03],
            GA04: row[headerIndices.GA04],
            GA06: row[headerIndices.GA06],
            SC03: row[headerIndices.SC03],
            SC04: row[headerIndices.SC04],
            SC06: row[headerIndices.SC06],
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






// 4大超商




// 臺北市區界圖
