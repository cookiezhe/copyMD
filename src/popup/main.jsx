import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
    const [markdown, setMarkdown] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleClick = () => {
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

    return (
        <div
            style={{
                padding: '12px',
                width: '360px',
                boxSizing: 'border-box',
                fontFamily: 'sans-serif'
            }}
        >
            <h3 style={{ margin: '0 0 8px' }}>Clip Markdown</h3>

            <button onClick={handleClick} disabled={loading}>
                {loading ? '提取中…' : '提取 Markdown'}
            </button>

            {error && (
                <div style={{ color: 'red', marginTop: '8px' }}>
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
                    resize: 'none'
                }}
            />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
