# 프론트엔드 구현 기준

## 기술 스택

- Framework: Next.js App Router
- UI Library: React
- Language: TypeScript
- Styling: Tailwind CSS v4
- UI Components: shadcn/ui, Base UI, lucide-react
- Server State: TanStack Query
- Forms: React Hook Form
- Validation: Zod
- Client State: React state/context 우선, 전역 상태가 필요할 때 Zustand
- Testing: Vitest, Testing Library, jsdom

## 코드 작성 규칙

- TypeScript `strict` 기준을 유지한다.
- `any`는 피하고, 필요하면 구체적인 타입이나 `unknown`을 먼저 고려한다.
- React 컴포넌트는 기본적으로 Server Component로 작성한다.
- 브라우저 API, state, effect, event handler, TanStack Query hook이 필요한 컴포넌트에만 `"use client"`를 붙인다.
- import alias는 `@/*`를 사용한다.
- className 조합은 `lib/utils.ts`의 `cn()`을 사용한다.
- 새 UI 컴포넌트는 가능하면 `components/ui/`의 shadcn/ui 패턴을 따른다.
- 도메인 기능 컴포넌트는 `components/ui/`에 넣지 말고 기능에 맞는 위치에 둔다.
- 외부 폰트를 빌드 중 네트워크로 가져오지 않는다. 현재는 시스템 폰트를 사용한다.

## UI와 스타일링

- Tailwind CSS를 기본 스타일링 방식으로 사용한다.
- 버튼, 입력, 카드, 모달 등 기본 UI는 shadcn/ui 컴포넌트를 우선 사용하거나 그 패턴을 따른다.
- lucide-react 아이콘을 우선 사용한다.
- 카드 안에 또 다른 카드형 섹션을 중첩하지 않는다.
- 랜딩 페이지가 명시적으로 필요한 경우가 아니면 실제 앱 화면을 우선 만든다.
- 화면 텍스트가 버튼, 카드, 패널 안에서 넘치거나 겹치지 않도록 반응형 제약을 둔다.
- 한 가지 색상 계열만 과도하게 쓰는 팔레트는 피한다.

## 상태 관리

- 서버에서 가져온 데이터, 캐싱, 재검증, mutation은 TanStack Query를 사용한다.
- 폼 상태는 React Hook Form을 사용한다.
- 입력 검증과 API payload 검증은 Zod schema를 사용한다.
- 단순 UI 상태는 컴포넌트 내부 state로 둔다.
- 여러 화면에서 공유되는 클라이언트 상태가 실제로 필요할 때만 Zustand store를 추가한다.
