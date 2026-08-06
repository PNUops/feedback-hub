/** 프로젝트 표기: "이름 (도메인)". 도메인이 없으면 약칭으로 대체. */
export function projectDisplay(p: { name: string; key: string; domain?: string | null }): string {
  return `${p.name} (${p.domain ?? p.key})`;
}
