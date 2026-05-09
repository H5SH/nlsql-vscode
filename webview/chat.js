const vscode = acquireVsCodeApi();

// Load settings as soon as webview starts
vscode.postMessage({ type: 'loadSettings' });

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
    });
});

// Chat Logic
document.getElementById('sendBtn').addEventListener('click', () => {
    sendInput();
});

document.getElementById('userInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendInput();
    }
});

document.getElementById('userInput').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

function sendInput() {
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if (text) {
        addMessage(text, 'user');
        showTypingIndicator();
        vscode.postMessage({ type: 'ask', text: text });
        input.value = '';
        input.style.height = 'auto';
    }
}

// Settings Logic
const modelNameInput = document.getElementById('modelName');
const azureToggleContainer = document.getElementById('azureToggleContainer');

modelNameInput.addEventListener('input', () => {
    if (modelNameInput.value.toLowerCase().startsWith('gpt')) {
        azureToggleContainer.style.display = 'flex';
    } else {
        azureToggleContainer.style.display = 'none';
    }
});

document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const btn = document.getElementById('saveSettingsBtn');
    const originalText = btn.textContent;
    
    const settings = {
        modelName: document.getElementById('modelName').value.trim(),
        apiKey: document.getElementById('apiKey').value.trim(),
        useAzure: document.getElementById('useAzure').checked,
        endpoint: document.getElementById('endpoint').value.trim(),
        sqlConnectionUrl: document.getElementById('sqlConnectionUrl').value.trim()
    };
    
    vscode.postMessage({ type: 'saveSettings', settings });
    
    // UI Feedback
    btn.textContent = "Settings Saved!";
    btn.style.background = "var(--vscode-button-secondaryBackground, #28a745)";
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = "";
    }, 2000);
});


// Message Listeners
window.addEventListener('message', event => {
    const message = event.data;
    if (message.type === 'response') {
        removeTypingIndicator();
        renderResponse(message.data);
    } else if (message.type === 'error') {
        removeTypingIndicator();
        renderError(message.error);
    } else if (message.type === 'settingsLoaded') {
        document.getElementById('modelName').value = message.settings.modelName || '';
        document.getElementById('apiKey').value = message.settings.apiKey || '';
        document.getElementById('useAzure').checked = message.settings.useAzure || false;
        document.getElementById('endpoint').value = message.settings.endpoint || '';
        document.getElementById('sqlConnectionUrl').value = message.settings.sqlConnectionUrl || '';
        
        // Trigger initial visibility check
        if (document.getElementById('modelName').value.toLowerCase().startsWith('gpt')) {
            azureToggleContainer.style.display = 'flex';
        }
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
    
    // Handle Conversational Message
    if (data.message) {
        const textDiv = document.createElement('div');
        textDiv.textContent = data.message;
        msgDiv.appendChild(textDiv);
    }

    // Handle Generated SQL
    if (data.sql) {
        const sqlHeader = document.createElement('div');
        sqlHeader.style.fontSize = '0.8em';
        sqlHeader.style.opacity = '0.7';
        sqlHeader.style.marginBottom = '4px';
        sqlHeader.textContent = 'Generated SQL:';
        msgDiv.appendChild(sqlHeader);

        const sqlDiv = document.createElement('div');
        sqlDiv.className = 'sql-block';
        sqlDiv.textContent = data.sql;
        msgDiv.appendChild(sqlDiv);
    }

    // Handle Database Execution Error
    if (data.error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'var(--vscode-errorForeground)';
        errorDiv.style.marginTop = '8px';
        errorDiv.style.fontSize = '0.9em';
        errorDiv.style.padding = '8px';
        errorDiv.style.background = 'rgba(255,0,0,0.1)';
        errorDiv.style.borderLeft = '3px solid var(--vscode-errorForeground)';
        errorDiv.textContent = `Database Error: ${data.error}`;
        msgDiv.appendChild(errorDiv);
    }

    // Handle Query Results Table
    if (data.results && Array.isArray(data.results)) {
        if (data.results.length === 0) {
            const noRes = document.createElement('div');
            noRes.style.marginTop = '8px';
            noRes.style.fontStyle = 'italic';
            noRes.textContent = data.is_execution ? 'Query executed successfully.' : 'Query returned no results.';
            msgDiv.appendChild(noRes);
        } else {
            const tableContainer = document.createElement('div');
            tableContainer.style.overflowX = 'auto';
            tableContainer.style.marginTop = '8px';

            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');
            
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
            
            table.appendChild(thead);
            table.appendChild(tbody);
            tableContainer.appendChild(table);
            msgDiv.appendChild(tableContainer);
        }
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
function showTypingIndicator() {
    const messages = document.getElementById('messages');
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'typing-indicator';
    indicator.innerHTML = 'Thinking <div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
    messages.appendChild(indicator);
    messages.scrollTop = messages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}
