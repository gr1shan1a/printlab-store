#!/usr/bin/env python3
"""Private Bambu A1 bridge. Bind it only to a Tailnet address."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import threading
import zipfile
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import bambulabs_api as bl

HOST = os.environ.get("PRINT_AGENT_HOST", "100.110.109.90")
PORT = int(os.environ.get("PRINT_AGENT_PORT", "8787"))
CACHE = Path(os.environ.get("PRINT_AGENT_CACHE_DIR", "/home/admin/printlab-agent/cache"))
TOKEN = os.environ["PRINT_AGENT_TOKEN"]
PRINTER_IP = os.environ["BAMBU_PRINTER_IP"]
SERIAL = os.environ["BAMBU_PRINTER_SERIAL"]
ACCESS_CODE = os.environ["BAMBU_PRINTER_ACCESS_CODE"]
USE_AMS = os.environ.get("BAMBU_USE_AMS", "true").lower() == "true"
STORE_URL = os.environ.get("PRINT_AGENT_STORE_URL", "").rstrip("/")
LOCK = threading.Lock()
UPLOADED: set[str] = set()
LABELS_FILE = CACHE / "labels.json"

def load_labels() -> dict[str, str]:
    try:
        return json.loads(LABELS_FILE.read_text())
    except (OSError, json.JSONDecodeError):
        return {}

FILE_LABELS = load_labels()

def save_labels() -> None:
    CACHE.mkdir(mode=0o700, parents=True, exist_ok=True)
    LABELS_FILE.write_text(json.dumps(FILE_LABELS, ensure_ascii=False))
    LABELS_FILE.chmod(0o600)


class AgentError(Exception):
    pass


def current_state(printer: bl.Printer) -> dict:
    printer.mqtt_client.pushall()
    time.sleep(2)
    state = (printer.mqtt_dump() or {}).get("print")
    if not isinstance(state, dict) or not state:
        raise AgentError("A1 не отвечает по MQTT: включите LAN-only и Developer Mode")
    return state


def assert_idle(state: dict) -> None:
    if state.get("gcode_state") not in ("FINISH", "IDLE", "FAILED", None):
        raise AgentError("Принтер занят: " + str(state.get("gcode_state") or state.get("print_type")))
    if state.get("print_error") not in (0, None):
        raise AgentError("Ошибка принтера: " + str(state["print_error"]))


def cache_file(url: str) -> tuple[Path, str]:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or not STORE_URL or not url.startswith(STORE_URL + "/uploads/print-files/"):
        raise AgentError("Недопустимый адрес файла")
    if not parsed.path.endswith(".gcode.3mf"):
        raise AgentError("Разрешены только .gcode.3mf")
    CACHE.mkdir(mode=0o700, parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": "PrintLab-A1-Agent/1.0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        content = response.read(100 * 1024 * 1024 + 1)
    if len(content) > 100 * 1024 * 1024 or not content.startswith(b"PK"):
        raise AgentError("Файл слишком большой или не является 3MF")
    try:
        with zipfile.ZipFile(__import__("io").BytesIO(content)) as archive:
            if "Metadata/plate_1.gcode" not in archive.namelist():
                raise AgentError("В 3MF нет подготовленного plate_1.gcode")
    except zipfile.BadZipFile as error:
        raise AgentError("Файл 3MF повреждён") from error
    digest = hashlib.sha256(content).hexdigest()
    target = CACHE / f"{digest}.gcode.3mf"
    if not target.exists():
        target.write_bytes(content)
        target.chmod(0o600)
    return target, digest


def start_print(file_url: str, display_name: str = "") -> dict:
    with LOCK:
        cached, digest = cache_file(file_url)
        remote_name = f"printlab-{digest}.gcode.3mf"
        printer = bl.Printer(PRINTER_IP, ACCESS_CODE, SERIAL)
        printer.connect()
        time.sleep(4)
        try:
            before = current_state(printer)
            assert_idle(before)
            if digest not in UPLOADED:
                with cached.open("rb") as source:
                    result = printer.upload_file(source, remote_name)
                if "226" not in str(result):
                    raise AgentError("Принтер не подтвердил загрузку")
                UPLOADED.add(digest)
            if not printer.start_print(remote_name, 1, use_ams=USE_AMS, ams_mapping=[0], flow_calibration=True):
                raise AgentError("Принтер не подтвердил запуск")
            FILE_LABELS[remote_name] = display_name[:100] or remote_name
            save_labels()
            return {"file": remote_name, "cached": True, "state_before": before.get("gcode_state")}
        finally:
            printer.disconnect()


def printer_status() -> dict:
    with LOCK:
        printer = bl.Printer(PRINTER_IP, ACCESS_CODE, SERIAL)
        printer.connect()
        time.sleep(3)
        try:
            state = current_state(printer)
            raw_file = str(state.get("gcode_file") or "")
            try:
                remaining = int(state.get("mc_remaining_time")) if state.get("mc_remaining_time") is not None else None
            except (ValueError, TypeError):
                remaining = None
            return {"gcodeState": state.get("gcode_state"), "file": FILE_LABELS.get(raw_file, raw_file), "percent": state.get("mc_percent"), "remainingMinutes": remaining, "layer": state.get("layer_num"), "totalLayers": state.get("total_layer_num"), "nozzleTemp": state.get("nozzle_temper"), "bedTemp": state.get("bed_temper"), "errorCode": state.get("print_error"), "updatedAt": int(time.time())}
        finally:
            printer.disconnect()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        print(format % args, flush=True)

    def reply(self, status: int, body: dict) -> None:
        data = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def authorized(self) -> bool:
        received = self.headers.get("x-print-agent-token", "")
        return bool(received) and hmac.compare_digest(received, TOKEN)

    def do_GET(self) -> None:
        if self.path == "/health":
            self.reply(200, {"ok": True})
        elif self.path == "/v1/status":
            if not self.authorized():
                return self.reply(403, {"error": "Нет доступа"})
            try:
                self.reply(200, printer_status())
            except Exception:
                self.reply(502, {"error": "A1 недоступен по MQTT: включите LAN-only и Developer Mode"})
        else:
            self.reply(404, {"error": "Не найдено"})

    def do_POST(self) -> None:
        if self.path != "/v1/print":
            return self.reply(404, {"error": "Не найдено"})
        if not self.authorized():
            return self.reply(403, {"error": "Нет доступа"})
        try:
            length = int(self.headers.get("content-length", "0"))
            data = json.loads(self.rfile.read(length))
            url = data.get("fileUrl")
            if not isinstance(url, str):
                raise AgentError("Не указан файл")
            self.reply(200, {"ok": True, **start_print(url, str(data.get("displayName") or ""))})
        except (AgentError, ValueError, json.JSONDecodeError) as error:
            self.reply(409, {"error": str(error)})
        except Exception:
            self.reply(500, {"error": "Внутренняя ошибка print-agent"})


if __name__ == "__main__":
    print(f"Print-agent listening on http://{HOST}:{PORT}", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
