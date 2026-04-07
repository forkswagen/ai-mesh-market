"""
Простой UI агента: только HTTP к оркестратору (никакого прямого LM Studio из браузера).
Запуск: из корня репо — python3 -m venv .venv-streamlit && source .venv-streamlit/bin/activate
  pip install -r streamlit-agent/requirements.txt && streamlit run streamlit-agent/app.py
или: npm run agent:ui
"""
from __future__ import annotations

import os

import requests
import streamlit as st

DEFAULT_ORCHESTRATOR = os.environ.get("ORCHESTRATOR_URL", "http://127.0.0.1:8787")
DEFAULT_SAMPLE = '\n'.join(
    [
        '{"text":"a","label":1}',
        '{"text":"b","label":0}',
        '{"text":"c","label":1}',
    ]
)

st.set_page_config(page_title="Agent · LM Studio (через backend)", layout="centered")
st.title("Agent ↔ backend (оркестратор)")
st.caption(
    "Сюда — **Node-оркестратор** из репо `ai-mesh-market` (`server/`, порт **8787** локально "
    "или URL из `VITE_API_BASE_URL` в проде). Эндпоинты: `/api/agent/models`, `/api/agent/oracle`. "
    "**Не** вставляй [SolToloka FastAPI](https://soltoloka-backend.vercel.app/docs) — это другой сервис."
)

base = st.sidebar.text_input(
    "URL Node-оркестратора (не SolToloka)",
    value=DEFAULT_ORCHESTRATOR,
    help="Пример локально: http://127.0.0.1:8787. SolToloka (Vercel /docs) сюда не подходит.",
).rstrip("/")

if st.session_state.get("_streamlit_orch_base") != base:
    st.session_state["_streamlit_orch_base"] = base
    st.session_state.pop("models_payload", None)
    st.session_state.pop("health", None)

col1, col2 = st.sidebar.columns(2)
with col1:
    if st.button("Health"):
        try:
            r = requests.get(f"{base}/health", timeout=5)
            st.session_state["health"] = r.json()
        except Exception as e:
            st.session_state["health"] = {"error": str(e)}
with col2:
    if st.button("Модели"):
        st.session_state.pop("models_payload", None)

if "health" in st.session_state:
    st.sidebar.json(st.session_state["health"])

if "models_payload" not in st.session_state:
    try:
        mr = requests.get(f"{base}/api/agent/models", timeout=10)
        st.session_state["models_payload"] = mr.json()
    except Exception as e:
        st.session_state["models_payload"] = {"ok": False, "error": str(e), "models": []}

payload = st.session_state["models_payload"]
if not payload.get("ok"):
    st.error(payload.get("error") or "Нет моделей — проверь LM Studio и `server/.env` (LM_STUDIO_BASE_URL).")
    if payload.get("baseUrl"):
        st.info(f"Ожидаемый LM Studio base: `{payload['baseUrl']}`")
else:
    st.success(f"LM Studio (через backend): `{payload.get('baseUrl')}`")

ids = [m["id"] for m in payload.get("models") or [] if isinstance(m, dict) and m.get("id")]
model = st.selectbox("Модель для оракула", options=["(по умолчанию из .env)"] + ids, index=min(1, len(ids)) if ids else 0)

deliverable = st.text_area("Текст deliverable (датасет / JSONL)", value=DEFAULT_SAMPLE, height=220)

if st.button("Запустить оракул", type="primary"):
    body = {"deliverableText": deliverable}
    if model and not model.startswith("("):
        body["oracleLlmModel"] = model
    with st.spinner("Запрос к /api/agent/oracle …"):
        try:
            r = requests.post(f"{base}/api/agent/oracle", json=body, timeout=120)
            data = r.json()
        except Exception as e:
            st.error(str(e))
            st.stop()
    if r.ok and data.get("ok"):
        src = data.get("source", "?")
        v = data.get("verdict")
        st.metric("Verdict", "true / выплата seller" if v else "false / refund buyer")
        st.write("**Источник:**", src)
        st.write("**Reason:**", data.get("reason", ""))
    else:
        st.error(data.get("error") or r.text)

st.divider()
st.markdown(
    "Оркестратор: `npm run server:dev` или `npm run dev:demo`. "
    "Полный on-chain seeded demo остаётся в React (`EscrowPage`)."
)
