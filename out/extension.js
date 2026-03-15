"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const pythonRunner_1 = require("./pythonRunner");
const path = require("path");
const fs = require("fs");
function activate(context) {
    const provider = new VannaSqlChatViewProvider(context.extensionUri, context.extensionPath);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(VannaSqlChatViewProvider.viewType, provider));
    context.subscriptions.push(vscode.commands.registerCommand('vanna-sql.openChat', () => {
        vscode.commands.executeCommand('vanna-sql.chatView.focus');
    }));
}
class VannaSqlChatViewProvider {
    constructor(_extensionUri, _extensionPath) {
        this._extensionUri = _extensionUri;
        this._extensionPath = _extensionPath;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'webview')
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        if (!this.pythonRunner) {
            this.pythonRunner = new pythonRunner_1.PythonRunner(this._extensionPath);
            this.pythonRunner.onMessage((msg) => {
                webviewView.webview.postMessage(msg);
            });
            this.pythonRunner.start();
        }
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'ask': {
                    const config = vscode.workspace.getConfiguration('vannaSql');
                    this.pythonRunner?.sendMessage({
                        type: 'ask',
                        query: message.text,
                        config: {
                            model: config.get('modelName'),
                            apiKey: config.get('apiKey'),
                            endpoint: config.get('endpoint'),
                            sqlConnectionUrl: config.get('sqlConnectionUrl')
                        }
                    });
                    break;
                }
                case 'saveSettings': {
                    const config = vscode.workspace.getConfiguration('vannaSql');
                    config.update('modelName', message.settings.modelName, vscode.ConfigurationTarget.Global);
                    config.update('apiKey', message.settings.apiKey, vscode.ConfigurationTarget.Global);
                    config.update('endpoint', message.settings.endpoint, vscode.ConfigurationTarget.Global);
                    config.update('sqlConnectionUrl', message.settings.sqlConnectionUrl, vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage('Vanna SQL Settings updated!');
                    break;
                }
                case 'loadSettings': {
                    const config = vscode.workspace.getConfiguration('vannaSql');
                    webviewView.webview.postMessage({
                        type: 'settingsLoaded',
                        settings: {
                            modelName: config.get('modelName') || '',
                            apiKey: config.get('apiKey') || '',
                            endpoint: config.get('endpoint') || '',
                            sqlConnectionUrl: config.get('sqlConnectionUrl') || ''
                        }
                    });
                    break;
                }
            }
        });
    }
    _getHtmlForWebview(webview) {
        const htmlPath = path.join(this._extensionPath, 'webview', 'chat.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        // Allow loading local resources by replacing {{webviewUri}}
        const webviewUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview'));
        htmlContent = htmlContent.replace(/{{webviewUri}}/g, webviewUri.toString());
        return htmlContent;
    }
}
VannaSqlChatViewProvider.viewType = 'vanna-sql.chatView';
function deactivate() { }
//# sourceMappingURL=extension.js.map