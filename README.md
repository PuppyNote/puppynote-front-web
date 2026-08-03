# puppynote-front-web

PuppyNote 모바일 웹. 네이티브 앱(`puppynote-front-app`)의 WebView 안에서 실제 화면을 렌더링하는 프론트엔드입니다.
일반 모바일 브라우저에서도 동작하지만, **PC 반응형은 지원하지 않습니다** (모바일 폭 고정).

## 기술 스택

| 항목      | 선택                                     |
| --------- | ---------------------------------------- |
| 빌드      | Vite 8                                   |
| 언어      | TypeScript 6                             |
| UI        | React 19                                 |
| 스타일    | TailwindCSS 4 (`@tailwindcss/vite` 플러그인) |
| 라우팅    | react-router-dom 7 (`createBrowserRouter`) |
| HTTP      | axios                                    |
| 린트/포맷 | ESLint 10 (flat config) + Prettier       |

로그인 이후에만 쓰이는 개인화 서비스라 SEO가 불필요하므로 SSR 없이 SPA로 구성했습니다.
스타일은 네이티브 앱이 쓰는 NativeWind와 같은 Tailwind 계열이라 클래스/토큰을 그대로 옮기기 좋습니다.

## 시작하기

```bash
npm install
cp .env.example .env   # VITE_API_URL 등을 채웁니다
npm run dev            # http://localhost:3000 (LAN 바인딩되어 실기기에서도 접속 가능)
```

| 스크립트                | 설명                          |
| ----------------------- | ----------------------------- |
| `npm run dev`           | 개발 서버 (포트 3000, host 바인딩) |
| `npm run build`         | 타입 체크 + 프로덕션 빌드     |
| `npm run preview`       | 빌드 결과 미리보기            |
| `npm run lint`          | ESLint                        |
| `npm run format`        | Prettier 적용                 |
| `npm run typecheck`     | 타입 체크만                   |

## 환경 변수

`.env` (git 미추적, `.env.example` 참고)

| 키                 | 설명                          |
| ------------------ | ----------------------------- |
| `VITE_API_URL`     | puppynote-server 주소         |
| `VITE_API_TIMEOUT` | 요청 타임아웃(ms). 기본 10000 |

## 폴더 구조

```
src/
├── bridge/            # 앱 WebView 브릿지 (window.PuppyNoteBridge)
│   ├── protocol.ts    #   규약 상수/타입 (앱 BridgeProtocol.ts의 웹 사본)
│   ├── bridge.ts      #   isInApp / requestBridge / onBridgeEvent
│   └── useBridge.ts   #   React 훅
├── components/
│   ├── common/        # 화면 공용 컴포넌트
│   └── layout/        # TopBar, BottomTabBar
├── layouts/           # TabLayout(탭 있음) / PlainLayout(탭 없음)
├── pages/             # 화면 단위 컴포넌트
├── routes/            # paths.ts(경로 상수·탭 정의), router.tsx
├── services/
│   ├── api/           # ApiService(axios 인스턴스·인터셉터), types
│   └── auth/          # tokenStorage
└── index.css          # Tailwind 진입점 + 모바일 셸 CSS 변수/유틸리티
```

`@/*` 별칭이 `src/*`를 가리킵니다 (`vite.config.ts`와 `tsconfig.app.json`에 함께 설정).

## 모바일 셸

- `index.html`의 viewport: `viewport-fit=cover`, `user-scalable=no` — 노치 대응 + 웹뷰 확대 방지
- `#root`는 `--app-max-width`(480px)로 고정, PC에서는 가운데 정렬만 합니다
- safe-area는 CSS 변수(`--safe-top/bottom/left/right`)와 유틸리티(`pt-safe`, `pb-safe`, `px-safe`, `pb-tab-bar`)로 다룹니다
- `TabLayout`은 세로 flex 3단(상단 바 / 스크롤 본문 / 하단 탭) 구조라 탭 바를 `fixed`로 띄우지 않아도 되고, 키보드가 올라와도 레이아웃이 깨지지 않습니다
- 하단 탭 구성은 네이티브 앱 `AppNavigator`와 동일합니다: 홈 / 산책 / 용품 / 커뮤니티 / 음식 / 설정

## HTTP 클라이언트

`src/services/api/ApiService.ts`

- 요청 시 저장된 accessToken을 `Authorization: Bearer`로 부착
- 응답에서 공통 래퍼(`{ statusCode, httpStatus, message, data }`)를 벗겨 반환
- 401이면 `POST /api/v1/auth/refresh`로 갱신 후 원요청을 1회 재시도. 갱신 중 들어온 401 요청들은 큐에 넣었다가 새 토큰으로 한 번에 재시도(single-flight)
- 갱신까지 실패하면 토큰을 지우고 `setLogoutListener` 콜백 호출 → `App.tsx`가 `/login`으로 보냅니다

갱신 엔드포인트/응답 형태는 네이티브 앱의 `src/services/ApiService.ts`와 동일하게 맞춰 두었고, 실제 연동 티켓에서 백엔드와 최종 확인합니다.

## 앱 브릿지

앱은 `injectedJavaScriptBeforeContentLoaded`로 `window.PuppyNoteBridge`를 주입하므로 첫 렌더 시점부터 존재합니다.

```ts
import { isInApp, requestBridge, onBridgeEvent, BridgeAction } from '@/bridge'

if (isInApp()) {
  const data = await requestBridge(BridgeAction.LOGIN_KAKAO)
}
```

- `isInApp()` — 앱 WebView 여부 판별의 **유일한 기준** (UA 스니핑은 보조)
- `isActionSupported(action)` — 구버전 앱 대응. 없으면 웹 폴백으로 분기
- `onBridgeEvent(event, handler)` / `useBridgeEvent` — 앱 → 웹 이벤트 구독
- 규약 원본: `puppynote-front-app/src/bridge/BridgeProtocol.ts`. 앱 쪽이 바뀌면 `src/bridge/protocol.ts`도 함께 갱신해야 합니다

## 다음 단계 (후속 티켓)

- 디자인 토큰(색상/타이포) 이식 → `index.css`의 `@theme` 블록
- 화면별 이식 (`src/pages/*`의 PlaceholderPage 교체)
- 인증 플로우 + 보호 라우트, 브릿지 로그인 액션 연동
- 엔드포인트 모듈(`src/services/api/endpoints/*`) 추가
