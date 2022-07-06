import {DOCUMENT, Location, PlatformLocation, PopStateEvent, ViewportScroller} from '@angular/common';
import {Inject, Injectable, OnDestroy} from '@angular/core';
import {fromEvent, Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {SessionStorage} from './storage.service';

// 滚动位置
type ScrollPosition = [number, number];

// 滚动位置的弹出状态事件
interface ScrollPositionPopStateEvent extends PopStateEvent {
    // 如果存在历史状态，应该包含scrollPosition
    state?: { scrollPosition: ScrollPosition };
}

// 顶部外边距
export const topMargin = 16;

/**
 * 滚动服务：把文档元素滚动到视图中。
 */
@Injectable()
export class ScrollService implements OnDestroy {

    // 顶部偏移量
    private _topOffset: number | null;

    // 顶部页面元素
    private _topOfPageElement: HTMLElement;

    // 销毁主题
    private onDestroy = new Subject<void>();

    // 弹出状态事件之后需要修复的滚动位置
    poppedStateScrollPosition: ScrollPosition | null = null;

    // 浏览器是否支持手动滚动修复
    supportManualScrollRestoration: boolean = !!window && ('scrollTo' in window) && ('pageXOffset' in window) && isScrollRestorationWritable();

    // 获取顶部偏移量：文档顶部到顶部静态元素底部（例如：工具栏）的偏移量 + 顶部外边距
    get topOffset() {
        if (!this._topOffset) {
            const toolbar = this.document.querySelector('.app-toolbar');
            this._topOffset = (toolbar && toolbar.clientHeight || 0) + topMargin;
        }
        return this._topOffset as number;
    }

    // 获取顶部页面元素
    get topOfPageElement() {
        if (!this._topOfPageElement) {
            this._topOfPageElement = this.document.getElementById('top-of-page') || this.document.body;
        }
        return this._topOfPageElement;
    }

    /**
     * 构造函数，创建ScrollService。
     *
     * @param document Document对象
     * @param platformLocation PlatformLocation对象
     * @param viewportScroller 滚动位置管理器
     * @param location Location对象
     * @param storage 存储对象
     */
    constructor(@Inject(DOCUMENT) private document: Document,
                private platformLocation: PlatformLocation,
                private viewportScroller: ViewportScroller,
                private location: Location,
                @Inject(SessionStorage) private storage: Storage) {

        // 调整大小时，可能会改变工具栏高度，这样会使顶部偏移量失效
        fromEvent(window, 'resize').pipe(takeUntil(this.onDestroy)).subscribe(() => this._topOffset = null);
        fromEvent(window, 'scroll').pipe(debounceTime(250), takeUntil(this.onDestroy)).subscribe(() => this.updateScrollPositionInHistory());
        fromEvent(window, 'beforeunload').pipe(takeUntil(this.onDestroy)).subscribe(() => this.updateScrollLocationHref());

        // 把滚动修复策略修改为manual
        if (this.supportManualScrollRestoration) {
            history.scrollRestoration = 'manual';

            // 因为存在弹出状态事件，所以需要检测前进和后退导航
            const locationSubscription = this.location.subscribe((event: ScrollPositionPopStateEvent) => {
                // The type is `hashchange` when the fragment identifier of the URL has changed.
                // It allows us to go to position just before a click on an anchor.
                if (event.type === 'hashchange') {
                    this.scrollToPosition();
                } else {
                    // Navigating with the forward/back button, we have to remove the position from the
                    // session storage in order to avoid a race-condition.
                    this.removeStoredScrollInfo();
                    // The `popstate` event is always triggered by a browser action such as clicking the
                    // forward/back button. It can be followed by a `hashchange` event.
                    this.poppedStateScrollPosition = event.state ? event.state.scrollPosition : null;
                }
            });

            this.onDestroy.subscribe(() => locationSubscription.unsubscribe());
        }

        // If this was not a reload, discard the stored scroll info.
        if (window.location.href !== this.getStoredScrollLocationHref()) {
            this.removeStoredScrollInfo();
        }
    }

    ngOnDestroy() {
        this.onDestroy.next();
    }

    /**
     * Scroll to the element with id extracted from the current location hash fragment.
     * Scroll to top if no hash.
     * Don't scroll if hash not found.
     */
    scroll() {
        const hash = this.getCurrentHash();
        const element = hash ? this.document.getElementById(hash) ?? null : this.topOfPageElement;
        this.scrollToElement(element);
    }

    /**
     * test if the current location has a hash
     */
    isLocationWithHash(): boolean {
        return !!this.getCurrentHash();
    }

    /**
     * When we load a document, we have to scroll to the correct position depending on whether this is
     * a new location, a back/forward in the history, or a refresh.
     *
     * @param delay before we scroll to the good position
     */
    scrollAfterRender(delay: number) {
        // If we do rendering following a refresh, we use the scroll position from the storage.
        const storedScrollPosition = this.getStoredScrollPosition();
        if (storedScrollPosition) {
            this.viewportScroller.scrollToPosition(storedScrollPosition);
        } else {
            if (this.needToFixScrollPosition()) {
                // The document was reloaded following a `popstate` event (triggered by clicking the
                // forward/back button), so we manage the scroll position.
                this.scrollToPosition();
            } else {
                // The document was loaded as a result of one of the following cases:
                // - Typing the URL in the address bar (direct navigation).
                // - Clicking on a link.
                // (If the location contains a hash, we have to wait for async layout.)
                if (this.isLocationWithHash()) {
                    // Delay scrolling by the specified amount to allow time for async layout to complete.
                    setTimeout(() => this.scroll(), delay);
                } else {
                    // If the location doesn't contain a hash, we scroll to the top of the page.
                    this.scrollToTop();
                }
            }
        }
    }

    /**
     * Scroll to the element.
     * Don't scroll if no element.
     */
    scrollToElement(element: HTMLElement | null) {
        if (element) {
            element.scrollIntoView();
            element.focus?.();

            if (window && window.scrollBy) {
                // Scroll as much as necessary to align the top of `element` at `topOffset`.
                // (Usually, `.top` will be 0, except for cases where the element cannot be scrolled all the
                //  way to the top, because the viewport is larger than the height of the content after the
                //  element.)
                window.scrollBy(0, element.getBoundingClientRect().top - this.topOffset);

                // If we are very close to the top (<20px), then scroll all the way up.
                // (This can happen if `element` is at the top of the page, but has a small top-margin.)
                if (window.pageYOffset < 20) {
                    window.scrollBy(0, -window.pageYOffset);
                }
            }
        }
    }

    /** Scroll to the top of the document. */
    scrollToTop() {
        this.scrollToElement(this.topOfPageElement);
    }

    scrollToPosition() {
        if (this.poppedStateScrollPosition) {
            this.viewportScroller.scrollToPosition(this.poppedStateScrollPosition);
            this.poppedStateScrollPosition = null;
        }
    }

    updateScrollLocationHref(): void {
        this.storage.setItem('scrollLocationHref', window.location.href);
    }

    /**
     * Update the state with scroll position into history.
     */
    updateScrollPositionInHistory() {
        if (this.supportManualScrollRestoration) {
            const currentScrollPosition = this.viewportScroller.getScrollPosition();
            this.location.replaceState(
                this.location.path(true), undefined, {scrollPosition: currentScrollPosition});
            this.storage.setItem('scrollPosition', currentScrollPosition.join(','));
        }
    }

    getStoredScrollLocationHref(): string | null {
        const href = this.storage.getItem('scrollLocationHref');
        return href || null;
    }

    getStoredScrollPosition(): ScrollPosition | null {
        const position = this.storage.getItem('scrollPosition');
        if (!position) {
            return null;
        }

        const [x, y] = position.split(',');
        return [+x, +y];
    }

    removeStoredScrollInfo() {
        this.storage.removeItem('scrollLocationHref');
        this.storage.removeItem('scrollPosition');
    }

    /**
     * Check if the scroll position need to be manually fixed after popState event
     */
    needToFixScrollPosition(): boolean {
        return this.supportManualScrollRestoration && !!this.poppedStateScrollPosition;
    }

    /**
     * Return the hash fragment from the `PlatformLocation`, minus the leading `#`.
     */
    private getCurrentHash() {
        return decodeURIComponent(this.platformLocation.hash.replace(/^#/, ''));
    }
}

/**
 * We need to check whether we can write to `history.scrollRestoration`
 *
 * We do this by checking the property descriptor of the property, but
 * it might actually be defined on the `history` prototype not the instance.
 *
 * In this context "writable" means either than the property is a `writable`
 * data file or a property that has a setter.
 */
function isScrollRestorationWritable() {
    const scrollRestorationDescriptor =
        Object.getOwnPropertyDescriptor(history, 'scrollRestoration') ||
        Object.getOwnPropertyDescriptor(Object.getPrototypeOf(history), 'scrollRestoration');
    return scrollRestorationDescriptor !== undefined &&
        !!(scrollRestorationDescriptor.writable || scrollRestorationDescriptor.set);
}
