import requests
import time
import random
import string
import logging
import os
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get("PROBER_TARGET_URL", "http://localhost:8080")
INTERVAL = int(os.environ.get("PROBER_INTERVAL", "30"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
log = logging.getLogger("prober")


def random_username():
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"prober_{suffix}"


def timed_request(session, method, url, **kwargs):
    start = time.time()
    try:
        resp = session.request(method, url, **kwargs)
        duration = time.time() - start
        log.info(
            "status=%-3s  endpoint=%-45s  duration=%.3fs",
            resp.status_code, f"{method} {url.replace(BASE_URL, '')}", duration
        )
        return resp, duration
    except requests.exceptions.RequestException as e:
        duration = time.time() - start
        log.error(
            "status=ERR  endpoint=%-45s  duration=%.3fs  error=%s",
            f"{method} {url.replace(BASE_URL, '')}", duration, e
        )
        return None, duration


def probe_iteration():
    session = requests.Session()
    session.timeout = 10  # Таймаут 10 секунд на любой запрос

    username = random_username()
    password = "proberpass123"

    log.info("=" * 60)
    log.info("Starting of prober integration (user: %s)", username)
    log.info("=" * 60)

    resp, _ = timed_request(session, "GET", f"{BASE_URL}/api/auth/csrf")
    if resp is None or resp.status_code != 200:
        log.warning("Cannot retrieve CSRF token, skipping",)
        return

    csrf_token = resp.json().get("token", "")
    headers = {"X-CSRF-TOKEN": csrf_token}

    resp, _ = timed_request(session, "POST", f"{BASE_URL}/api/auth/register",
                            json={"name": username, "password": password},
                            headers=headers)
    if resp is None or resp.status_code != 201:
        log.warning("Registration failed (status=%s), skipping",
                    resp.status_code if resp else "ERR")
        return

    resp, _ = timed_request(session, "POST", f"{BASE_URL}/api/projects",
                            json={
                                "name": f"Prober Project {username}",
                                "description": "Auto-created by SLA prober"
                            },
                            headers=headers)
    if resp is None or resp.status_code != 201:
        log.warning("Creation of project failed, skipping")
        return

    project_id = resp.json().get("id")

    remind_at = (datetime.now(timezone.utc) - timedelta(seconds=10)).isoformat()
    resp, _ = timed_request(session, "POST",
                            f"{BASE_URL}/api/projects/{project_id}/tasks",
                            json={
                                "title": f"Prober Task {username}",
                                "description": "Auto-created by SLA prober",
                                "priority": random.choice(["LOW", "MEDIUM", "HIGH"]),
                                "remindAt": remind_at
                            },
                            headers=headers)

    timed_request(session, "GET", f"{BASE_URL}/api/projects/{project_id}/tasks")

    log.info("Whole iteration completed for user: %s", username)


if __name__ == "__main__":
    log.info("Prober started. Target: %s, interval: %s sec", BASE_URL, INTERVAL)

    while True:
        try:
            probe_iteration()
        except Exception as e:
            log.exception("Unexpected error in prober iteration: %s", e)

        log.info("Next iteration in %s sec...", INTERVAL)
        time.sleep(INTERVAL)

