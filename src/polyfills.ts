/**
 * polyfills.ts文件中包含了Angular需要的，在应用程序加载之前加载的腻子脚本（polyfill）。
 * 可以在这个文件中添加其他腻子脚本。
 *
 * 这个文件分成两个部分：
 * 1、浏览器的腻子脚本：zone.js加载之前应用的脚本，按浏览器排序。
 * 2、应用程序的import：zone.js加载之后，main文件加载之前导入的文件。
 *
 * 当前设置针对于所谓的经久不衰的（evergreen）浏览器，即自动更新最后一个版本的浏览器。
 * 这些浏览器包括：Safari >= 10、Chrome >= 55（包括Opera）、桌面设备中的Edge >= 13、iOS 10和移动设备中的Chrome。
 *
 * 参考文档：https://angular.io/guide/browser-support
 */

/***************************************************************************************************
 * 浏览器的腻子脚本
 */

/**
 * 默认情况下，zone.js会修正所有可能的宏任务和Dom事件。
 * 通过设置以下标记，用户可以禁用部分宏任务或Dom事件补丁。
 * 因为这些标记需要在zone.js加载之前设置，并且webpack会把import放在包的顶部，
 * 所以用户需要在这个目录中创建一个单独的文件，例如：zone-flags.ts，并把以下标记放在这个文件中。
 * 然后在import 'zone.js'之前添加以下代码：
 * import './zone-flags';
 *
 * zone-flags.ts中允许的标记如下：
 * 1、以下标记适用于所有浏览器：
 * (window as any).__Zone_disable_requestAnimationFrame = true;               // 禁用requestAnimationFrame补丁
 * (window as any).__Zone_disable_on_property = true;                         // 禁用onProperty补丁，例如：onclick
 * (window as any).__zone_symbol__UNPATCHED_EVENTS = ['scroll', 'mousemove']; // 禁用特定于事件名称的补丁
 * 2、IE/Edge开发工具中，addEventListener也会被zone.js用以下标记包装，它会绕过IE/Edge的zone.js补丁
 *  (window as any).__Zone_enable_cross_context_check = true;
 */

/**
 * Angular默认需要zone.js
 */
// import './zone-flags'; // zone-flags.ts文件中包含了上述可用标记
import 'zone.js';         // 与Angular CLI包含在一起

/***************************************************************************************************
 * 应用程序的import
 */
