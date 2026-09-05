// 공포의 영역 API 의 3단 폴백(live → stale → mock) 중 「stale」을 만드는 순수 함수.
//
// 왜 (2026-09-05 사고): d2runewizard 가 일시 장애를 내자 라우트가 모의 로테이션을 반환했고,
//   그 응답이 ISR 캐시에 실려 사용자에게 **지어낸 지역**이 실데이터처럼 보였다("테러존 시간이 안 맞아").
//   모의는 지역을 발명하지만, 조금 전까지 진짜였던 데이터는 최소한 거짓말은 아니다 — 그래서
//   실패 시엔 마지막 정상 응답을 확인 시각과 함께 내보내고, 그것마저 없을 때만 모의로 떨어진다.
//
// saved 형태: { at: ISO 문자열(저장 시각), payload: 라우트가 반환했던 live 응답 }

/** 이 응답을 「마지막 정상」으로 보관할 가치가 있는가 — live 이고 현재 지역이 실재할 때만. */
export function rememberable(payload) {
  return Boolean(payload && payload.mode === "live" && payload.current);
}

/** 보관본 → stale 응답. 보관본이 쓸 수 없는 꼴이면 null(호출부가 모의로 폴백). 원본은 변형하지 않는다. */
export function staleFrom(saved, reason) {
  if (!saved || !saved.payload || !saved.payload.current) return null;
  return {
    ...saved.payload,
    mode: "stale",
    reason: reason || null,
    staleAsOf: saved.at || null,
  };
}
