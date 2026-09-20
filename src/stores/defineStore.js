import { defineStore } from 'pinia';

// CARTO Basemaps API 金鑰
// CARTO 自 2026/08 起要求金鑰，未帶金鑰的圖磚會被壓上 "API KEY REQUIRED" 浮水印。
// 金鑰放在 .env.local（已被 .gitignore 排除），請勿寫進原始碼：
//   VUE_APP_CARTO_API_KEY=你的金鑰
// 注意：此金鑰會被打包進前端 bundle，屬公開金鑰，必須在 CARTO 後台綁定網域。
const CARTO_API_KEY = process.env.VUE_APP_CARTO_API_KEY || '';

// 金鑰綁定的網域清單（逗號分隔，可用 VUE_APP_CARTO_KEY_HOSTS 覆寫）。
// CARTO 會擋掉來自綁定網域以外的請求並回 403，圖磚會整片消失。所以只在
// 綁定網域帶金鑰；本機開發等其他來源改用不帶金鑰的圖磚 —— 會有浮水印，
// 但底圖看得見，總比整片空白好。若要讓本機也沒有浮水印，在 CARTO 後台
// 把 localhost 加進允許清單，再把它加到這個變數即可。
const CARTO_KEY_HOSTS = (process.env.VUE_APP_CARTO_KEY_HOSTS || 'wenlab501.github.io')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

const cartoKeyQuery =
  CARTO_API_KEY &&
  typeof window !== 'undefined' &&
  CARTO_KEY_HOSTS.includes(window.location.hostname)
    ? `?key=${CARTO_API_KEY}`
    : '';

export const useDefineStore = defineStore('define', {
  state: () => ({
    selectedBasemap: 'carto_light_labels', // 當前選中的底圖
    // 地圖視圖狀態
    mapView: {
      center: [23.5, 121.0], // 地圖中心點 [緯度, 經度] - 台灣中心
      zoom: 8, // 縮放等級 - 顯示全台灣
    },
    basemaps: [
      {
        label: 'OpenStreetMap',
        value: 'osm',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      },
      {
        label: 'Esri Street',
        value: 'esri_street',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      },
      {
        label: 'Esri Topo',
        value: 'esri_topo',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      },
      {
        label: 'Esri World Imagery',
        value: 'esri_imagery',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      },
      {
        label: 'Google Maps 街道',
        value: 'google_road',
        url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      },
      {
        label: 'Google Maps 衛星',
        value: 'google_satellite',
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      },
      {
        label: '國土規劃中心電子地圖',
        value: 'nlsc_emap',
        url: 'https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}',
      },
      {
        label: '國土規劃中心正射影像',
        value: 'nlsc_photo',
        url: 'https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/GoogleMapsCompatible/{z}/{y}/{x}',
      },
      {
        label: '地形圖',
        value: 'terrain',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      },
      {
        label: 'Carto Light',
        value: 'carto_light_labels',
        url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${cartoKeyQuery}`,
      },
      {
        label: 'Carto Dark',
        value: 'carto_dark_labels',
        url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${cartoKeyQuery}`,
      },
      {
        label: 'Carto Voyager',
        value: 'carto_voyager',
        url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${cartoKeyQuery}`,
      },
      {
        label: '白色地圖',
        value: 'blank',
        url: '',
      },
      {
        label: '黑色底圖',
        value: 'black',
        url: '',
      },
    ],
  }),
  actions: {
    setSelectedBasemap(value) {
      this.selectedBasemap = value;
    },
    setMapView(center, zoom) {
      this.mapView.center = center;
      this.mapView.zoom = zoom;
    },
  },
});
