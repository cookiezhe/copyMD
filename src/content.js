console.log('content script loaded');

// 假设 turndown.js 已经在 content.js 同目录引入或打包进来
const turndownService = new TurndownService();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TEST') {
        // 克隆页面 body，避免直接修改页面
        const bodyClone = document.body.cloneNode(true);

        // 移除所有 script 标签
        bodyClone.querySelectorAll('script').forEach(script => script.remove());

        // 可选：只提取 main/article 主要内容，如果有
        const mainContent = bodyClone.querySelector('main, article')?.innerHTML || bodyClone.innerHTML;

        // 转换为 Markdown
        const markdown = turndownService.turndown(mainContent);

        // 弹出前 200 字作为测试
        alert(markdown.slice(0, 200));

        // 返回给 popup 的数据
        sendResponse({ ok: true, markdownLength: markdown.length });
    }
});
