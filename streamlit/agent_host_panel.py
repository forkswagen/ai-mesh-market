"""
Escora — local agent host panel (LM Studio + WebSocket worker).

What this UI does
-----------------
- Checks orchestrator (/health, /api/meta, live agent list).
- Checks LM Studio (OpenAI-compatible GET /v1/models on your machine).
- Toggles task acceptance via POST /api/agent/control/accepting.
- Shows ready env block + command to run the Node worker (real WS and LM calls).

Worker (must run as a separate process)
-----------------------------------------
Streamlit only toggles accepting and diagnostics. Chat/oracle traffic goes through:

  npm run oracle-worker --prefix server

Run the panel
-------------
  pip install -r streamlit/requirements.txt
  # or from repo root:
  npm run agent-host:panel

Environment variables (optional defaults for form fields)
  ORCHESTRATOR_URL, ORACLE_WORKER_WS_URL, ORACLE_WORKER_ID, AGENT_DISPLAY_NAME,
  AGENT_CONTROL_SECRET, LM_STUDIO_BASE_URL, ORACLE_LLM_MODEL
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from urllib.parse import urlparse

import requests
import streamlit as st

REPO_ROOT = Path(__file__).resolve().parents[1]


def _default_ws_from_http(http_base: str) -> str:
    """http://host:8787 -> ws://host:8787/ws/oracle-worker"""
    p = urlparse(http_base.strip())
    scheme = "wss" if p.scheme == "https" else "ws"
    host = p.hostname or "127.0.0.1"
    port = f":{p.port}" if p.port else ""
    return f"{scheme}://{host}{port}/ws/oracle-worker"


def init_session() -> None:
    d = {
        "orch_url": os.environ.get("ORCHESTRATOR_URL", "http://127.0.0.1:8787").rstrip("/"),
        "ws_url": os.environ.get("ORACLE_WORKER_WS_URL", "").strip(),
        "logical_id": (os.environ.get("ORACLE_WORKER_ID", "lm-local").strip() or "lm-local")[:64],
        "display_name": (os.environ.get("AGENT_DISPLAY_NAME", "").strip() or os.environ.get("ORACLE_WORKER_ID", "lm-local").strip())[:128],
        "secret": os.environ.get("AGENT_CONTROL_SECRET", "").strip(),
        "lm_base": os.environ.get("LM_STUDIO_BASE_URL", "http://127.0.0.1:1234").rstrip("/"),
        "llm_model": (os.environ.get("ORACLE_LLM_MODEL", "") or "local-model").strip(),
    }
    if not d["display_name"]:
        d["display_name"] = d["logical_id"]
    for k, v in d.items():
        if k not in st.session_state:
            st.session_state[k] = v
    if not st.session_state.get("ws_url"):
        st.session_state["ws_url"] = _default_ws_from_http(st.session_state["orch_url"])


def orch_get(path: str, session: requests.Session, base: str, timeout: float = 12.0) -> tuple[int, dict | list | str | None]:
    url = f"{base.rstrip('/')}{path}"
    try:
        r = session.get(url, timeout=timeout)
        ct = r.headers.get("content-type", "")
        body: dict | list | str | None
        if "application/json" in ct:
            try:
                body = r.json()
            except json.JSONDecodeError:
                body = r.text[:2000]
        else:
            body = r.text[:2000] if r.text else None
        return r.status_code, body
    except requests.RequestException as e:
        return -1, str(e)


def set_accepting(
    base: str,
    logical_id: str,
    accepting: bool,
    secret: str,
    session: requests.Session,
) -> dict:
    url = f"{base.rstrip('/')}/api/agent/control/accepting"
    headers: dict[str, str] = {}
    body: dict = {"logicalId": logical_id, "accepting": accepting}
    if secret:
        headers["X-Agent-Control-Secret"] = secret
        body["secret"] = secret
    r = session.post(url, json=body, headers=headers, timeout=30)
    r.raise_for_status()
    return r.json()


