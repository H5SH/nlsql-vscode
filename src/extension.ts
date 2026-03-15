import * as vscode from 'vscode';
import { PythonRunner } from './pythonRunner';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    const provider = new VannaSqlChatViewProvider(context.extensionUri, context.extensionPath);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(VannaSqlChatViewProvider.viewType, provider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vanna-sql.openChat', () => {
            vscode.commands.executeCommand('vanna-sql.chatView.focus');
        })
    );
}

class VannaSqlChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vanna-sql.chatView';
    private _view?: vscode.WebviewView;
    private pythonRunner?: PythonRunner;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _extensionPath: string
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'webview')
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        if (!this.pythonRunner) {
            this.pythonRunner = new PythonRunner(this._extensionPath);
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

    private _getHtmlForWebview(webview: vscode.Webview) {
        const htmlPath = path.join(this._extensionPath, 'webview', 'chat.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Allow loading local resources by replacing {{webviewUri}}
        const webviewUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview'));
        htmlContent = htmlContent.replace(/{{webviewUri}}/g, webviewUri.toString());

        return htmlContent;
    }
}

export function deactivate() {}
