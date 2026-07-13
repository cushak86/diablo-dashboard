"""
Autonomous Agent Loop (Claude CLI 기반)
=======================================

Anthropic API를 직접 호출하는 대신, `claude` CLI(Claude Code CLI)를 서브프로세스로
실행해 콘텐츠를 리서치/생성/배포하는 자율 에이전트.

토큰/비용 최적화 전략:
- 매 작업마다 대화 기록을 누적해서 재전송하지 않고, 작업 하나당 독립적인
  단일 턴(single-turn) `claude -p` 호출로 처리한다 (컨텍스트가 매번 초기화되어
  이전 대화 재전송 비용이 없다).
- `--bare`로 hooks/skills/plugins/MCP/CLAUDE.md/auto-memory 등 불필요한
  컨텍스트 로딩을 건너뛴다.
- `--tools ""`로 도구를 전부 비활성화하고 `--max-turns 1`을 함께 지정해,
  에이전트가 여러 턴에 걸쳐 도구를 탐색적으로 호출하며 토큰을 소모하는
  일을 원천 차단한다. (배포는 Claude가 아니라 이 스크립트가 직접 수행한다.)
- `--json-schema`로 출력 형식을 강제해 마크다운 설명 등 불필요한 텍스트
  생성을 없앤다.
- `--max-budget-usd`로 호출 1건당 비용 상한을, 스크립트 자체적으로
  누적 비용 상한(MAX_TOTAL_BUDGET_USD)을 둬 이중으로 예산을 방어한다.

- 최대 5시간(18,000초) 동안, 혹은 누적 비용 한도 초과나 예기치 못한 에러가
  발생할 때까지 반복적으로 작업을 수행한다.
- 진행 상황은 state.json에 지속적으로 기록되며, 스크립트가 재시작되면
  이전에 멈춘 지점부터 이어서 작업한다(Resume).
- 시간/비용 한도, 반복 실패 등 "더 이상 진행할 수 없는" 상황의 판단과
  안전 종료(save_state_and_exit)는 이 스크립트(Python)가 직접 수행한다.
  (`claude -p` 단일 턴 호출에는 함수 호출/도구 기능이 없으므로, 언제 멈출지는
  모델이 아니라 오케스트레이터가 결정하는 것이 더 안전하고 결정적이다.)

리서치(`dummy_research`)와 콘텐츠 생성(`dummy_generate`)은 실제 구현 대신
가상의 함수로 대체되어 있다. 그 외 `claude` CLI를 서브프로세스로 호출하고
응답(JSON)을 파싱해 처리하는 흐름은 모두 실제로 동작하는 코드다.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# 설정값
# ---------------------------------------------------------------------------

CLAUDE_BIN = os.environ.get("CLAUDE_BIN", "claude")
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "sonnet")
CLAUDE_EFFORT = os.environ.get("CLAUDE_EFFORT", "low")

MAX_TURNS_PER_TASK = int(os.environ.get("MAX_TURNS_PER_TASK", "1"))
MAX_BUDGET_PER_TASK_USD = os.environ.get("MAX_BUDGET_PER_TASK_USD", "0.50")
MAX_TOTAL_BUDGET_USD = float(os.environ.get("MAX_TOTAL_BUDGET_USD", "20.0"))
CLI_TIMEOUT_SECONDS = int(os.environ.get("CLI_TIMEOUT_SECONDS", "180"))

MAX_RUNTIME_SECONDS = int(os.environ.get("MAX_RUNTIME_SECONDS", "18000"))  # 5시간
DEPLOY_ENDPOINT = os.environ.get("DEPLOY_ENDPOINT", "https://example.com/api/deploy")

# 같은 작업이 연속으로 이 횟수만큼 실패하면 blocked_tasks로 옮기고 다음 작업으로 넘어간다.
MAX_TASK_RETRIES = 2

BASE_DIR = Path(__file__).resolve().parent
STATE_FILE = BASE_DIR / "state.json"
LOG_FILE = BASE_DIR / "agent_log.md"

# 초기 상태에서 사용할 예시 작업 목록 (실제 사용 시 원하는 주제로 교체)
DEFAULT_PENDING_TASKS = [
    "콘텐츠 주제 A: 소개 페이지 초안",
    "콘텐츠 주제 B: 기능 안내 페이지",
    "콘텐츠 주제 C: FAQ 페이지",
]

# claude -p --json-schema에 전달할 스키마. title/body만 있는 최소 구조로
# 강제해 불필요한 설명 텍스트 생성을 막는다(토큰 절약).
CONTENT_JSON_SCHEMA_STR = json.dumps(
    {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "body": {"type": "string"},
        },
        "required": ["title", "body"],
        "additionalProperties": False,
    }
)


# ---------------------------------------------------------------------------
# 상태 관리 (State Management)
# ---------------------------------------------------------------------------


class StateManager:
    """state.json 파일을 통해 완료/대기 작업 목록과 누적 비용을 저장하고
    불러오는 클래스.

    스크립트가 재시작될 때 이 클래스가 반환하는 상태를 기반으로 이전에
    멈춘 지점부터 작업을 재개(Resume)한다.
    """

    def __init__(self, path: Path) -> None:
        self.path = path

    def load(self) -> dict[str, Any]:
        """state.json이 존재하면 불러오고, 없으면 초기 상태를 생성해 반환한다."""
        if self.path.exists():
            with open(self.path, "r", encoding="utf-8") as f:
                state = json.load(f)
        else:
            state = {
                "completed_tasks": [],
                "pending_tasks": list(DEFAULT_PENDING_TASKS),
                "blocked_tasks": [],
                "task_failure_counts": {},
                "total_cost_usd": 0.0,
                "last_updated": None,
            }
        state.setdefault("blocked_tasks", [])
        state.setdefault("task_failure_counts", {})
        state.setdefault("total_cost_usd", 0.0)
        return state

    def save(self, state: dict[str, Any]) -> None:
        """현재 상태를 state.json에 기록한다."""
        state["last_updated"] = datetime.now().isoformat()
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# 리서치 / 콘텐츠 생성 (가상의 함수)
# ---------------------------------------------------------------------------


def dummy_research(topic: str) -> str:
    """주어진 주제에 대한 리서치를 수행하는 가상의 함수.

    실제 서비스에서는 웹 검색, 사내 DB 조회 등으로 교체한다.
    """
    return f"[리서치 결과 - {topic}] 이 자리에는 실제 리서치 내용이 채워집니다."


def dummy_generate(topic: str, research_data: str) -> dict[str, Any]:
    """리서치 결과를 바탕으로 콘텐츠 초안을 만드는 가상의 함수.

    실제 서비스에서는 별도의 생성 파이프라인으로 교체한다.
    """
    return {
        "title": f"{topic}",
        "body": f"{research_data}\n\n(여기에 생성된 본문 초안이 들어갑니다.)",
    }


# ---------------------------------------------------------------------------
# Claude CLI 호출
# ---------------------------------------------------------------------------


def build_prompt(topic: str, research_data: str, draft_content: dict[str, Any]) -> str:
    """콘텐츠 정제를 요청하는 프롬프트를 만든다. 짧고 목표가 분명할수록
    불필요한 사고/설명이 줄어 토큰을 아낄 수 있다.
    """
    return (
        f"아래 리서치 요약과 초안을 다듬어 웹 페이지에 배포할 최종 콘텐츠를 "
        f"완성하세요.\n\n"
        f"주제: {topic}\n"
        f"리서치 요약: {research_data}\n"
        f"초안 제목: {draft_content.get('title', '')}\n"
        f"초안 본문: {draft_content.get('body', '')}\n\n"
        "요구사항: 제목과 본문만 간결하게 다듬어 완성하고, 지정된 JSON 스키마 "
        "형식으로만 응답하세요. 설명이나 사족은 추가하지 마세요."
    )


def call_claude_cli(prompt: str) -> dict[str, Any]:
    """`claude -p`를 서브프로세스로 호출해 콘텐츠를 생성한다.

    --bare, --tools "", --max-turns, --max-budget-usd로 토큰/비용을 최소화한
    단일 턴 호출로 구성했다. 응답은 --json-schema로 강제한 구조화된 JSON
    (`structured_output`)으로 받는다.

    반환값의 `ok`가 True이면 `content`(title/body dict)와 `cost_usd`를,
    False이면 `error`를 포함한다. 실패 시에도 `cost_usd`가 있으면 함께
    반환해 누적 비용 집계에서 누락되지 않도록 한다.
    """
    claude_path = shutil.which(CLAUDE_BIN) or CLAUDE_BIN

    argv = [
        claude_path,
        "-p",
        prompt,
        "--bare",
        "--output-format",
        "json",
        "--json-schema",
        CONTENT_JSON_SCHEMA_STR,
        "--model",
        CLAUDE_MODEL,
        "--effort",
        CLAUDE_EFFORT,
        "--max-turns",
        str(MAX_TURNS_PER_TASK),
        "--max-budget-usd",
        str(MAX_BUDGET_PER_TASK_USD),
        "--tools",
        "",
    ]

    try:
        proc = subprocess.run(
            argv,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=CLI_TIMEOUT_SECONDS,
        )
    except FileNotFoundError:
        return {"ok": False, "error": f"'{CLAUDE_BIN}' 실행 파일을 찾을 수 없습니다."}
    except subprocess.TimeoutExpired:
        return {
            "ok": False,
            "error": f"claude CLI 호출이 {CLI_TIMEOUT_SECONDS}초 내에 끝나지 않았습니다.",
        }

    if proc.returncode != 0:
        return {
            "ok": False,
            "error": f"claude CLI 종료 코드 {proc.returncode}: {proc.stderr.strip()[:500]}",
        }

    try:
        data = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        return {"ok": False, "error": f"CLI 출력 JSON 파싱 실패: {exc}"}

    cost_usd = float(data.get("total_cost_usd", 0.0) or 0.0)

    if data.get("is_error"):
        return {
            "ok": False,
            "error": f"CLI가 에러를 보고함: {str(data.get('result', ''))[:500]}",
            "cost_usd": cost_usd,
        }

    structured = data.get("structured_output")
    if not isinstance(structured, dict) or "title" not in structured or "body" not in structured:
        return {
            "ok": False,
            "error": "structured_output에 title/body가 없습니다.",
            "cost_usd": cost_usd,
        }

    return {
        "ok": True,
        "content": structured,
        "cost_usd": cost_usd,
        "session_id": data.get("session_id"),
    }


# ---------------------------------------------------------------------------
# 배포 / 안전 종료
# ---------------------------------------------------------------------------


def deploy_to_server(
    content_data: dict[str, Any], state: dict[str, Any], state_manager: StateManager
) -> dict[str, Any]:
    """생성된 콘텐츠 데이터를 운영 서버(가상의 엔드포인트)로 POST 요청을 보내
    배포한다. 배포에 성공하면 state.json의 완료된 작업 목록을 갱신한다.
    """
    try:
        response = requests.post(DEPLOY_ENDPOINT, json=content_data, timeout=10)
        response.raise_for_status()
        success = True
        detail = f"HTTP {response.status_code}"
    except requests.RequestException as exc:
        success = False
        detail = f"배포 요청 실패: {exc}"

    if success:
        state["completed_tasks"].append(
            {
                "task": content_data.get("title", "제목 없는 콘텐츠"),
                "deployed_at": datetime.now().isoformat(),
            }
        )
        state_manager.save(state)

    return {"success": success, "detail": detail}


def save_state_and_exit(
    completed_summary: str,
    next_todo: str,
    state: dict[str, Any],
    state_manager: StateManager,
    reason: str = "정상 종료",
) -> None:
    """시간 한도 초과, 누적 비용 한도 초과, 에러 발생 시 호출되는 안전 종료
    함수. 현재 상태를 state.json과 로그 마크다운 파일에 기록한 뒤 프로세스를
    종료(sys.exit)한다.
    """
    state["pending_tasks"] = [next_todo] + [
        t for t in state.get("pending_tasks", []) if t != next_todo
    ]
    state_manager.save(state)

    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"\n## 세션 종료 - {datetime.now().isoformat()}\n")
        f.write(f"- 종료 사유: {reason}\n")
        f.write(f"- 완료 요약: {completed_summary}\n")
        f.write(f"- 다음 할 일: {next_todo}\n")
        f.write(f"- 누적 비용(USD): {state.get('total_cost_usd', 0.0):.4f}\n")

    print(f"[안전 종료] 사유: {reason}")
    print(f"[안전 종료] 누적 비용: ${state.get('total_cost_usd', 0.0):.4f}")
    print("[안전 종료] 상태를 저장했습니다. 다음 실행 시 이어서 진행합니다.")
    sys.exit(0)


# ---------------------------------------------------------------------------
# 에이전트 메인 루프
# ---------------------------------------------------------------------------


class AutonomousAgent:
    """`claude` CLI를 서브프로세스로 호출해 리서치 -> 생성 -> 배포 작업을
    반복 수행하는 자율 에이전트. 시간 한도와 누적 비용 한도, 반복 실패에
    대한 방어 로직을 포함한다.
    """

    def __init__(self) -> None:
        self.state_manager = StateManager(STATE_FILE)
        self.state = self.state_manager.load()
        self.start_time = time.time()

    def elapsed_seconds(self) -> float:
        return time.time() - self.start_time

    def time_remaining(self) -> float:
        return MAX_RUNTIME_SECONDS - self.elapsed_seconds()

    def budget_remaining_usd(self) -> float:
        return MAX_TOTAL_BUDGET_USD - self.state.get("total_cost_usd", 0.0)

    def next_pending_task(self) -> str | None:
        pending = self.state.get("pending_tasks", [])
        return pending[0] if pending else None

    def run(self) -> None:
        """메인 while 루프. 시간/비용 한도를 초과하거나 더 이상 작업이 없을
        때까지 반복한다.
        """
        print(
            f"[시작] 에이전트 실행 "
            f"(제한 시간: {MAX_RUNTIME_SECONDS}초, 누적 비용 한도: ${MAX_TOTAL_BUDGET_USD})"
        )
        if self.state.get("completed_tasks"):
            print(
                f"[재개] 이전 세션에서 이어서 시작합니다. "
                f"완료된 작업 수: {len(self.state['completed_tasks'])}, "
                f"누적 비용: ${self.state.get('total_cost_usd', 0.0):.4f}"
            )

        while True:
            if self.time_remaining() <= 0:
                save_state_and_exit(
                    completed_summary=(
                        f"시간 제한 도달. 총 {len(self.state['completed_tasks'])}개 작업 완료."
                    ),
                    next_todo=self.next_pending_task() or "새로운 콘텐츠 주제 탐색 필요",
                    state=self.state,
                    state_manager=self.state_manager,
                    reason="시간 제한 초과 (5시간)",
                )

            if self.budget_remaining_usd() <= 0:
                save_state_and_exit(
                    completed_summary=(
                        f"누적 비용 한도 초과. 총 {len(self.state['completed_tasks'])}개 작업 완료, "
                        f"누적 비용 ${self.state.get('total_cost_usd', 0.0):.4f}."
                    ),
                    next_todo=self.next_pending_task() or "새로운 콘텐츠 주제 탐색 필요",
                    state=self.state,
                    state_manager=self.state_manager,
                    reason="누적 비용 한도 초과",
                )

            topic = self.next_pending_task()
            if topic is None:
                save_state_and_exit(
                    completed_summary=(
                        f"모든 예정 작업 완료. 총 {len(self.state['completed_tasks'])}개 배포."
                    ),
                    next_todo="새로운 콘텐츠 주제를 pending_tasks에 추가 필요",
                    state=self.state,
                    state_manager=self.state_manager,
                    reason="모든 작업 완료",
                )

            self._process_task(topic)

    def _process_task(self, topic: str) -> None:
        """하나의 작업(주제)에 대해 리서치/초안 생성 -> Claude CLI로 콘텐츠
        정제 -> 배포까지 처리한다. 실패 시 재시도 횟수를 누적하고, 한도를
        넘으면 blocked_tasks로 옮긴다.
        """
        research_data = dummy_research(topic)
        draft_content = dummy_generate(topic, research_data)
        prompt = build_prompt(topic, research_data, draft_content)

        result = call_claude_cli(prompt)

        # 실패 여부와 무관하게 실제로 소비된 비용은 항상 누적 반영한다.
        self.state["total_cost_usd"] = self.state.get("total_cost_usd", 0.0) + result.get(
            "cost_usd", 0.0
        )
        self.state_manager.save(self.state)

        if not result["ok"]:
            self._register_failure(topic, result["error"])
            return

        deploy_result = deploy_to_server(result["content"], self.state, self.state_manager)

        if deploy_result["success"]:
            if topic in self.state["pending_tasks"]:
                self.state["pending_tasks"].remove(topic)
            self.state["task_failure_counts"].pop(topic, None)
            self.state_manager.save(self.state)
            print(
                f"[배포 완료] '{topic}' 배포 성공: {deploy_result['detail']} "
                f"(이번 호출 비용: ${result['cost_usd']:.4f})"
            )
        else:
            self._register_failure(topic, deploy_result["detail"])

    def _register_failure(self, topic: str, error_message: str) -> None:
        """작업 실패를 기록하고, 연속 실패 횟수가 한도를 넘으면 해당 작업을
        pending_tasks에서 blocked_tasks로 옮겨 무한 재시도를 방지한다.
        """
        counts = self.state["task_failure_counts"]
        counts[topic] = counts.get(topic, 0) + 1
        self.state_manager.save(self.state)
        print(f"[실패] '{topic}': {error_message} (연속 실패 {counts[topic]}회)")

        if counts[topic] >= MAX_TASK_RETRIES:
            if topic in self.state["pending_tasks"]:
                self.state["pending_tasks"].remove(topic)
            self.state["blocked_tasks"].append(topic)
            counts.pop(topic, None)
            self.state_manager.save(self.state)
            print(f"[보류] '{topic}'을(를) {MAX_TASK_RETRIES}회 연속 실패로 blocked_tasks로 이동합니다.")


def main() -> None:
    agent = AutonomousAgent()
    try:
        agent.run()
    except KeyboardInterrupt:
        save_state_and_exit(
            completed_summary=(
                f"사용자에 의한 수동 중단. 총 {len(agent.state['completed_tasks'])}개 작업 완료."
            ),
            next_todo=agent.next_pending_task() or "다음 콘텐츠 주제 확인 필요",
            state=agent.state,
            state_manager=agent.state_manager,
            reason="수동 중단 (KeyboardInterrupt)",
        )


if __name__ == "__main__":
    main()
