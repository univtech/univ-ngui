# angular.io中的CSS样式

This document gives an overview of how angular.io CSS styles are implemented and organized in files.

## 通用

Styles are implemented using [Sass](https://sass-lang.com/) and stored in `.scss` files in [src/styles/](.).

> **NOTE:**<br />
> We do not use inline styles for components.
> Styles for components are defined in `.scss` files in [src/styles/](.) and are not referenced from the component files.


## 文件组织

.scss文件在以下子目录中：
+ 0-base：影响整个应用程序的通用样式。
+ 1-layouts：与应用程序布局相关的区域或组件样式，例如：顶部菜单、页脚、营销页面等等。
+ 2-modules：特定组件的样式，例如：按钮、代码、标签等等；特定页面的样式，例如：API列表页面，特性页面等等。
+ custom-themes：应用程序中不同主题的样式，当前支持浅色和深色。

There are also some top-level files in `[src/styles/](.):
- [_app-theme.scss](./_app-theme.scss): Defines a `theme()` Sass mixin for creating an application theme.
- [_constants.scss](./_constants.scss): Defines several constants to be used throughout the styles.
- [_mixins.scss](./_mixins.scss): Defines Sass mixins to be used throughout the styles.
- [_print.scss](./_print.scss): Contains styles to be applied when printing.
- [main.scss](./main.scss): Styles entry-point.


### 特定区域或组件的样式

For each area/component, there is a sub-directory in either `1-layouts/` or `2-modules/`.

Each such sub-directory contains a `<name>.scss` file with styles for the corresponding area/component and may also contain a `<name>-theme.scss` file with styles related to theming.
See the next section for more details.

When appropriate, the styles in these files should be scoped to the targeted component (for example, by using the component's selector).


## 主题

Angular.io supports choosing between themes. Currently, a `light` and a `dark` theme are supported.
See also [#41129](https://github.com/angular/angular/pull/41129) for more details/discussions around the theming implementation.


## 主题样式

Styles for each area/component are split between two files: `<name>.scss` and `<name>-theme.scss`.

The general styles go into `<name>.scss`.
If an area/component has styles that could change based on the active theme (such as color or background), these go into the `*-theme.scss` file.
Color-related styles in particular should always go into that file, even if the styles do not currently change between themes.
This will make it easier to adjust/add more themes in the future.

Within each `*-theme.scss` file is a Sass mixin that takes in a Material theme configuration and generates the appropriate styling for that theme and component.

Advantages of the chosen approach:
- Theming is contained to one file per component.
  Developers need only be aware of the existence of a single file when making theming related changes to a component
- Themes can be lazy-loaded at runtime, preventing growth of the default styles chunk every time a new theme is implemented.

Disadvantages of the chosen approach:
- Splitting styles into two files means that some selectors will be duplicated, resulting in an increase of the total styles chunk size.


## 在运行时应用主题

When building the app the following styles bundles are generated:
- One [based on `main.scss`](https://github.com/angular/angular/blob/62b5a6cb079e489d91982abe88d644d73feb73f3/aio/angular.json#L44), which is always included in `index.html` and contains the general (non-theme-specific) styles.
- [One bundle per theme](https://github.com/angular/angular/blob/62b5a6cb079e489d91982abe88d644d73feb73f3/aio/angular.json#L45-L54), which is loaded "on demand" and contains theme-specific styles.

A theme bundle is [loaded at runtime](https://github.com/angular/angular/blob/62b5a6cb079e489d91982abe88d644d73feb73f3/aio/src/index.html#L33-L36) using the CSS [`@import` rule](https://developer.mozilla.org/en-US/docs/Web/CSS/@import).
The appropriate theme is chosen based on the user's preference (either through an operating system setting or a user agent setting) using the [`prefers-color-scheme` media query](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme).

Once the application has bootstrapped, the theme [may be updated](https://github.com/angular/angular/blob/62b5a6cb079e489d91982abe88d644d73feb73f3/aio/src/app/shared/theme-picker/theme-toggle.component.ts#L49-L72) based on a previously stored application-specific preference.
Whenever the user explicitly changes the theme using the theme-toggle component, the new preference [is stored](https://github.com/angular/angular/blob/62b5a6cb079e489d91982abe88d644d73feb73f3/aio/src/app/shared/theme-picker/theme-toggle.component.ts#L89) for use in future visits.

> **NOTE:**<br />
> The theming infrastructure is based on the [material.angular.io](https://github.com/angular/material.angular.io) implementation.
