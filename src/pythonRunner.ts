import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

export class PythonRunner {
    private process?: ChildProcess;
    private onMessageCallback?: (msg: any) => void;
    private buffer = '';

    constructor(private extensionPath: string) {}

    start() {
        if (this.process) return;

        const scriptPath = path.join(this.extensionPath, 'python', 'agent.py');
        this.process = spawn('python3', [scriptPath]);

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
                    } catch (e) {
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
