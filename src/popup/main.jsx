import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
    const handleClick = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'TEST' }, (response) => {
                console.log('content script 返回：', response);
            });
        });
    };

    return (
        <div style={{ padding: '20px' }}>
            <h3>点击测试按钮</h3>
            <button onClick={handleClick}>点击我发送消息</button>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
