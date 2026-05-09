"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonRunner = void 0;
const child_process_1 = require("child_process");
const path = require("path");
const fs = require("fs");
const vscode = require("vscode");
class PythonRunner {
    constructor(extensionPath) {
        this.extensionPath = extensionPath;
        this.buffer = '';
        this.venvPath = path.join(this.extensionPath, 'python', '.venv');
        // Determine the executable path based on platform
        if (process.platform === 'win32') {
            this.pythonExec = path.join(this.venvPath, 'Scripts', 'python.exe');
        }
        else {
            this.pythonExec = path.join(this.venvPath, 'bin', 'python');
        }
    }
    setupEnvironment(outputChannel) {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(this.pythonExec)) {
                outputChannel.appendLine("Virtual environment already exists.");
                resolve();
                return;
            }
            outputChannel.appendLine("Creating virtual environment...");
            try {
                // Determine system python
                const sysPython = process.platform === 'win32' ? 'python' : 'python3';
                (0, child_process_1.execSync)(`${sysPython} -m venv ${this.venvPath}`, { cwd: this.extensionPath });
                outputChannel.appendLine("Installing requirements...");
                const reqPath = path.join(this.extensionPath, 'python', 'requirements.txt');
                // Use pip from the newly created venv
                const pipExec = process.platform === 'win32'
                    ? path.join(this.venvPath, 'Scripts', 'pip.exe')
                    : path.join(this.venvPath, 'bin', 'pip');
                (0, child_process_1.execSync)(`${pipExec} install -r ${reqPath}`, { cwd: this.extensionPath });
                outputChannel.appendLine("Virtual environment setup complete.");
                resolve();
            }
            catch (error) {
                outputChannel.appendLine(`Failed to setup Python environment: ${error.message}`);
                reject(error);
            }
        });
    }
    async start(outputChannel) {
        if (this.process)
            return;
        try {
            outputChannel.show();
            await this.setupEnvironment(outputChannel);
        }
        catch (e) {
            vscode.window.showErrorMessage("Failed to setup Python environment. Check output log.");
            return;
        }
        const scriptPath = path.join(this.extensionPath, 'python', 'agent.py');
        this.process = (0, child_process_1.spawn)(this.pythonExec, [scriptPath]);
        this.process.stdout?.on('data', (data) => {
            this.buffer += data.toString();
            let lines = this.buffer.split('\n');
            this.buffer = lines.pop() || '';
            for (let line of lines) {
                if (line.trim()) {
                    try {
                        const parsed = JSON.parse(line);
                        this.onMessageCallback?.(parsed);
                    }
                    catch (e) {
                        outputChannel.appendLine(`Error parsing python output: ${line}`);
                    }
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
    onMessage(callback) {
        this.onMessageCallback = callback;
    }
    sendMessage(msg) {
        if (!this.process)
            return;
        this.process.stdin?.write(JSON.stringify(msg) + '\n');
    }
    stop() {
        if (this.process) {
            this.process.kill();
            this.process = undefined;
        }
    }
}
exports.PythonRunner = PythonRunner;
//# sourceMappingURL=pythonRunner.js.map