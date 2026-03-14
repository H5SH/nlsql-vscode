const vscode = acquireVsCodeApi();

document.getElementById('sendBtn').addEventListener('click', () => {
    sendInput();
});

document.getElementById('userInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendInput();
    }
});

function sendInput() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if (text) {
        addMessage(text, 'user');
        vscode.postMessage({ type: 'ask', text: text });
        input.value = '';
    }
}

window.addEventListener('message', event => {
    const message = event.data;
    if (message.type === 'response') {
        renderResponse(message.data);
    } else if (message.type === 'error') {
        renderError(message.error);
    }
});

function addMessage(text, sender) {
    const messages = document.getElementById('messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.textContent = text;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
}

function renderResponse(data) {
    const messages = document.getElementById('messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    
    if (data.sql) {
        const sqlDiv = document.createElement('div');
        sqlDiv.className = 'sql-block';
        sqlDiv.textContent = data.sql;
        msgDiv.appendChild(sqlDiv);
    }

    if (data.results && Array.isArray(data.results)) {
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        
        if (data.results.length > 0) {
            // headers
            const tr = document.createElement('tr');
            Object.keys(data.results[0]).forEach(key => {
                const th = document.createElement('th');
                th.textContent = key;
                tr.appendChild(th);
            });
            thead.appendChild(tr);

            // rows
            data.results.forEach(row => {
                const trData = document.createElement('tr');
                Object.values(row).forEach(val => {
                    const td = document.createElement('td');
                    td.textContent = val;
                    trData.appendChild(td);
                });
                tbody.appendChild(trData);
            });
        }
        
        table.appendChild(thead);
        table.appendChild(tbody);
        msgDiv.appendChild(table);
    }

    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
}

function renderError(errorMsg) {
    const messages = document.getElementById('messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot error';
    msgDiv.style.color = "var(--vscode-errorForeground, red)";
    msgDiv.textContent = errorMsg;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
}