def lm_list_models(base: str, session: requests.Session, timeout: float = 8.0) -> tuple[bool, str, list[str]]:
    url = f"{base.rstrip('/')}/v1/models"
    try:
        r = session.get(url, headers={"Accept": "application/json"}, timeout=timeout)
        if not r.ok:
            return False, f"HTTP {r.status}: {r.text[:300]}", []
        data = r.json()
        rows = data.get("data") if isinstance(data, dict) else None
        if not isinstance(rows, list):
            return False, "Unexpected JSON (expected data[])", []
        ids = []
        for m in rows:
            if isinstance(m, dict) and isinstance(m.get("id"), str):
                ids.append(m["id"])
        return True, "ok", ids
    except requests.RequestException as e:
        return False, str(e), []


def worker_command_block() -> str:
    ORCH = st.session_state["orch_url"].rstrip("/")
    ws = st.session_state["ws_url"].strip()
    wid = st.session_state["logical_id"].strip() or "lm-local"
    name = st.session_state["display_name"].strip() or wid
    lm = st.session_state["lm_base"].rstrip("/")
    model = st.session_state["llm_model"].strip() or "local-model"
    sec = st.session_state["secret"].strip()

    lines = [
        "# Separate terminal: enable Local Server in LM Studio and load a model.",
        f"# Orchestrator (check in browser): {ORCH}",
        f"export ORACLE_WORKER_WS_URL={ws!r}",
        f"export ORACLE_WORKER_ID={wid!r}",
        f"export AGENT_DISPLAY_NAME={name!r}",
        f"export LM_STUDIO_BASE_URL={lm!r}",
        f"export ORACLE_LLM_MODEL={model!r}",
    ]
    if sec:
        lines.append(f"export AGENT_CONTROL_SECRET={sec!r}")
    lines.append(f"cd {REPO_ROOT!s}")
    lines.append("npm run oracle-worker --prefix server")
    return "\n".join(lines)


def run_worker_via_npm() -> tuple[subprocess.Popen | None, str]:
    env = os.environ.copy()
    env["ORACLE_WORKER_WS_URL"] = st.session_state["ws_url"]
    env["ORACLE_WORKER_ID"] = st.session_state["logical_id"]
    env["AGENT_DISPLAY_NAME"] = st.session_state["display_name"] or st.session_state["logical_id"]
    env["LM_STUDIO_BASE_URL"] = st.session_state["lm_base"]
    env["ORACLE_LLM_MODEL"] = st.session_state["llm_model"] or "local-model"
    if st.session_state["secret"]:
        env["AGENT_CONTROL_SECRET"] = st.session_state["secret"]
    prev = st.session_state.get("worker_proc")
    if prev is not None and prev.poll() is None:
        return None, f"A process is already running (PID {prev.pid}). Stop it manually or leave as-is."
    try:
        p = subprocess.Popen(
            ["npm", "run", "oracle-worker", "--prefix", "server"],
            cwd=str(REPO_ROOT),
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
        )
        st.session_state["worker_proc"] = p
        return p, ""
    except FileNotFoundError:
        return None, "npm"


st.set_page_config(page_title="Escora · agent host", layout="wide", initial_sidebar_state="expanded")
init_session()

st.title("Local agent host")
st.caption(
    "LM Studio on this machine + WebSocket to Escora orchestrator. "
    "This page is a control panel: diagnostics and toggling task acceptance."
)

with st.sidebar:
    st.header("Settings")
    st.text_input("Orchestrator (HTTP)", key="orch_url", help="As in browser: VITE_API_BASE_URL / local http://127.0.0.1:8787")
    st.text_input("Worker WebSocket", key="ws_url", help="Usually ws://127.0.0.1:8787/ws/oracle-worker or wss://… in prod")
    if st.button("Fill WS from HTTP"):
        st.session_state["ws_url"] = _default_ws_from_http(st.session_state["orch_url"])
        st.rerun()
    st.text_input("logicalId (ORACLE_WORKER_ID)", key="logical_id", max_chars=64, help="Must match ?id= when worker connects")
    st.text_input("Display name", key="display_name", max_chars=128)
    st.text_input("LM Studio base URL", key="lm_base", help="Default http://127.0.0.1:1234 — LM Studio API server")
    st.text_input("Model (ORACLE_LLM_MODEL)", key="llm_model", help="Model id in LM Studio, e.g. local-model or id from /v1/models")
    st.text_input("Control secret (AGENT_CONTROL_SECRET)", key="secret", type="password", help="As in server/.env; may be empty in dev")

