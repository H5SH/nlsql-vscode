"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonRunner = void 0;
const child_process_1 = require("child_process");
const path = require("path");
class PythonRunner {
    constructor(extensionPath) {
        this.extensionPath = extensionPath;
        this.buffer = '';
    }
    start() {
        if (this.process)
            return;
        const scriptPath = path.join(this.extensionPath, 'python', 'agent.py');
        this.process = (0, child_process_1.spawn)('python3', [scriptPath]);
        this.process.stdout?.on('data', (data) => {
            this.buffer += data.toString();
            // Process NDJSON (Newline Delimited JSON)
            let lines = this.buffer.split('\n');
            this.buffer = lines.pop() || ''; // keep the incomplete line in the buffer
            for (let line of lines) {
                if (line.trim()) {
                    try {
                        const parsed = JSON.parse(line);
                        this.onMessageCallback?.(parsed);
                    }
                    catch (e) {
                        console.error('Error parsing python output:', line);
                    }
                }
            }
        });
        this.process.stderr?.on('data', (data) => {
            console.error('Python Stderr:', data.toString());
        });
        this.process.on('close', (code) => {
            console.log(`Python process exited with code ${code}`);
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