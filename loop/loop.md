너는 Anthropic API와 Python을 활용해 자율적으로 동작하는 'Autonomous Agent Loop'를 설계하고 코드를 작성하는 시니어 AI 엔지니어 겸 백엔드 개발자야.

[작업 목표]
최대 5시간 동안 또는 토큰 90% 까지 도달할 때까지 웹 페이지용 콘텐츠를 리서치, 생성, 그리고 서버에 자동 배포(Deploy)하며, 토큰 한계나 예기치 않은 오류 발생 시 진행 상태를 안전하게 저장하고 종료하는 완벽한 Python 스크립트를 작성해 줘.

[시스템 및 아키텍처 요구사항]
다음 요구사항을 정확히 반영하여 모듈화된 Python 코드를 작성해야 해.

1. Main Loop 및 시간 제어 (Time Management)
- `while` 루프를 사용하여 에이전트가 지속적으로 작업을 수행하도록 해.
- 스크립트 시작 시점의 `time.time()`을 기록하고, 루프를 돌 때마다 5시간(18,000초)이 경과했는지 체크하여, 시간이 넘으면 안전하게 상태를 저장하고 루프를 종료하는 로직을 포함해.

2. 상태 추적 (State Management)
- `state.json` 파일을 사용하여 현재까지 완료된 작업 목록(Completed Tasks)과 앞으로 해야 할 작업 목록(Pending Tasks)을 지속적으로 업데이트해.
- 스크립트가 재시작될 때 `state.json`이 존재하면, 이전에 멈춘 부분부터 다시 시작할 수 있도록 컨텍스트를 로드하는 기능(Resume)을 구현해.

3. Tool Use (Function Calling) 구현
Anthropic SDK의 `tools` 매개변수를 사용하여 다음 두 가지 핵심 도구를 정의하고 클로드가 이를 호출할 수 있도록 라우팅 로직을 작성해.
- `deploy_to_server(content_data: dict)`: 생성된 데이터를 운영 서버(가상의 엔드포인트)로 POST 요청을 보내어 배포하는 도구. 배포 성공 시 `state.json`을 업데이트해.
- `save_state_and_exit(completed_summary: str, next_todo: str)`: 컨텍스트 한계(Max Tokens)에 도달하거나, 에러가 발생하거나, 지정된 시간이 끝났을 때 클로드가 스스로 호출하는 도구. 이 도구가 호출되면 현재 상태를 로그/마크다운 파일로 저장하고 시스템을 안전하게 종료(sys.exit)해.

4. 토큰 및 에러 핸들링 (Graceful Fallback)
- API 응답의 `stop_reason`을 확인해. 만약 `max_tokens`이거나 컨텍스트 윈도우가 가득 차간다면, 즉시 작업을 중단시키고 `save_state_and_exit` 함수를 강제로 트리거하는 로직을 방어적으로 구현해.

[출력 요구사항]
위 아키텍처가 모두 포함된 하나의 완성된, 그리고 즉시 실행 가능한 `main.py` 코드를 제공해 줘. 
- 코드 내에는 각 함수와 클래스에 대한 명확한 Docstring과 주석을 달아줘.
- 리서치 및 콘텐츠 생성 부분은 가상의 함수(`dummy_research()`, `dummy_generate()`)로 처리해도 되지만, 프롬프트를 통해 클로드 API에 요청하고 응답받는 흐름은 실제 코드로 구현해야 해.
- 필요한 `.env` 파일 예시와 `requirements.txt` 내용도 함께 제공해.