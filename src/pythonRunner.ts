import { spawn, ChildProcess, execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export class PythonRunner {
    private process?: ChildProcess;
    private onMessageCallback?: (msg: any) => void;
    private buffer = '';
    private venvPath: string;
    private pythonExec: string;

    constructor(private extensionPath: string) {
        this.venvPath = path.join(this.extensionPath, 'python', '.venv');

        if (process.platform === 'win32') {
            this.pythonExec = path.join(this.venvPath, 'Scripts', 'python.exe');
        } else {
            this.pythonExec = path.join(this.venvPath, 'bin', 'python');
        }
    }

    /**
     * Convert raw python response into clean markdown
     */
    private formatResponse(data: any): any {
        // If already string → return as-is
        if (typeof data === 'string') {
            return {
                raw: data,
                markdown: data
            };
        }

        const message = data?.message || data?.msg || '';
        const sql = data?.sql || data?.query || '';
        const error = data?.error;

        let markdown = '';

        // Title / Message section
        if (message) {
            markdown += `### 🧠 Response\n\n${message}\n\n`;
        }

        // SQL section (formatted properly)
        if (sql) {
            markdown += `### 🗄️ SQL Query\n\n`;
            markdown += `\`\`\`sql\n${sql.trim()}\n\`\`\`\n\n`;
        }

        // Error section (if any)
        if (error) {
            markdown += `### ❌ Error\n\n\`\`\`\n${error}\n\`\`\`\n`;
        }

        // Fallback if nothing structured
        if (!markdown) {
            markdown = '```json\n' + JSON.stringify(data, null, 2) + '\n```';
        }

        return {
            ...data,
            markdown,
            raw: data
        };
    }

    private setupEnvironment(outputChannel: vscode.OutputChannel): Promise<void> {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(this.pythonExec)) {
                outputChannel.appendLine("Virtual environment already exists.");
                resolve();
                return;
            }

            outputChannel.appendLine("Creating virtual environment...");
            try {
                const sysPython = process.platform === 'win32' ? 'python' : 'python3';
                execSync(`${sysPython} -m venv ${this.venvPath}`, { cwd: this.extensionPath });

                outputChannel.appendLine("Installing requirements...");
                const reqPath = path.join(this.extensionPath, 'python', 'requirements.txt');

                const pipExec = process.platform === 'win32'
                    ? path.join(this.venvPath, 'Scripts', 'pip.exe')
                    : path.join(this.venvPath, 'bin', 'pip');

                execSync(`${pipExec} install -r ${reqPath}`, { cwd: this.extensionPath });

                outputChannel.appendLine("Virtual environment setup complete.");
                resolve();
            } catch (error: any) {
                outputChannel.appendLine(`Failed to setup Python environment: ${error.message}`);
                reject(error);
            }
        });
    }

    async start(outputChannel: vscode.OutputChannel) {
        if (this.process) return;

        try {
            outputChannel.show();
            await this.setupEnvironment(outputChannel);
        } catch (e) {
            vscode.window.showErrorMessage("Failed to setup Python environment. Check output log.");
            return;
        }

        const scriptPath = path.join(this.extensionPath, 'python', 'main.py');
        this.process = spawn(this.pythonExec, [scriptPath]);

        this.process.stdout?.on('data', (data) => {
            this.buffer += data.toString();

            let lines = this.buffer.split('\n');
            this.buffer = lines.pop() || '';

            for (let line of lines) {
                if (!line.trim()) continue;

                try {
                    const parsed = JSON.parse(line);

                    // ✅ FORMAT OUTPUT NICELY HERE
                    const formatted = this.formatResponse(parsed);

                    this.onMessageCallback?.(formatted);
                } catch (e) {
                    outputChannel.appendLine(`Error parsing python output: ${line} ${e}`);
                }
            }
        });

        this.process.stderr?.on('data', (data) => {
            outputChannel.appendLine(`Python Stderr: ${data.toString()}`);
        });

        this.process.on('close', (code) => {
            outputChannel.appendLine(`Python process exited with code ${code}`);
            this.process = undefined;
        });
    }

    onMessage(callback: (msg: any) => void) {
        this.onMessageCallback = callback;
    }

    sendMessage(msg: any) {
        if (!this.process) return;
        this.process.stdin?.write(JSON.stringify(msg) + '\n');
    }

    stop() {
        if (this.process) {
            this.process.kill();
            this.process = undefined;
        }
    }
}