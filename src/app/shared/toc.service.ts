import {DOCUMENT} from '@angular/common';
import {Inject, Injectable} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {ReplaySubject} from 'rxjs';
import {ScrollSpyInfo, ScrollSpyService} from 'app/shared/scroll-spy.service';
import {unwrapHtmlForSink} from 'safevalues';
import {fromInnerHTML} from './security';


export interface TocItem {
    content: SafeHtml;
    href: string;
    isSecondary?: boolean;
    level: string;
    title: string;
}

@Injectable()
export class TocService {

    tocList = new ReplaySubject<TocItem[]>(1);

    activeItemIndex = new ReplaySubject<number | null>(1);

    private scrollSpyInfo: ScrollSpyInfo | null = null;

    constructor(
        @Inject(DOCUMENT) private document: any,
        private domSanitizer: DomSanitizer,
        private scrollSpyService: ScrollSpyService) {
    }

    genToc(docElement?: Element, docId = '') {
        this.resetScrollSpyInfo();

        if (!docElement) {
            this.tocList.next([]);
            return;
        }

        const headings = this.findTocHeadings(docElement);
        const idMap = new Map<string, number>();
        const tocList = headings.map(heading => {
            const {title, content} = this.extractHeadingSafeHtml(heading);

            return {
                level: heading.tagName.toLowerCase(),
                href: `${docId}#${this.getId(heading, idMap)}`,
                title,
                content,
            };
        });

        this.tocList.next(tocList);

        this.scrollSpyInfo = this.scrollSpyService.spyOn(headings);
        this.scrollSpyInfo.active.subscribe(item => this.activeItemIndex.next(item && item.index));
    }

    // 把HTML转换为可以在ToC中安全使用的内容：
    // + 删除自动生成的.github-links和.header-link元素及其内容
    // + 把a元素的内容移到a元素的父节点中（添加到a元素前面），保留a元素的内容，删除a元素
    // + 绕过安全性，把div.innerHTML认为是安全的HTML，转换为SafeHtml
    private extractHeadingSafeHtml(heading: HTMLHeadingElement) {
        const div: HTMLDivElement = this.document.createElement('div');
        div.innerHTML = unwrapHtmlForSink(fromInnerHTML(heading));

        // 删除自动生成的.github-links和.header-link元素及其内容
        div.querySelectorAll('.github-links, .header-link').forEach(link => link.remove());

        // 把a元素的内容移到a元素的父节点中（添加到a元素前面），保留a元素的内容，删除a元素
        div.querySelectorAll('a').forEach(anchorLink => {
            const anchorParent = anchorLink.parentNode as Node;
            while (anchorLink.childNodes.length) {
                anchorParent.insertBefore(anchorLink.childNodes[0], anchorLink);
            }
            anchorLink.remove();
        });

        return {
            // 绕过安全性，把div.innerHTML认为是安全的HTML，转换为SafeHtml
            content: this.domSanitizer.bypassSecurityTrustHtml(div.innerHTML.trim()),
            title: (div.textContent || '').trim(),
        };
    }

    // 查找ToC标题
    private findTocHeadings(docElement: Element): HTMLHeadingElement[] {
        const headings = docElement.querySelectorAll<HTMLHeadingElement>('h1,h2,h3');
        const skipNoTocHeadings = (heading: HTMLHeadingElement) => !/(?:no-toc|notoc)/i.test(heading.className);
        return Array.prototype.filter.call(headings, skipNoTocHeadings);
    }

    // 重置
    reset() {
        this.resetScrollSpyInfo();
        this.tocList.next([]);
    }

    // 重置scrollSpyInfo
    private resetScrollSpyInfo() {
        if (this.scrollSpyInfo) {
            this.scrollSpyInfo.unspy();
            this.scrollSpyInfo = null;
        }
        this.activeItemIndex.next(null);
    }

    // 从h1~h6标题中提取id，id不存在时创建id
    private getId(h: HTMLHeadingElement, idMap: Map<string, number>) {
        let id = h.id;
        if (id) {
            addToMap(id);
        } else {
            id = (h.textContent || '').trim().toLowerCase().replace(/\W+/g, '-');
            id = addToMap(id);
            h.id = id;
        }
        return id;

        // 把标题id添加到Map中，防止重复创建id，返回值：id、id-2...
        function addToMap(hId: string) {
            const oldCount = idMap.get(hId) || 0;
            const newCount = oldCount + 1;
            idMap.set(hId, newCount);
            return newCount === 1 ? hId : `${hId}-${newCount}`;
        }
    }

}
