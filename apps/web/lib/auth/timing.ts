/**
 * 응답 시간 균일화(+지터). 비밀번호 찾기처럼 "계정 존재 여부"를 노출하면 안 되는 흐름에서
 * 미등록(즉시 반환) / 등록(메일 발송 대기) 경로의 처리 시간 차이를 줄여 타이밍 사이드채널을 완화한다.
 *
 * @param startedAt Date.now() 기준 처리 시작 시각
 * @param baseMs    최소 응답 시간(기본 700ms)
 * @param jitterMs  추가 무작위 지터 상한(기본 400ms)
 */
export async function obscureTiming(
  startedAt: number,
  baseMs = 700,
  jitterMs = 400,
): Promise<void> {
  const target = baseMs + Math.floor(Math.random() * jitterMs);
  const remaining = target - (Date.now() - startedAt);
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
}
