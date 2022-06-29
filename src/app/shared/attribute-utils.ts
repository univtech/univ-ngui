// 处理HTML元素属性的工具
import {ElementRef} from '@angular/core';

/**
 * HTML元素属性Map
 */
export interface AttrMap {
    [key: string]: string;
}

/**
 * 从HTML元素或HTML元素引用的attributes中获取属性，并转换为Map。<br>
 * 因为查找不区分大小写，所以属性Map的Key强制转换为小写。
 *
 * @param el 属性来源，HTML元素（HTMLElement）或HTML元素引用（ElementRef）
 */
export function getAttrs(el: HTMLElement | ElementRef): AttrMap {
    const attrs: NamedNodeMap = el instanceof ElementRef ? el.nativeElement.attributes : el.attributes;
    const attrMap: AttrMap = {};
    // 转换原因：https://github.com/Microsoft/TypeScript/issues/2695
    for (const attr of attrs as any as Attr[]) {
        attrMap[attr.name.toLowerCase()] = attr.value;
    }
    return attrMap;
}

/**
 * 获取属性值。
 *
 * @param attrMap 属性Map
 * @param attr 属性名
 */
export function getAttrValue(attrMap: AttrMap, attr: string | string[]): string | undefined {
    const key = (typeof attr === 'string') ? attr : attr.find(a => attrMap.hasOwnProperty(a.toLowerCase()));
    return (key === undefined) ? undefined : attrMap[key.toLowerCase()];
}

/**
 * 把属性值转换为boolean类型
 *
 * @param attrValue 属性值，属性未定义时为undefined
 * @param defaultValue 属性未定义时的默认值
 */
export function boolFromValue(attrValue: string | undefined, defaultValue: boolean = false) {
    return attrValue === undefined ? defaultValue : attrValue.trim() !== 'false';
}

/**
 * 从HTML元素或HTML元素引用中获取指定属性的boolean值。
 *
 * @param el 属性来源，HTML元素（HTMLElement）或HTML元素引用（ElementRef）
 * @param attr 属性名
 * @param defaultValue 属性未定义时的默认值
 */
export function getBoolFromAttribute(
    el: HTMLElement | ElementRef,
    attr: string | string[],
    defaultValue: boolean = false): boolean {
    return boolFromValue(getAttrValue(getAttrs(el), attr), defaultValue);
}
