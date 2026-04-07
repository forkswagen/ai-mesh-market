"""
Escora — панель локального хоста агента (LM Studio + WebSocket-воркер).

Что делает этот UI
------------------
- Проверяет оркестратор (/health, /api/meta, список live-агентов).
- Проверяет LM Studio (OpenAI-совместимый GET /v1/models на вашей машине).
- Включает/выключает приём задач (accepting) через POST /api/agent/control/accepting.
- Показывает готовый блок env + команду для запуска Node-воркера (реальный WS и вызовы в LM).

Воркер (обязателен отдельным процессом)
----------------------------------------
Streamlit только управляет флагом accepting и диагностикой. Трафик чата/oracle
идёт через процесс:

  npm run oracle-worker --prefix server

Запуск панели
-------------
  pip install -r streamlit/requirements.txt
  # или из корня репозитория:
  npm run agent-host:panel

Переменные окружения (опциональные дефолты для полей формы)
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
            return False, "Неожиданный JSON (ожидали data[])", []
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
        "# Отдельный терминал: сначала включите Local Server в LM Studio и загрузите модель.",
        f"# Оркестратор (проверка в браузере): {ORCH}",
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
        return None, f"Уже запущен процесс PID {prev.pid}. Остановите его вручную или оставьте как есть."
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


st.set_page_config(page_title="Escora · хост агента", layout="wide", initial_sidebar_state="expanded")
init_session()

st.title("Локальный хост агента")
st.caption(
    "LM Studio на этой машине + WebSocket к оркестратору Escora. "
    "Эта страница — пульт: диагностика и вкл/выкл приёма задач."
)

with st.sidebar:
    st.header("Параметры")
    st.text_input("Оркестратор (HTTP)", key="orch_url", help="Как в браузере: VITE_API_BASE_URL / локально http://127.0.0.1:8787")
    st.text_input("WebSocket воркера", key="ws_url", help="Обычно ws://127.0.0.1:8787/ws/oracle-worker или wss://… для прод")
    if st.button("Подставить WS из HTTP"):
        st.session_state["ws_url"] = _default_ws_from_http(st.session_state["orch_url"])
        st.rerun()
    st.text_input("logicalId (ORACLE_WORKER_ID)", key="logical_id", max_chars=64, help="Должен совпадать с ?id= при подключении воркера")
    st.text_input("Отображаемое имя", key="display_name", max_chars=128)
    st.text_input("LM Studio base URL", key="lm_base", help="По умолчанию http://127.0.0.1:1234 — сервер API в LM Studio")
    st.text_input("Модель (ORACLE_LLM_MODEL)", key="llm_model", help="Имя модели в LM Studio, напр. local-model или конкретный id из /v1/models")
    st.text_input("Секрет управления (AGENT_CONTROL_SECRET)", key="secret", type="password", help="Как в server/.env; в dev может быть пустым")

http = requests.Session()

base = st.session_state["orch_url"].rstrip("/")
lid = (st.session_state["logical_id"] or "lm-local").strip()

col_a, col_b, col_c = st.columns(3)

code_orch, body_orch = orch_get("/health", http, base)
healthy_orch = code_orch == 200
col_a.metric("Оркестратор /health", "OK" if healthy_orch else "Нет", delta=None if healthy_orch else str(code_orch))

code_meta, meta = orch_get("/api/meta", http, base)
rev = "—"
if code_meta == 200 and isinstance(meta, dict):
    rev = str(meta.get("apiRevision", "—"))
col_b.metric("api/meta revision", rev)

lm_ok, lm_msg, lm_ids = lm_list_models(st.session_state["lm_base"], http)
col_c.metric("LM Studio /v1/models", "OK" if lm_ok else "Нет", delta=None if lm_ok else lm_msg[:40])

if not healthy_orch:
    st.error(
        f"Оркестратор недоступен по `{base}`. Поднимите `npm run server:dev` из корня репозитория "
        f"или укажите URL деплоя. Ответ: {body_orch!r}"
    )

if lm_ok and lm_ids:
    with st.expander(f"Модели LM Studio ({len(lm_ids)})", expanded=False):
        st.code("\n".join(lm_ids[:40]) + ("\n…" if len(lm_ids) > 40 else ""), language="text")
elif st.session_state["lm_base"]:
    st.warning(
        f"LM Studio не ответил на `{st.session_state['lm_base'].rstrip('/')}/v1/models`. "
        "Включите **Local Server** в LM Studio и загрузите модель."
    )

st.subheader("Статус воркера на оркестраторе")
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
        f"Подключён: сессия `{str(mine.get('sessionId', ''))[:12]}…` · "
        f"accepting={mine.get('accepting')} · busy={mine.get('busy')} · name={mine.get('name')!r}"
    )
else:
    st.warning(
        f"Воркер с `logicalId={lid!r}` не в списке live. Запустите процесс `oracle-worker` "
        f"(см. блок ниже)" + (f" — сейчас в live других агентов: {len(agents)}." if agents else ".")
    )

c1, c2 = st.columns(2)
with c1:
    if st.button("Включить приём задач (accepting)", type="primary"):
        try:
            out = set_accepting(base, lid, True, st.session_state["secret"], http)
            st.success(json.dumps(out, ensure_ascii=False))
        except Exception as e:
            st.error(str(e))
with c2:
    if st.button("Выключить приём задач"):
        try:
            out = set_accepting(base, lid, False, st.session_state["secret"], http)
            st.success(json.dumps(out, ensure_ascii=False))
        except Exception as e:
            st.error(str(e))

st.divider()
st.subheader("Запуск WebSocket-воркера (Node)")
st.markdown(
    "Панель **не** заменяет процесс воркера: он держит соединение с `/ws/oracle-worker` и проксирует запросы в LM Studio."
)

cmd = worker_command_block()
st.code(cmd, language="bash")

launch_col1, launch_col2 = st.columns(2)
with launch_col1:
    copy_hint = "Скопируйте блок выше в терминал или запустите через кнопку (если `npm` в PATH)."
    st.caption(copy_hint)
with launch_col2:
    if st.button("Стартовать воркер в фоне (эта машина)"):
        p, err = run_worker_via_npm()
        if err == "npm":
            st.error("Не найден `npm` в PATH. Запустите команду из блока выше вручную.")
        elif p is None:
            st.warning(err or "Не удалось запустить воркер.")
        else:
            st.info(
                "Процесс запущен. Через несколько секунд обновите страницу и проверьте статус воркера. "
                f"PID {p.pid}"
            )

st.divider()
st.subheader("Регистрация кошелька и webhook")
st.markdown(
    "Чтобы привязать кошелёк к этому `logicalId` и получать вебхуки **agent.connected** / **agent.disconnected**, "
    "откройте веб-приложение: маршрут **`/agents`** → блок регистрации агента."
)

st.divider()
with st.expander("Все live-агенты (сырой ответ)"):
    st.json(live_body if code_live == 200 else {"error": code_live, "body": live_body})
