// test/ 아래 *.test.mjs 를 **전부** 찾아, 각각 **별도 프로세스로** 돌린다.
//
// 왜 나열을 버렸나 (2026-08-09 감사):
//   package.json 의 test 가 파일 9개를 손으로 나열했는데 test/ 에는 10개가 있었다.
//   빠진 하나가 test/runeword-coherence.test.mjs — **그날 만든 회귀 가드**다.
//   만든 사람이 손으로 돌려 통과를 봤고 `npm test` 도 통과를 봤다. 둘이 다른 것이었다.
//   결과: 룬워드 요약↔상세 모순(9종에서 실제로 났던 사고)이 경고 없이 되돌아올 수 있었다.
//   나열은 사람이 기억해야 하고, 사람은 잊는다. 파일시스템을 진실원으로 삼는다.
//
// 왜 import 가 아니라 자식 프로세스인가 (이걸 고치다 **한 번 더 당했다**):
//   처음엔 await import() 로 순차 실행했다. 그런데 테스트 파일 중 일부가 끝에서
//   process.exit() 를 부른다 — grail-store 가 4번째라, 거기서 러너 전체가 죽고
//   뒤의 6개(item-search·price-baseline·rune-planner·runeword-coherence·sync-code·sync-pull)가
//   **한 줄도 안 돌았다.** 그런데 종료코드는 0이라 초록불이 떴다.
//   가드를 고치려다 가드를 더 크게 끄는 것이 될 뻔했다. 프로세스를 분리하면 이 문제가 없다.
//
// 실행 결과에 **몇 개를 돌렸는지** 반드시 찍는다 — 숫자가 줄면 눈에 보여야 한다.

import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));

const files = readdirSync(HERE)
  .filter((f) => f.endsWith(".test.mjs"))
  .sort();

if (files.length === 0) {
  console.error("❌ test/ 에서 *.test.mjs 를 하나도 못 찾았다 — 경로가 바뀌었나?");
  process.exit(1);
}

console.log(`테스트 ${files.length}개 실행\n`);

const failed = [];
for (const f of files) {
  const r = spawnSync(process.execPath, [join(HERE, f)], { stdio: "inherit" });
  if (r.status !== 0) failed.push(`${f} (exit ${r.status})`);
}

console.log(`\n${"─".repeat(52)}`);
if (failed.length > 0) {
  console.error(`❌ ${files.length}개 중 ${failed.length}개 실패`);
  for (const f of failed) console.error(`   - ${f}`);
  process.exit(1);
}
console.log(`✅ ${files.length}개 전부 통과`);
