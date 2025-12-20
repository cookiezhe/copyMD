import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
    const [markdown, setMarkdown] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [highlight, setHighlight] = useState(false);
    const textareaRef=useRef(null);

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
                        setHighlight(true);
                        setTimeout(() => {
                            setHighlight(false);
                        }, 2000);
                        textareaRef.current?.focus();
                    } else {
                        setError(response?.error || '提取失败');
                    }
                }
            );
        });
    };

    const handleCopy = async() => {
        if (!markdown) return;
        try{
            await navigator.clipboard.writeText(markdown);
            setCopied(true);
            setHighlight(true);
            textareaRef.current?.focus();
            setTimeout(() =>{
                setCopied(false)
                setHighlight(false);
            }, 2000);
        }catch(e){
            setError('复制失败,请手动复制');
        }
    };

    const handleClear = () => {
        setMarkdown('');
        setCopied(false);
        setError('');
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
                <div style={{ color: 'red', marginBottom: '8px' }}>
                    {error}
                </div>
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
                    padding: '8px 12px', // 上下 8px，左右 12px，保证左右间距
                    borderRadius: '4px',
                    border: highlight
                        ? '1px solid #4caf50'
                        : '1px solid #ccc',
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
