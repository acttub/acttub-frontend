# 개발 환경과 검증

## 프로젝트

- 프로젝트명: `acttub-frontend`
- 목적: Acttub 서비스의 프론트엔드 애플리케이션
- 로컬 기본 포트: `3000`
- 패키지 매니저: `pnpm`

## 주요 명령어

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

- 개발 서버는 `http://localhost:3000`에서 실행한다.
- 변경 완료 전에는 최소한 `pnpm lint`, `pnpm typecheck`, `pnpm test`를 실행한다.
- 라우팅, 빌드 설정, CSS 설정, 의존성 변경이 있으면 `pnpm build`도 실행한다.

## 디렉터리 구조

- `app/`: Next.js App Router 라우트, 레이아웃, 페이지, provider
- `app/providers.tsx`: 클라이언트 전역 provider. 현재 TanStack Query 설정을 담당한다.
- `components/`: 재사용 UI 컴포넌트
- `components/ui/`: shadcn/ui 기반 컴포넌트
- `lib/`: 앱 공용 유틸리티
- `public/`: 정적 파일
- `.github/workflows/`: GitHub Actions CI 설정

## 테스트 기준

- 컴포넌트 렌더링과 사용자 상호작용은 Testing Library로 테스트한다.
- 테스트 파일은 관련 파일 근처에 `*.test.tsx` 또는 `*.test.ts`로 둔다.
- 사용자가 보는 텍스트, role, label 기준으로 테스트한다.
- 구현 세부 className에 과하게 의존하는 테스트는 피한다.
- 버그 수정 시 가능하면 재발 방지 테스트를 먼저 추가한다.
- 완료를 주장하기 전에 실제 명령을 실행해 검증한다.
- 실패한 명령이 있으면 실패 원인과 남은 리스크를 명확히 남긴다.
