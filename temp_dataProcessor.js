import * as d3 from 'd3';

// 土地利用顏色分類函數
function getColorForZone(zone) {
  const zoneLower = zone.toLowerCase();

  // 住宅區系列 - 橙色系
  if (zoneLower.includes('住') || zoneLower.includes('宅')) {
    if (zoneLower.includes('住1') || zoneLower.includes('第一類'))
      return 'rgba(255, 178, 102, 0.8)';
    if (zoneLower.includes('住2')) return 'rgba(255, 152, 51, 0.8)';
    if (zoneLower.includes('住3')) return 'rgba(255, 128, 25, 0.8)';
    if (zoneLower.includes('住4')) return 'rgba(230, 108, 15, 0.8)';
    if (zoneLower.includes('住6')) return 'rgba(204, 85, 0, 0.8)';
    if (zoneLower.includes('住商')) return 'rgba(255, 204, 153, 0.8)';
    if (zoneLower.includes('第二類')) return 'rgba(255, 152, 51, 0.8)';
    if (zoneLower.includes('第三類')) return 'rgba(255, 128, 25, 0.8)';
    return 'rgba(255, 178, 102, 0.8)'; // 預設住宅區顏色
  }

  // 商業區系列 - 藍色系
  if (zoneLower.includes('商')) {
    if (zoneLower.includes('商1')) return 'rgba(102, 178, 255, 0.8)';
    if (zoneLower.includes('商2')) return 'rgba(51, 152, 255, 0.8)';
    if (zoneLower.includes('商3')) return 'rgba(25, 128, 255, 0.8)';
    if (zoneLower.includes('商4')) return 'rgba(15, 108, 230, 0.8)';
    if (zoneLower.includes('商特')) return 'rgba(153, 204, 255, 0.8)';
    return 'rgba(102, 178, 255, 0.8)'; // 預設商業區顏色
  }

  // 工業區系列 - 灰色系
  if (zoneLower.includes('工')) {
    if (zoneLower.includes('工2')) return 'rgba(150, 150, 150, 0.8)';
    if (zoneLower.includes('工3')) return 'rgba(120, 120, 120, 0.8)';
    return 'rgba(180, 180, 180, 0.8)'; // 預設工業區顏色
  }

  // 綠地/公園系列 - 綠色系
  if (
    zoneLower.includes('公園') ||
    zoneLower.includes('綠地') ||
    zoneLower.includes('風景') ||
    zoneLower.includes('保護') ||
    zoneLower.includes('國家公園')
  ) {
    if (zoneLower.includes('公園綠地')) return 'rgba(102, 204, 102, 0.8)';
    if (zoneLower.includes('風景')) return 'rgba(76, 175, 76, 0.8)';
    if (zoneLower.includes('保護')) return 'rgba(51, 153, 51, 0.8)';
    if (zoneLower.includes('國家公園')) return 'rgba(25, 128, 25, 0.8)';
    return 'rgba(102, 204, 102, 0.8)';
  }

  // 交通系列 - 深藍/紫色系
  if (
    zoneLower.includes('交通') ||
    zoneLower.includes('停車') ||
    zoneLower.includes('鐵路') ||
    zoneLower.includes('機場') ||
    zoneLower.includes('高速公路')
  ) {
    if (zoneLower.includes('停車')) return 'rgba(153, 102, 204, 0.8)';
    if (zoneLower.includes('交通')) return 'rgba(128, 77, 179, 0.8)';
    if (zoneLower.includes('鐵路')) return 'rgba(102, 51, 153, 0.8)';
    if (zoneLower.includes('機場')) return 'rgba(77, 26, 128, 0.8)';
    if (zoneLower.includes('高速公路')) return 'rgba(51, 0, 102, 0.8)';
    return 'rgba(128, 77, 179, 0.8)';
  }

  // 公共設施系列 - 黃色系
  if (
    zoneLower.includes('學校') ||
    zoneLower.includes('機關') ||
    zoneLower.includes('醫院') ||
    zoneLower.includes('市場') ||
    zoneLower.includes('廣場')
  ) {
    if (zoneLower.includes('學校')) return 'rgba(255, 204, 102, 0.8)';
    if (zoneLower.includes('機關')) return 'rgba(255, 187, 51, 0.8)';
    if (zoneLower.includes('醫院')) return 'rgba(255, 170, 0, 0.8)';
    if (zoneLower.includes('市場')) return 'rgba(230, 153, 0, 0.8)';
    if (zoneLower.includes('廣場')) return 'rgba(204, 136, 0, 0.8)';
    return 'rgba(255, 204, 102, 0.8)';
  }

  // 特殊用地系列 - 紅色系
  if (zoneLower.includes('墓地') || zoneLower.includes('古蹟') || zoneLower.includes('娛樂')) {
    if (zoneLower.includes('墓地')) return 'rgba(179, 77, 77, 0.8)';
    if (zoneLower.includes('古蹟')) return 'rgba(153, 51, 51, 0.8)';
    if (zoneLower.includes('娛樂')) return 'rgba(204, 102, 102, 0.8)';
    return 'rgba(179, 77, 77, 0.8)';
  }

  // 水利/環保系列 - 青色系
  if (
    zoneLower.includes('行水') ||
    zoneLower.includes('堤防') ||
    zoneLower.includes('污水') ||
    zoneLower.includes('垃圾') ||
    zoneLower.includes('自來水')
  ) {
    return 'rgba(102, 204, 204, 0.8)';
  }

  // 能源系列 - 紫紅色系
  if (
    zoneLower.includes('加油') ||
    zoneLower.includes('儲油') ||
    zoneLower.includes('變電') ||
    zoneLower.includes('煤氣')
  ) {
    return 'rgba(204, 102, 153, 0.8)';
  }

  // 農業區 - 淺綠色
  if (zoneLower.includes('農業')) {
    return 'rgba(153, 255, 153, 0.8)';
  }

  // 其他/未分類 - 淺灰色
  return 'rgba(200, 200, 200, 0.8)';
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
