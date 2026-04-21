import * as vscode from 'vscode';

type ProgressEvent = 'task_start' | 'step_complete' | 'task_finish';

interface ReportProgressInput {
	event: ProgressEvent;
	stepCurrent: number;
	stepTotal: number;
	stepLabel: string;
	taskSummary: string;
}

class ReportProgressTool implements vscode.LanguageModelTool<ReportProgressInput> {
	constructor(
		private readonly output: vscode.OutputChannel,
		private readonly extensionMode: vscode.ExtensionMode
	) {}

	async prepareInvocation(
		options: vscode.LanguageModelToolInvocationPrepareOptions<ReportProgressInput>,
		_token: vscode.CancellationToken
	): Promise<vscode.PreparedToolInvocation> {
		return {
			invocationMessage: `Reporting ${options.input.event} (${options.input.stepCurrent}/${options.input.stepTotal})`,
		};
	}

	async invoke(
		options: vscode.LanguageModelToolInvocationOptions<ReportProgressInput>,
		_token: vscode.CancellationToken
	): Promise<vscode.LanguageModelToolResult> {
		console.log('[Copilot Progress Reporter] invoke', options.input);
		const configuredEndpoint =
			vscode.workspace
			.getConfiguration('copilotReporter')
			.get<string>('endpoint')
			?.trim() ?? '';

		const devFallbackEndpoint = 'http://127.0.0.1:5000/copilot/progress';
		const endpoint =
			configuredEndpoint ||
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
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.output.appendLine(`[error] Failed to POST progress event: ${message}`);
			console.error(`[Copilot Progress Reporter] Failed to POST progress event: ${message}`);
			return this.result('Progress report failed due to a network error. Continue without blocking the task.');
		}
	}

	private result(message: string): vscode.LanguageModelToolResult {
		return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(message)]);
	}
}

export function activate(context: vscode.ExtensionContext): void {
	const output = vscode.window.createOutputChannel('Copilot Progress Reporter');
	context.subscriptions.push(output);

	const tool = new ReportProgressTool(output, context.extensionMode);
	context.subscriptions.push(vscode.lm.registerTool('reportProgress', tool));

	console.log('[Copilot Progress Reporter] extension activated');
	output.appendLine('[info] Copilot Progress Reporter activated.');
}

export function deactivate(): void {}
