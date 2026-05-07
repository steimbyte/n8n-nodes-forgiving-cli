"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecuteCommandPlus = void 0;
const child_process_1 = require("child_process");
const iconv = __importStar(require("iconv-lite"));

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
}

async function execPromise(command, options) {
    const returnData = {
        error: undefined,
        exitCode: 0,
        stderr: '',
        stdout: '',
    };

    const shell = options.shell || '/bin/bash';
    const timeout = options.timeout || 120000;
    const cwd = options.cwd || undefined;
    const maxBuffer = (options.maxBuffer || 1024) * 1024;
    const killSignal = options.killSignal || 'SIGTERM';
    const env = { ...process.env, ...options.env };

    return await new Promise((resolve, _reject) => {
        const proc = (0, child_process_1.exec)(command, {
            cwd,
            timeout,
            maxBuffer,
            shell,
            killSignal,
            env
        }, (error, stdout, stderr) => {
            returnData.stdout = iconv.decode(Buffer.from(stdout || '', 'binary'), options.encoding || 'utf-8').trim();
            returnData.stderr = iconv.decode(Buffer.from(stderr || '', 'binary'), options.encoding || 'utf-8').trim();
            
            if (error) {
                returnData.error = error;
            }
            resolve(returnData);
        });
        
        proc.on('exit', (code) => {
            returnData.exitCode = code || 0;
        });
    });
}

function formatAIOutput(data, includeSettings) {
    const output = {
        cmd_success: data.success,
        cmd_exit: data.exitCode,
        cmd_stdout: includeSettings.includeStdout ? data.stdout : undefined,
        cmd_stderr: includeSettings.includeStderr ? data.stderr : undefined,
        cmd_error: includeSettings.includeError && data.error ? data.error : undefined
    };
    
    // Remove undefined values
    Object.keys(output).forEach(key => {
        if (output[key] === undefined) delete output[key];
    });
    
    const jsonStr = JSON.stringify(output);
    const hash = simpleHash(jsonStr);
    
    return `=== CMD OUTPUT START ===\n${jsonStr}\n=== CMD OUTPUT END [${hash}] ===`;
}

class ExecuteCommandPlus {
    constructor() {
        this.description = {
            displayName: 'Execute Command Plus',
            name: 'executeCommandPlus',
            icon: 'fa:terminal',
            iconColor: 'blue',
            group: ['transform'],
            version: 9,
            description: 'Execute shell command with forgiving error handling for AI agents',
            defaults: {
                name: 'Execute Command Plus',
                color: '#886644',
            },
            usableAsTool: true,
            inputs: ['main'],
            outputs: ['main'],
            properties: [
                {
                    displayName: 'Execute Once',
                    name: 'executeOnce',
                    type: 'boolean',
                    default: false,
                    description: 'Whether to execute only once instead of once for each entry',
                },
                {
                    displayName: 'Forgiving Mode',
                    name: 'forgiving',
                    type: 'boolean',
                    default: true,
                    description: 'When ON: commands with errors still count as success (workflow continues). When OFF: errors stop the workflow.',
                },
                {
                    displayName: 'Minimum Delay (ms)',
                    name: 'delay',
                    type: 'number',
                    default: 0,
                    description: 'Minimum delay in milliseconds before executing the command',
                },
                {
                    displayName: 'Encoding',
                    name: 'encoding',
                    type: 'string',
                    default: 'utf-8',
                    required: true,
                    description: 'The character encoding for output',
                },
                {
                    displayName: 'Command',
                    name: 'command',
                    typeOptions: {
                        rows: 5,
                    },
                    type: 'string',
                    default: '',
                    placeholder: 'echo "Hello World"',
                    description: 'The command to execute',
                    required: true,
                },
                {
                    displayName: 'Working Directory',
                    name: 'cwd',
                    type: 'string',
                    default: '',
                    description: 'Working directory for the command (leave empty for default)',
                },
                {
                    displayName: 'Timeout (ms)',
                    name: 'timeout',
                    type: 'number',
                    default: 120000,
                    description: 'Maximum execution time in milliseconds',
                },
                {
                    displayName: 'Shell',
                    name: 'shell',
                    type: 'options',
                    options: [
                        { name: '/bin/bash', value: '/bin/bash' },
                        { name: '/bin/sh', value: '/bin/sh' },
                        { name: '/usr/bin/bash', value: '/usr/bin/bash' },
                        { name: '/usr/bin/zsh', value: '/usr/bin/zsh' },
                    ],
                    default: '/bin/bash',
                    description: 'Shell to use for command execution',
                },
                {
                    displayName: 'Max Buffer (KB)',
                    name: 'maxBuffer',
                    type: 'number',
                    default: 1024,
                    description: 'Maximum stdout/stderr buffer size in KB',
                },
                {
                    displayName: 'Kill Signal',
                    name: 'killSignal',
                    type: 'options',
                    options: [
                        { name: 'SIGTERM', value: 'SIGTERM' },
                        { name: 'SIGKILL', value: 'SIGKILL' },
                        { name: 'SIGINT', value: 'SIGINT' },
                    ],
                    default: 'SIGTERM',
                    description: 'Signal to send when killing the process on timeout',
                },
                {
                    displayName: 'Output Settings',
                    name: 'outputSettings',
                    type: 'collection',
                    placeholder: 'Add Output Toggle',
                    options: [
                        {
                            displayName: 'Include stdout',
                            name: 'includeStdout',
                            type: 'boolean',
                            default: true,
                            description: 'Include stdout in output',
                        },
                        {
                            displayName: 'Include stderr',
                            name: 'includeStderr',
                            type: 'boolean',
                            default: true,
                            description: 'Include stderr in output',
                        },
                        {
                            displayName: 'Include exitCode',
                            name: 'includeExitCode',
                            type: 'boolean',
                            default: true,
                            description: 'Include exit code in output',
                        },
                        {
                            displayName: 'Include error',
                            name: 'includeError',
                            type: 'boolean',
                            default: true,
                            description: 'Include error message in output',
                        },
                        {
                            displayName: 'Include success',
                            name: 'includeSuccess',
                            type: 'boolean',
                            default: true,
                            description: 'Include success flag in output',
                        },
                    ],
                },
                {
                    displayName: 'AI Agent Output',
                    name: 'aiOutput',
                    type: 'boolean',
                    default: false,
                    description: 'When ON: format output with wrapper tags and prefixed keys to prevent LLM confusion (=== CMD OUTPUT START/END ===)',
                },
            ],
        };
    }

