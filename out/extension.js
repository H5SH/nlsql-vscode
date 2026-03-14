"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const pythonRunner_1 = require("./pythonRunner");
const path = require("path");
const fs = require("fs");
function activate(context) {
    let pythonRunner;
    const disposable = vscode.commands.registerCommand('vanna-sql.openChat', () => {
        const panel = vscode.window.createWebviewPanel('vannaSqlChat', 'Vanna SQL Agent', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webview'))]
        });
        const htmlPath = path.join(context.extensionPath, 'webview', 'chat.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        // Allow loading local resources by replacing {{webviewUri}}
        const webviewUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'webview')));
        htmlContent = htmlContent.replace(/{{webviewUri}}/g, webviewUri.toString());
        panel.webview.html = htmlContent;
        if (!pythonRunner) {
            pythonRunner = new pythonRunner_1.PythonRunner(context.extensionPath);
            pythonRunner.onMessage((msg) => {
                panel.webview.postMessage(msg);
            });
            pythonRunner.start();
        }
        panel.webview.onDidReceiveMessage((message) => {
            if (message.type === 'ask') {
                const config = vscode.workspace.getConfiguration('vannaSql');
                pythonRunner?.sendMessage({
                    type: 'ask',
                    query: message.text,
                    config: {
                        provider: config.get('llmProvider'),
                        apiKey: config.get('apiKey'),
                        endpoint: config.get('endpoint'),
                        sqlConnectionUrl: config.get('sqlConnectionUrl')
                    }
                });
            }
        });
        panel.onDidDispose(() => {
            // Keep the python process running or kill it
            // pythonRunner?.stop();
            // pythonRunner = undefined;
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map