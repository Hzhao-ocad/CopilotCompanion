import logging
import json

from flask import Flask, request

app = Flask(__name__)

logging.getLogger("werkzeug").disabled = True
app.logger.disabled = True


@app.post("/copilot/progress")
def copilot_progress() -> tuple[str, int]:
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        print("Invalid payload: expected JSON object", flush=True)
        return "", 400

    print(json.dumps(payload, ensure_ascii=True), flush=True)
    return "", 204


@app.post("/print-text")
def print_text() -> tuple[str, int]:
    text = request.get_data(as_text=True)
    print(text, flush=True)
    return "", 204


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
