import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function runPython(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
        // 서버 폴더의 절대 경로 구하기 (src/utils에서 server 루트로)
        const serverDir = path.resolve(__dirname, '../..');

        // 가상환경 Python 경로 설정
        const isWindows = os.platform() === 'win32';
        const venvPythonPath = isWindows
            ? path.join(serverDir, 'venv', 'Scripts', 'python.exe')
            : path.join(serverDir, 'venv', 'bin', 'python');

        // 시스템 Python 경로 (백업)
        const systemPython = isWindows ? 'python' : 'python3';

        // 스크립트 절대 경로
        const absoluteScriptPath = path.join(serverDir, scriptPath);

        // 가상환경 Python이 존재하는지 확인
        let pythonPath = systemPython;
        if (fs.existsSync(venvPythonPath)) {
            pythonPath = venvPythonPath;
        }

        // 스크립트 파일 존재 확인
        if (!fs.existsSync(absoluteScriptPath)) {
            reject(new Error(`Python 스크립트를 찾을 수 없습니다: ${absoluteScriptPath}`));
            return;
        }

        const py = spawn(pythonPath, [absoluteScriptPath, ...args], {
            cwd: serverDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        });

        let stdoutData = '';
        let stderrData = '';

        py.stdout.on('data', (chunk) => {
            const output = chunk.toString('utf-8');
            stdoutData += output;
        });

        py.stderr.on('data', (chunk) => {
            const errorOutput = chunk.toString('utf-8');
            stderrData += errorOutput;
        });

        py.on('close', (code) => {
            if (code !== 0) {
                console.error('❌ Python 실행 실패:');
                console.error('  - Exit Code:', code);
                console.error('  - stderr:', stderrData);
                console.error('  - stdout:', stdoutData);
                reject(new Error(`Python 스크립트 실행 실패 (코드: ${code})\nstderr: ${stderrData}`));
                return;
            }

            // if (!stdoutData) {
            //   reject(new Error("Python 스크립트에서 출력이 없습니다"));
            //   return;
            // }

            try {
                if (!stdoutData.trim()) {
                    console.error('❌ Python에서 출력이 없습니다');
                    reject(new Error('Python 스크립트에서 출력이 없습니다'));
                    return;
                }

                const result = JSON.parse(stdoutData);
                resolve(result);
            } catch (parseError) {
                console.error('❌ JSON 파싱 실패:');
                console.error('  - 파싱 에러:', parseError.message);
                console.error('  - 원본 데이터:', stdoutData);
                console.error('  - 원본 데이터 (문자열):', JSON.stringify(stdoutData));
                reject(new Error(`JSON 파싱 실패: ${parseError.message}\n원본 데이터: ${stdoutData}`));
            }
        });

        py.on('error', (error) => {
            console.error('❌ Python 프로세스 시작 실패:', error);
            reject(new Error(`Python 프로세스 시작 실패: ${error.message}`));
        });

        // 타임아웃 설정 (120초)
        const timeout = setTimeout(() => {
            py.kill();
            reject(new Error('Python 스크립트 실행 시간 초과 (120초)'));
        }, 120000);

        py.on('close', () => {
            clearTimeout(timeout);
        });
    });
}
