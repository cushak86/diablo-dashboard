1. 사전 준비


# Claude Code CLI가 설치되어 있어야 함 (claude --version 으로 확인)
cd loop
pip install -r requirements.txt
cp .env.example .env
2. .env 값 채우기

loop/.env.example을 보고 최소한 아래 2개는 실제 값으로 바꿔야 합니다.

ANTHROPIC_API_KEY — --bare 모드는 OAuth/키체인 로그인을 안 쓰므로 이 키가 없으면 CLI 호출이 실패함
DEPLOY_ENDPOINT — 지금은 https://example.com/api/deploy(가상)로 되어 있어서, 실제로 배포 테스트를 하려면 실제 서버 주소나 httpbin.org/post 같은 테스트용 엔드포인트로 바꿔야 응답이 정상적으로 옴
나머지(CLAUDE_MODEL, CLAUDE_EFFORT, MAX_BUDGET_PER_TASK_USD 등)는 기본값 그대로 써도 됨.

3. 작업 목록 지정 (선택)

기본값은 main.py의 DEFAULT_PENDING_TASKS에 있는 예시 3개 주제입니다. 실제로 처리할 주제로 바꾸려면:

처음 실행 전이라면 main.py의 DEFAULT_PENDING_TASKS 리스트를 수정
또는 실행 후 생성된 loop/state.json을 직접 열어 pending_tasks 배열에 원하는 주제 문자열을 추가
4. 실행


cd loop
python main.py
실행하면:

매 작업마다 claude -p를 한 번씩 호출해 콘텐츠(title/body)를 다듬고
Python이 직접 DEPLOY_ENDPOINT로 POST 배포
성공/실패, 누적 비용을 콘솔에 출력
5. 중단 후 재개

Ctrl+C로 끄거나, 5시간(MAX_RUNTIME_SECONDS)이 지나거나, 누적 비용(MAX_TOTAL_BUDGET_USD)을 넘으면 자동으로 state.json에 진행 상황을 저장하고 종료됨
그냥 python main.py를 다시 실행하면 state.json을 읽어서 이어서 진행 (완료된 작업은 건너뜀)
6. 생성되는 파일

파일	내용
loop/state.json	완료(completed_tasks)/대기(pending_tasks)/보류(blocked_tasks) 작업 목록, 누적 비용
loop/agent_log.md	종료될 때마다 사유/요약/다음 할 일/누적 비용이 追加되는 로그
주의할 점

같은 주제가 2번(MAX_TASK_RETRIES) 연속 실패하면 pending_tasks에서 빼서 blocked_tasks로 옮기고 다음 작업으로 넘어갑니다 — 무한 재시도로 예산이 소진되는 걸 막기 위함. blocked_tasks에 쌓인 항목은 state.json을 직접 열어 원인 파악 후 다시 pending_tasks로 옮겨야 재시도됩니다.
DEPLOY_ENDPOINT를 실제 서버로 안 바꾸면 배포는 항상 실패로 처리됩니다(가상 엔드포인트라 404 등이 뜸) — 콘텐츠 생성 자체는 정상 동작하니 로직 테스트는 가능합니다.