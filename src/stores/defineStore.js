import { defineStore } from 'pinia';

// CARTO Basemaps API 金鑰
// CARTO 自 2026/08 起要求金鑰，未帶金鑰的圖磚會被壓上 "API KEY REQUIRED" 浮水印。
// 金鑰放在 .env.local（已被 .gitignore 排除），請勿寫進原始碼。
// 本機開發與 npm run deploy 前，需在專案根目錄建立 .env.local：
//   VUE_APP_CARTO_API_KEY=你的金鑰
// 注意：此金鑰會被打包進前端 bundle，屬公開金鑰，請於 CARTO 後台設定網域白名單。
const CARTO_API_KEY = process.env.VUE_APP_CARTO_API_KEY || '';

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
        url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
      },
      {
        label: 'Carto Dark',
        value: 'carto_dark_labels',
        url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
      },
      {
        label: 'Carto Voyager',
        value: 'carto_voyager',
        url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`,
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
