# feedback-hub

학생이 개발해 부산대에서 운영 중인 시스템(opus, pickle 등)에 대한 피드백을 한곳에서 받고
처리 상황을 추적하는 웹 서비스입니다. 조교·교수 등 관계자가 피드백을 남기면 개발자가
반영 여부·예정 일정·미구현 사유를 응답으로 관리합니다. 화면은 GitHub Issues의 구조를
참고하되, 사용자가 비개발자이므로 용어와 흐름을 단순하게 다듬었습니다.

운영 주소는 `https://feedback.pnuops.com` 입니다.

## 주요 기능

- 프로젝트별 피드백 등록·목록·상세. 분류(라벨)·상태·작성자·키워드로 필터링합니다.
- 상태 8단계(접수 → 검토 중 → 개발 예정 → 개발 중 → 개발 완료 → 배포 완료 / 보류 / 철회)로
  진행 상황을 추적하고, 상태 타일에서 한눈에 집계를 봅니다.
- 의견(댓글) 스레드, 이모지 리액션, 파일 첨부, 활동 타임라인.
- 비공개 피드백: 항목별 열람 비밀번호로 본문·의견을 보호하고, 목록에는 진행 상태만 노출합니다.
- 상태 변경·댓글 등록 시 관련자에게 이메일로 안내합니다(SMTP 설정 시).

## 동작 방식

로그인은 없습니다. 이름은 브라우저 쿠키에 저장해 다음 방문에 자동으로 채웁니다.
권한은 두 단계입니다.

- **누구나**: 피드백 등록, 의견, 리액션, 첨부.
- **개발자 모드**: 공유 코드로 전환하면 상태·담당자·우선순위 변경, 분류·프로젝트 관리가 열립니다.
  서버는 요청 헤더의 코드를 `.env`의 `ADMIN_PASSWORD`와 상수 시간 비교로 검증합니다.

## 시작하기

```bash
npm install
cp .env.example .env      # DATABASE_URL, ADMIN_PASSWORD 등을 채웁니다
npm run db:deploy         # 마이그레이션 적용
npm run db:seed           # 프로젝트·기본 분류 시드
npm run dev               # http://localhost:3000
```

배포는 저장소 상위의 `docker-compose.yml`로 app·postgres 두 컨테이너를 띄웁니다.
컨테이너 시작 시 `prisma migrate deploy`와 시드를 실행한 뒤 서버를 기동합니다.

```bash
docker compose up -d --build
```

## 구성

- **앱**: Next.js 15(App Router, TypeScript). 페이지와 API(`src/app/api/**`)를 한 프로젝트에서 서빙합니다.
- **DB**: PostgreSQL 16. 스키마는 `prisma/schema.prisma` 한 곳에서 관리하고 마이그레이션으로 반영합니다.
- **UI**: Tailwind CSS + shadcn/ui + lucide 아이콘, 한글 웹폰트 Pretendard.
- **검증**: `bash scripts/verify.sh` 가 lint·type check·Prisma 검증·빌드를 한 번에 돌립니다.
  기여 전 `bash scripts/setup-hooks.sh` 로 커밋 메시지 훅을 설치합니다.

## 아키텍처

```
사용자 ── HTTPS ──▶ traefik(80/443, TLS) ──▶ feedback-app(Next.js :3000)
                                                    │
                                                    ▼
                                          feedback-postgres(:5432)
```

목록·상세는 서버 컴포넌트에서 Prisma로 직접 조회하고, 등록·의견·상태 변경 등 상호작용은
클라이언트에서 `src/app/api/*` 라우트 핸들러를 호출합니다. 외부 공개는 호스트 포트 노출 없이
traefik 라벨의 `Host(...)` 라우팅으로 처리합니다.
