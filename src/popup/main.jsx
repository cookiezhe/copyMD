import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
    const [markdown, setMarkdown] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleExtract = () => {
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
                        setMarkdown(response.markdown);
                    } else {
                        setError(response?.error || '提取失败');
                    }
                }
            );
        });
    };

    const handleCopy = () => {
        if (!markdown) return;
        navigator.clipboard.writeText(markdown).then(() => {
            alert('Markdown 已复制到剪贴板');
        });
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
                    disabled={!markdown}
                    style={{
                        flex: 1,
                        padding: '6px 0',
                        backgroundColor: '#2196f3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: markdown ? 'pointer' : 'not-allowed'
                    }}
                >
                    复制 Markdown
                </button>
            </div>

            {error && (
                <div style={{ color: 'red', marginBottom: '8px' }}>
                    {error}
                </div>
            )}

            <textarea
                value={markdown}
                readOnly
                placeholder="这里将显示提取后的 Markdown 内容"
                style={{
                    width: '100%',
                    height: '300px',
                    marginTop: '8px',
                    padding: '8px 12px', // 上下 8px，左右 12px，保证左右间距
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                    outline: 'none',     // 点击时没有黑色边框
                    boxSizing: 'border-box' // 关键：padding 包含在 width 内
                }}
            />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