    async execute() {
        let items = this.getInputData();
        const executeOnce = this.getNodeParameter('executeOnce', 0);
        const forgiving = this.getNodeParameter('forgiving', 0);
        const delay = this.getNodeParameter('delay', 0) || 0;
        const aiOutput = this.getNodeParameter('aiOutput', 0);
        
        if (executeOnce) {
            items = [items[0] || { json: {} }];
        }

        const returnItems = [];
        const encoding = this.getNodeParameter('encoding', 0);
        const command = this.getNodeParameter('command', 0);
        const cwd = this.getNodeParameter('cwd', 0) || undefined;
        const timeout = this.getNodeParameter('timeout', 0) || 120000;
        const shell = this.getNodeParameter('shell', 0) || '/bin/bash';
        const maxBuffer = this.getNodeParameter('maxBuffer', 0) || 1024;
        const killSignal = this.getNodeParameter('killSignal', 0) || 'SIGTERM';
        const outputSettings = this.getNodeParameter('outputSettings', 0) || {};

        const includeStdout = outputSettings.includeStdout !== false;
        const includeStderr = outputSettings.includeStderr !== false;
        const includeExitCode = outputSettings.includeExitCode !== false;
        const includeError = outputSettings.includeError !== false;
        const includeSuccess = outputSettings.includeSuccess !== false;

        const options = {
            encoding,
            cwd,
            timeout,
            shell,
            maxBuffer,
            killSignal,
            env: {}
        };

        const includeConfig = { includeStdout, includeStderr, includeExitCode, includeError, includeSuccess };

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            // Apply minimum delay before execution
            if (delay > 0) {
                await sleep(delay);
            }

            const result = { json: {}, pairedItem: { item: itemIndex } };

            try {
                if (!command || command.trim() === '') {
                    if (aiOutput) {
                        result.json.output = formatAIOutput({
                            success: false,
                            exitCode: 1,
                            stdout: '',
                            stderr: '',
                            error: 'Command is empty'
                        }, includeConfig);
                    } else {
                        if (includeSuccess) result.json.success = false;
                        if (includeError) result.json.error = 'Command is empty';
                        if (includeExitCode) result.json.exitCode = 1;
                    }
                    
                    if (!forgiving) {
                        throw new Error('Command is empty');
                    }
                    returnItems.push(result);
                    continue;
                }

                const { error, exitCode, stdout, stderr } = await execPromise(command, options);
                
                if (aiOutput) {
                    result.json.output = formatAIOutput({
                        success: !error,
                        exitCode: exitCode || 0,
                        stdout: stdout || '',
                        stderr: stderr || '',
                        error: error ? (error.message || 'Command failed') : ''
                    }, includeConfig);
                } else {
                    if (includeSuccess) result.json.success = !error;
                    if (includeExitCode) result.json.exitCode = exitCode || 0;
                    if (includeStdout) result.json.stdout = stdout || '';
                    if (includeStderr) result.json.stderr = stderr || '';
                    if (includeError) result.json.error = error ? (error.message || 'Command failed') : '';
                }

                if (error && !forgiving) {
                    throw error;
                }
            } catch (err) {
                if (aiOutput) {
                    result.json.output = formatAIOutput({
                        success: false,
                        exitCode: 1,
                        stdout: '',
                        stderr: '',
                        error: err.message || 'Command execution failed'
                    }, includeConfig);
                } else {
                    if (includeSuccess) result.json.success = false;
                    if (includeError) result.json.error = err.message || 'Command execution failed';
                    if (includeExitCode) result.json.exitCode = 1;
                }
                
                if (!forgiving) {
                    throw err;
                }
            }

            returnItems.push(result);
        }

        return [returnItems];
    }
}
exports.ExecuteCommandPlus = ExecuteCommandPlus;
