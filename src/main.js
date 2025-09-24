/**
 * 🚀 應用程式主入口文件 (Main Application Entry Point)
 *
 * 功能說明：
 * 1. 🎨 引入 Bootstrap 和自定義主題樣式系統
 * 2. 🧩 初始化 Vue 3 應用程式和全域組件
 * 3. 🗺️ 設定 Vue Router 路由導航系統
 * 4. 📦 配置 Pinia 狀態管理系統
 * 5. 🌍 掛載應用程式到 DOM 容器中
 * 6. 🔧 整合第三方庫（Leaflet、Font Awesome、Bootstrap）
 *
 * 技術棧：
 * - Vue 3 (Composition API)
 * - Vue Router 4
 * - Pinia (狀態管理)
 * - Bootstrap 5 (UI 框架)
 * - Leaflet (地圖庫)
 * - Font Awesome (圖示庫)
 */

// 🔧 Vue 核心模組引入 (Vue Core Module Imports)
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// 🧩 應用程式組件引入 (Application Component Imports)
import App from './App.vue';
import router from './router';

// 🎨 引入第三方樣式文件 (Import Third-Party Style Files)
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap 5 CSS 框架
import 'leaflet/dist/leaflet.css'; // Leaflet 地圖核心樣式
import '@fortawesome/fontawesome-free/css/all.min.css'; // Font Awesome 圖示庫

// 🎨 引入自定義樣式文件 (Import Custom Style Files)
import './assets/css/common.css'; // 共用樣式（已包含變數和主題配置）

// ⚙️ 引入第三方 JavaScript 文件 (Import Third-Party JavaScript Files)
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Bootstrap JS（含 Popper.js）
// 提供下拉選單、模態框、工具提示等互動功能

// 🐛 調試資訊輸出 (Debug Information Output)

// 🚀 創建並配置 Vue 應用程式實例 (Create and Configure Vue Application Instance)
const app = createApp(App);

// 📦 創建 Pinia 狀態管理實例 (Create Pinia State Management Instance)
const pinia = createPinia();

// 🗺️ 註冊 Vue Router 路由系統 (Register Vue Router Navigation System)
app.use(router);

// 📦 註冊 Pinia 狀態管理系統 (Register Pinia State Management System)
app.use(pinia);

// 🌍 掛載應用程式到 DOM 元素 (Mount Application to DOM Element)
// 將 Vue 應用程式掛載到 index.html 中 id="app" 的元素上
app.mount('#app');

// 🐛 應用程式啟動完成的調試資訊 (Application Startup Debug Information)
