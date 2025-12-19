console.log('content script loaded');

function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const el = document.querySelector(selector);
        if (el) return resolve(el);

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`等待元素 ${selector} 超时`));
        }, timeout);
    });
}

// 清理 HTML，去掉 style 标签和内联样式
function cleanHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html;

    // 删除所有 style 标签
    div.querySelectorAll('style').forEach(el => el.remove());

    // 删除所有元素的 style 属性
    div.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));

    return div.innerHTML;
}

// 深度提取文本，保留换行和缩进
function getAllText(el) {
    let result = '';
    el.childNodes.forEach(child => {
        if (child.nodeType === 3) result += child.nodeValue;
        else if (child.nodeType === 1) result += getAllText(child);
    });
    return result;
}

// 自定义 Turndown 规则：保留 <pre> 原始文本和语言
function addCodeBlockRule(turndownService) {
    turndownService.addRule('codeWithChildren', {
        filter: node => node.nodeName === 'PRE',
        replacement: function (content, node) {
            const codeText = getAllText(node)
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .replace(/^\n+|\n+$/g, ''); // 去掉首尾空行

            let lang = '';
            if (node.querySelector('code')) {
                const cls = node.querySelector('code').className;
                const m = cls.match(/language-(\w+)/) || cls.match(/hljs (\w+)/);
                if (m) lang = m[1];
            }

            return `\n\`\`\`${lang}\n${codeText}\n\`\`\`\n`;
        }
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXTRACT_MARKDOWN') {
        (async () => {
            try {
                if (!location.host.includes('juejin.cn')) {
                    sendResponse({ ok: false, error: '当前不是掘金页面' });
                    return;
                }

                const titleEl = await waitForElement('h1.article-title, h1');
                const contentEl = await waitForElement('article, .article-content, .main-content');

                const title = titleEl ? titleEl.innerText.trim() : '掘金文章';

                // 清理 HTML
                const contentHtml = cleanHtml(contentEl.innerHTML);

                const turndownService = new TurndownService({
                    headingStyle: 'atx',
                    codeBlockStyle: 'fenced'
                });
                addCodeBlockRule(turndownService);

                let markdownBody = turndownService.turndown(contentHtml);

                const firstHeading = contentEl.querySelector('h1');
                if (!firstHeading || firstHeading.innerText.trim() !== title) {
                    markdownBody = `# ${title}\n\n${markdownBody}`;
                }

                const markdown = markdownBody;

                sendResponse({
                    ok: true,
                    site: 'juejin',
                    markdown,
                    length: markdown.length
                });
            } catch (err) {
                sendResponse({ ok: false, error: err.message });
            }
        })();

        return true;
    }
});