http = requests.Session()

base = st.session_state["orch_url"].rstrip("/")
lid = (st.session_state["logical_id"] or "lm-local").strip()

col_a, col_b, col_c = st.columns(3)

code_orch, body_orch = orch_get("/health", http, base)
healthy_orch = code_orch == 200
col_a.metric("Orchestrator /health", "OK" if healthy_orch else "Down", delta=None if healthy_orch else str(code_orch))

code_meta, meta = orch_get("/api/meta", http, base)
rev = "—"
if code_meta == 200 and isinstance(meta, dict):
    rev = str(meta.get("apiRevision", "—"))
col_b.metric("api/meta revision", rev)

lm_ok, lm_msg, lm_ids = lm_list_models(st.session_state["lm_base"], http)
col_c.metric("LM Studio /v1/models", "OK" if lm_ok else "Down", delta=None if lm_ok else lm_msg[:40])

if not healthy_orch:
    st.error(
        f"Orchestrator unreachable at `{base}`. Start `npm run dev` from repo root "
        f"or set the deploy URL. Response: {body_orch!r}"
    )

if lm_ok and lm_ids:
    with st.expander(f"LM Studio models ({len(lm_ids)})", expanded=False):
        st.code("\n".join(lm_ids[:40]) + ("\n…" if len(lm_ids) > 40 else ""), language="text")
elif st.session_state["lm_base"]:
    st.warning(
        f"LM Studio did not respond at `{st.session_state['lm_base'].rstrip('/')}/v1/models`. "
        "Enable **Local Server** in LM Studio and load a model."
    )

st.subheader("Worker status on orchestrator")
code_live, live_body = orch_get("/api/agent/live", http, base)
mine = None
agents: list = []
if code_live == 200 and isinstance(live_body, dict) and isinstance(live_body.get("agents"), list):
    agents = live_body["agents"]
    for a in agents:
        if isinstance(a, dict) and a.get("logicalId") == lid:
            mine = a
            break

if mine:
    st.success(
        f"Connected: session `{str(mine.get('sessionId', ''))[:12]}…` · "
        f"accepting={mine.get('accepting')} · busy={mine.get('busy')} · name={mine.get('name')!r}"
    )
else:
    st.warning(
        f"Worker with `logicalId={lid!r}` not in live list. Start `oracle-worker` "
        f"(see block below)" + (f" — other agents live: {len(agents)}." if agents else ".")
    )

c1, c2 = st.columns(2)
with c1:
    if st.button("Enable task acceptance (accepting)", type="primary"):
        try:
            out = set_accepting(base, lid, True, st.session_state["secret"], http)
            st.success(json.dumps(out, ensure_ascii=False))
        except Exception as e:
            st.error(str(e))
with c2:
    if st.button("Disable task acceptance"):
        try:
            out = set_accepting(base, lid, False, st.session_state["secret"], http)
            st.success(json.dumps(out, ensure_ascii=False))
        except Exception as e:
            st.error(str(e))

st.divider()
st.subheader("Start WebSocket worker (Node)")
st.markdown(
    "The panel **does not** replace the worker process: it keeps `/ws/oracle-worker` open and proxies to LM Studio."
)

cmd = worker_command_block()
st.code(cmd, language="bash")

launch_col1, launch_col2 = st.columns(2)
with launch_col1:
    copy_hint = "Copy the block above into a terminal or use the button (if `npm` is on PATH)."
    st.caption(copy_hint)
with launch_col2:
    if st.button("Start worker in background (this machine)"):
        p, err = run_worker_via_npm()
        if err == "npm":
            st.error("`npm` not found in PATH. Run the command from the block above manually.")
        elif p is None:
            st.warning(err or "Failed to start worker.")
        else:
            st.info(
                "Process started. Refresh in a few seconds and check worker status. "
                f"PID {p.pid}"
            )

st.divider()
st.subheader("Wallet registration & webhook")
st.markdown(
    "To link a wallet to this `logicalId` and receive **agent.connected** / **agent.disconnected** webhooks, "
    "open the web app: **`/agents`** → agent registration block."
)

st.divider()
with st.expander("All live agents (raw response)"):
    st.json(live_body if code_live == 200 else {"error": code_live, "body": live_body})
