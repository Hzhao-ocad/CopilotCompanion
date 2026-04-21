import json
from datetime import datetime, timezone
from urllib import error, request

URL = "http://127.0.0.1:5000/copilot/progress"


def sample_progress_payload() -> dict[str, object]:
    return {
        "event": "task_start",
        "stepCurrent": 0,
        "stepTotal": 4,
        "stepLabel": "Planning task",
        "taskSummary": "Refactor the auth module to use JWT",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


def send_progress_to_server(payload: dict[str, object], url: str = URL) -> None:
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with request.urlopen(req) as resp:
        resp.read()


if __name__ == "__main__":
    try:
        send_progress_to_server(sample_progress_payload())
    except error.URLError as exc:
        print("Request failed. Is the Flask server running on http://127.0.0.1:5000?")
        print(exc)
