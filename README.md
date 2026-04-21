# Copilot Progress Reporter

A VS Code extension tool that reports Copilot agentic task progress to an external backend via HTTP POST.

## What it does

The extension contributes one language model tool named `reportProgress`.

When Copilot invokes it, the extension sends a JSON payload to the configured endpoint:

- `event`: `task_start`, `step_complete`, or `task_finish`
- `stepCurrent`
- `stepTotal`
- `stepLabel`
- `taskSummary`
- `timestamp` (added automatically by the extension)

## Configure endpoint

Set this in your workspace settings:

```json
{
  "copilotReporter.endpoint": "https://your-backend.com/copilot/progress"
}
```

## Local development

```bash
npm install
npm run compile
```

Press `F5` in VS Code to launch an Extension Development Host.

## Install In Main VS Code

To run this extension in your regular VS Code window (not Extension Development Host):

1. Build and package the extension:

```bash
npm install
npm run compile
npm run package
```

2. Install the generated VSIX in VS Code:

```bash
code --install-extension copilot-progress-reporter-0.1.0.vsix
```

3. Reload VS Code.

4. Open Extensions and confirm Copilot Progress Reporter is enabled.

## Local end-to-end test

1. Start the local receiver in the main workspace terminal:

```bash
python app.py
```

2. In VS Code, choose the `Run Copilot Progress Reporter` debug profile and run it (F5).
3. In the Extension Development Host, open Copilot Chat and run an agentic task that can call tools.
4. Ask Copilot to use `#reportProgress` while executing the task steps.
5. Verify incoming JSON payloads are printed in the terminal that runs `app.py`.

The default workspace endpoint is already configured in `.vscode/settings.json` as:

```json
{
  "copilotReporter.endpoint": "http://127.0.0.1:5000/copilot/progress"
}
```

## Publish To VS Code Marketplace

1. Create a publisher in Visual Studio Marketplace Manage Publishers.
2. Update `publisher` in `package.json` to exactly match your publisher ID.
3. Create a Personal Access Token (PAT) with Marketplace publish permissions.
4. Login with VSCE:

```bash
npx vsce login <your-publisher-id>
```

5. Publish:

```bash
npm run publish:marketplace
```

6. For updates, bump `version` in `package.json` and publish again.
