import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// 简单防抖函数
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        if (timer) return; // 防重复点击
        fn(...args);
        timer = setTimeout(() => {
            timer = null;
        }, delay);
    };
}

// Markdown 格式优化
function formatMarkdown(md) {
    if (!md) return '';
    // 去掉首尾多余空行
    md = md.replace(/^\s+|\s+$/g, '');
    // 多行空行统一为一行
    md = md.replace(/\n{3,}/g, '\n\n');
    // 可选统一缩进（这里保持原样）
    return md;
}

function App() {
    const [markdown, setMarkdown] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [highlight, setHighlight] = useState(false);
    const textareaRef = useRef(null);
    const [title, setTitle] = useState('clip'); // 默认标题

    const handleExtract = debounce(() => {
        setLoading(true);
        setError('');
        setMarkdown('');

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || !tabs[0]) {
                setError('未找到当前标签页');
                setLoading(false);
                return;
            }

            chrome.tabs.sendMessage(
                tabs[0].id,
                { type: 'EXTRACT_MARKDOWN' },
                (response) => {
                    setLoading(false);

                    if (chrome.runtime.lastError) {
                        setError(chrome.runtime.lastError.message);
                        return;
                    }

                    if (response?.ok) {
                        let md = formatMarkdown(response.markdown);
                        setMarkdown(md);

                        // 保存标题
                        const t = response.title?.trim() || 'clip';
                        setTitle(t.replace(/[\\/:*?"<>|]/g, '_')); // 替换文件名非法字符

                        setHighlight(true);
                        textareaRef.current?.focus();
                        setTimeout(() => setHighlight(false), 2000);
                    } else {
                        setError(response?.error || '提取失败');
                    }
                }
            );
        });
    }, 500);

    const handleCopy = debounce(async () => {
        if (!markdown) return;
        try {
            let md = formatMarkdown(markdown);
            await navigator.clipboard.writeText(md);
            setCopied(true);
            setHighlight(true);
            textareaRef.current?.focus();
            setTimeout(() => {
                setCopied(false);
                setHighlight(false);
            }, 2000);
        } catch (e) {
            setError('复制失败，请手动复制');
        }
    }, 500);

    const handleClear = () => {
        setMarkdown('');
        setCopied(false);
        setError('');
    };

    const handleDownload = () => {
        if (!markdown) return;
        const md = formatMarkdown(markdown);
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.md`; // 用文章标题命名
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div
            style={{
                padding: '16px',
                width: '400px',
                boxSizing: 'border-box',
                fontFamily: 'Arial, sans-serif',
                background: '#f9f9f9',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
        >
            <h3 style={{ margin: '0 0 12px', color: '#333' }}>Clip Markdown</h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button
                    onClick={handleExtract}
                    disabled={loading}
                    style={{
                        flex: 1,
                        padding: '6px 0',
                        backgroundColor: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? '提取中…' : '提取 Markdown'}
                </button>

                <button
                    onClick={handleCopy}
                    disabled={!markdown || copied}
                    style={{
                        flex: 1,
                        padding: '6px 0',
                        backgroundColor: copied ? '#ccc' : '#2196f3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !markdown || copied ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.3s'
                    }}
                >
                    {copied ? '已复制 √' : '复制 Markdown'}
                </button>

                <button
                    onClick={handleDownload}
                    disabled={!markdown}
                    style={{
                        flex: 1,
                        padding: '6px 0',
                        backgroundColor: '#ff9800',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !markdown ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.3s'
                    }}
                >
                    下载 Markdown
                </button>

                <button
                    onClick={handleClear}
                    disabled={!markdown}
                    style={{
                        flex: 1,
                        padding: '6px 0',
                        backgroundColor: '#f44336',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !markdown ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.3s'
                    }}
                >
                    清空
                </button>
            </div>

            {error && (
                <div style={{ color: 'red', marginBottom: '8px' }}>{error}</div>
            )}

            <textarea
                value={markdown}
                readOnly
                ref={textareaRef}
                placeholder="这里将显示提取后的 Markdown 内容"
                style={{
                    width: '100%',
                    height: '300px',
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: highlight ? '1px solid #4caf50' : '1px solid #ccc',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                    outline: 'none',
                    boxSizing: 'border-box'
                }}
            />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
