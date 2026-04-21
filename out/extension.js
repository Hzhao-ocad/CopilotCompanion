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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
class ReportProgressTool {
    output;
    extensionMode;
    constructor(output, extensionMode) {
        this.output = output;
        this.extensionMode = extensionMode;
    }
    async prepareInvocation(options, _token) {
        return {
            invocationMessage: `Reporting ${options.input.event} (${options.input.stepCurrent}/${options.input.stepTotal})`,
        };
    }
    async invoke(options, _token) {
        console.log('[Copilot Progress Reporter] invoke', options.input);
        const configuredEndpoint = vscode.workspace
            .getConfiguration('copilotReporter')
            .get('endpoint')
            ?.trim() ?? '';
        const devFallbackEndpoint = 'http://127.0.0.1:5000/copilot/progress';
        const endpoint = configuredEndpoint ||
            (this.extensionMode === vscode.ExtensionMode.Development ? devFallbackEndpoint : '');
        const payload = {
            ...options.input,
            timestamp: new Date().toISOString(),
        };
        if (!configuredEndpoint && endpoint) {
            const message = `copilotReporter.endpoint is not configured. Using development fallback endpoint ${endpoint}.`;
            this.output.appendLine(`[warn] ${message}`);
            console.warn(`[Copilot Progress Reporter] ${message}`);
        }
        if (!endpoint) {
            const message = 'copilotReporter.endpoint is not configured. Progress event was not sent.';
            this.output.appendLine(`[warn] ${message}`);
            console.warn(`[Copilot Progress Reporter] ${message}`);
            return this.result(message);
        }
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const message = `Failed to POST progress event (${response.status} ${response.statusText}).`;
                this.output.appendLine(`[error] ${message}`);
                console.error(`[Copilot Progress Reporter] ${message}`);
                return this.result('Progress report failed to send. Continue without blocking the task.');
            }
            console.log('[Copilot Progress Reporter] progress event sent', payload);
            return this.result(`Progress event "${payload.event}" was sent.`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.output.appendLine(`[error] Failed to POST progress event: ${message}`);
            console.error(`[Copilot Progress Reporter] Failed to POST progress event: ${message}`);
            return this.result('Progress report failed due to a network error. Continue without blocking the task.');
        }
    }
    result(message) {
        return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(message)]);
    }
}
function activate(context) {
    const output = vscode.window.createOutputChannel('Copilot Progress Reporter');
    context.subscriptions.push(output);
    const tool = new ReportProgressTool(output, context.extensionMode);
    context.subscriptions.push(vscode.lm.registerTool('reportProgress', tool));
    console.log('[Copilot Progress Reporter] extension activated');
    output.appendLine('[info] Copilot Progress Reporter activated.');
}
function deactivate() { }
//# sourceMappingURL=extension.js.map