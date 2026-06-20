# AGENTS.md

이 저장소의 기본 지침은 짧게 유지한다. 필요한 세부 지침은 아래 파일을 상황에 맞게 읽는다.

## 필수 기본값

- 프로젝트: `acttub-frontend`
- 기본 브랜치: `dev`
- 작업 브랜치: `feature/<name>` 또는 `fix/<name>`
- 금지: `main`, `dev` 직접 push
- 로컬 개발 서버: `http://localhost:3000`
- 패키지 매니저: `pnpm`

## 세부 지침 경로

- 개발 환경, 구조, 명령어, 테스트: `docs/development.md`
- 프론트엔드 스택, 코드, UI, 상태관리: `docs/frontend-guidelines.md`
- Git, PR, 보안 규칙: `docs/git-workflow.md`

## 작업 원칙

작업 전 현재 브랜치와 변경사항을 확인한다.

```bash
git status --short --branch
```

완료 전 변경 범위에 맞는 검증 명령을 실행하고, 실행하지 못한 검증은 명확히 보고한다.
