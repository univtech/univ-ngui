/**
 * 一个简单的，什么都不做的，采用立即控制的Service Worker。
 * 激活Service Worker时如果存在Bug，并且在调查问题时需要在客户端浏览器上停用Worker，可以使用这个文件。
 *
 * 要激活这个Service Worker，需要把文件重命名为worker-basic.min.js，并部署到服务器。
 * 原来的Worker文件缓存过期时，这个文件将会取代它。
 * 浏览器确保过期时间不超过24小时，但是Firebase的默认过期时间为60分钟。
 */

// 跳过waiting生命周期状态，立即激活新的Service Worker，即使存在旧的Service Worker控制着另一个Tab。
self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

// 获取Service Worker控制的，当前打开的所有窗口或Tab，并强制重新加载。
// 激活新的Service Worker时，恢复所有打开的窗口或Tab，不需要手动重新加载。
self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});
