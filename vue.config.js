const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  publicPath: '/long-term-care-web-taichung/',
  transpileDependencies: true,
  devServer: {
    port: 8080,
    // 監聽所有介面而非只有 localhost。CARTO 的金鑰綁定 referer 網域，清單裡的
    // lvh.me 解析到 127.0.0.1，用它開發才帶得動金鑰；但只監聽 localhost 時
    // dev server 會綁在 IPv6 的 [::1]，lvh.me 的 IPv4 位址連不上。
    host: '0.0.0.0',
    // 允許以 lvh.me 等主機名稱存取，否則 webpack-dev-server 會擋下 Host 標頭
    allowedHosts: 'all',
  },
});
