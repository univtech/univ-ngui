import {htmlFromStringKnownToSatisfyTypeContract} from 'safevalues/unsafe/reviewed';

// 把指定元素的innerHTML转换为TrustedHTML
export function fromInnerHTML(el: Element): TrustedHTML {
    // 安全性：现有innerHTML内容已经可信
    // 执行unchecked转换：把满足TrustedHTML类型约定的字符串转换为TrustedHTML
    return htmlFromStringKnownToSatisfyTypeContract(el.innerHTML, '^');
}

// 把指定元素的outerHTML转换为TrustedHTML
export function fromOuterHTML(el: Element): TrustedHTML {
    // 安全性：现有outerHTML内容已经可信
    // 执行unchecked转换：把满足TrustedHTML类型约定的字符串转换为TrustedHTML
    return htmlFromStringKnownToSatisfyTypeContract(el.outerHTML, '^');
}

// 把SVG常量转换为TrustedHTML
export function svg(constantSvg: TemplateStringsArray): TrustedHTML {
    // 安全性：没有插值的模板字面参数是常量，因此可信
    // 执行unchecked转换：把满足TrustedHTML类型约定的字符串转换为TrustedHTML
    return htmlFromStringKnownToSatisfyTypeContract(constantSvg[0], '^');
}
