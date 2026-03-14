import * as vscode from 'vscode';
import { PythonRunner } from './pythonRunner';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    let pythonRunner: PythonRunner | undefined;

    const disposable = vscode.commands.registerCommand('vanna-sql.openChat', () => {
        const panel = vscode.window.createWebviewPanel(
            'vannaSqlChat',
            'Vanna SQL Agent',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webview'))]
            }
        );

        const htmlPath = path.join(context.extensionPath, 'webview', 'chat.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        // Allow loading local resources by replacing {{webviewUri}}
        const webviewUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'webview')));
        htmlContent = htmlContent.replace(/{{webviewUri}}/g, webviewUri.toString());

        panel.webview.html = htmlContent;

        if (!pythonRunner) {
            pythonRunner = new PythonRunner(context.extensionPath);
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

export function deactivate() {}
