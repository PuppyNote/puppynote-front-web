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
public/assets/         # 네이티브 앱 assets/에서 옮겨온 PNG (탭 아이콘, 알림, 앱 아이콘, 소셜 버튼)
src/
├── bridge/            # 앱 WebView 브릿지 (window.PuppyNoteBridge)
│   ├── protocol.ts    #   규약 상수/타입 (앱 BridgeProtocol.ts의 웹 사본)
│   ├── bridge.ts      #   isInApp / requestBridge / onBridgeEvent
│   └── useBridge.ts   #   React 훅
├── components/
│   ├── common/        # 화면 공용 컴포넌트 (+ modal/, index.ts barrel)
│   └── layout/        # TopBar, BottomTabBar
├── hooks/             # useHardwareBack, useBodyScrollLock
├── layouts/           # TabLayout(탭 있음) / PlainLayout(탭 없음)
├── pages/             # 화면 단위 컴포넌트
├── routes/            # paths.ts(경로 상수·탭 정의), router.tsx
├── services/
│   ├── api/           # ApiService(axios 인스턴스·인터셉터), types
│   ├── auth/          # tokenStorage
│   └── image/         # imagePicker (브릿지 PICK_IMAGE + <input type="file"> 폴백)
├── utils/             # cn (className 합치기)
└── index.css          # Tailwind 진입점 + @theme 디자인 토큰 + 모바일 셸 변수/유틸리티
```

`@/*` 별칭이 `src/*`를 가리킵니다 (`vite.config.ts`와 `tsconfig.app.json`에 함께 설정).

## 모바일 셸

- `index.html`의 viewport: `viewport-fit=cover`, `user-scalable=no` — 노치 대응 + 웹뷰 확대 방지
- `#root`는 `--app-max-width`(480px)로 고정, PC에서는 가운데 정렬만 합니다
- safe-area는 CSS 변수(`--safe-top/bottom/left/right`)와 유틸리티(`pt-safe`, `pb-safe`, `px-safe`, `pb-tab-bar`)로 다룹니다
- `TabLayout`은 세로 flex 3단(상단 바 / 스크롤 본문 / 하단 탭) 구조라 탭 바를 `fixed`로 띄우지 않아도 되고, 키보드가 올라와도 레이아웃이 깨지지 않습니다
- 하단 탭 구성은 네이티브 앱 `AppNavigator`와 동일합니다: 홈 / 산책 / 용품 / 커뮤니티 / 음식 / 설정

## 디자인 시스템

토큰은 `src/index.css`의 `@theme` 블록에 있습니다. 값의 출처는
`puppynote-front-app/docs/webview-migration/01-design-spec.md` §2이고, 그 문서의 원칙대로
**figma_tokens.json이 아니라 네이티브 실제 코드가 기준**입니다.

| 그룹        | 이름                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------- |
| 브랜드      | `brand`(#eebd2b) `brand-10` `brand-20` `brand-bg`(#fcfaf2 전역 배경)                            |
| 텍스트/보더 | `ink-50` ~ `ink-900` (= Tailwind slate)                                                         |
| 시맨틱      | `success`/`-bg`/`-alt`, `warning`/`-bg`, `error`/`-bg`/`-border`/`-border-strong`               |
| 보조        | `amber-50/100/500/700`, `sky-100`, `yellow-50`, `kakao`, `switch-off-track`, `switch-off-thumb` |
| 기타        | `dim`(모달 딤 rgba(0,0,0,.5))                                                                   |
| radius      | `sm 8` `md 12` `lg 16` `xl 20` `2xl 24` `3xl 28` `4xl 32` `full 9999`                           |
| spacing     | `xs 4` `sm 8` `md 12` `lg 16` `xl 20` `2xl 24` `3xl 32` `4xl 40` (Tailwind 숫자 스케일과 병행)  |
| shadow      | `card` `input` `brand` `modal` `fab`                                                            |
| 타이포      | `caption-xs 10` `caption 12` `body 14` `body-lg 16` `title-sm 18` `title 20` `heading 24` `display-sm 30` `display 40` |

> ⚠️ radius 스케일은 Tailwind 기본값을 **의도적으로 덮어씁니다**. 이 프로젝트에서 `rounded-lg`는 16px입니다.

문서 §4의 불일치 7건은 아래처럼 정리해서 반영했습니다.

| # | 네이티브 현황                                            | 웹에서의 처리                        |
| - | -------------------------------------------------------- | ------------------------------------ |
| 1 | 스플래시 배경만 `#fcfbf8`                                | `brand-bg`(#fcfaf2) 하나로 통일      |
| 2 | 산책 화면만 gray 계열(`#9ca3af`, `#6b7280`)              | `ink-400`/`ink-500`(slate)로 통일    |
| 3 | 알람 토글만 카카오 옐로우(`#FEE500`)                     | 토글 ON은 `brand`로 통일 (`kakao`는 소셜 로그인 버튼 용도로만 남김) |
| 4 | `borderRadius: 999`와 `9999` 혼재                        | `full: 9999px` 하나로                |
| 5 | 로그인 입력창만 Android에서 `monospace`                  | 전 화면 동일 sans-serif (`body`에 지정) |
| 6 | typography 토큰 없음                                     | §2 스케일을 `--text-*`로 채택        |
| 7 | `theme.extend`가 비어 토큰이 코드에 연결 안 됨           | `@theme`에 전량 반영                 |

개발 서버에서 `/__design`으로 들어가면 토큰과 공통 컴포넌트를 한 화면에서 확인할 수 있습니다
(`import.meta.env.DEV`일 때만 라우터에 등록됩니다).

### 공통 컴포넌트 ↔ 네이티브 원본

`import { Card, Badge } from '@/components/common'` 형태로 씁니다.

| 웹                                       | 네이티브 원본                                  | 비고                                                     |
| ---------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| `components/layout/TopBar`               | `common/item/TopBar.tsx`                       | 알림 점 · 뒤로가기 · 앱 아이콘                            |
| `components/layout/BottomTabBar`         | `common/item/BottomTab.tsx`                    | 아이콘만(라벨 없음), 활성 `scale(1.4)`, 펫 미등록 비활성   |
| `common/Card`                            | `common/card/Card.tsx`                         |                                                          |
| `common/Badge`                           | `common/item/Badge.tsx`                        |                                                          |
| `common/CustomText`                      | `common/item/CustomText.tsx`                   | 웹에서는 타이포 스케일 고정용                             |
| `common/FloatingActionButton`            | `common/item/FloatingActionButton.tsx`         | `fixed` + `anchor-right`                                  |
| `common/SearchBar`                       | `common/item/SearchBar.tsx`                    |                                                          |
| `common/ScrollableTab`                   | `common/item/ScrollableTab.tsx`                |                                                          |
| `common/PetTab`                          | `common/item/PetTab.tsx`                       | 표시 전용(데이터·모달 분리)                               |
| `common/WheelPicker`                     | `common/item/WheelPicker.tsx`                  | **프로토타입** — 스크롤 스냅 기반                          |
| `common/PagedList`                       | `common/item/PagedFlatList.tsx`                | **프로토타입** — IntersectionObserver 무한 스크롤          |
| `common/MultiImageSelector`              | `common/item/MultiImageSelector.tsx`           | 브릿지 `PICK_IMAGE` + `<input type="file">` 폴백           |
| `common/modal/BottomSheetModal`          | (각 모달에 흩어져 있던 딤/시트 공통부)         | Esc · 딤 클릭 · 하드웨어 뒤로가기로 닫힘                   |
| `common/modal/DatePickerModal`           | `common/modal/DatePickerModal.tsx`             | **프로토타입** — OS 기본 피커 미사용                       |
| `common/modal/TimePickerModal`           | `common/modal/TimePickerModal.tsx`             | **프로토타입** — OS 기본 피커 미사용                       |

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

### 하드웨어 뒤로가기

앱은 Android 뒤로가기를 스스로 처리하지 않고 웹에 위임합니다. 핸들러가 **동기적으로 `true`**를
반환해야 "웹이 처리했다"로 간주되고, 아니면 앱이 400ms ack 타임아웃 뒤 자체 뒤로가기/종료로 폴백합니다.
그래서 `useHardwareBack`의 핸들러 안에서는 `await`을 쓰면 안 됩니다.

```ts
useHardwareBack(() => {
  closeModal()
  return true // 동기 반환. 비동기 작업이 필요하면 void로 띄우고 true를 먼저 반환하세요.
}, isOpen)
```

여러 겹의 모달이 열려 있으면 가장 나중에 등록된 핸들러부터 기회를 갖습니다(LIFO).

### 이미지 선택

```ts
const images = await pickImages({ max: 10 }) // 취소하면 빈 배열
```

앱 안에서는 `PICK_IMAGE`(base64 dataUrl), 브라우저에서는 `<input type="file">` + 캔버스 축소를
쓰지만 반환 형태(`PickedWebImage`)는 같습니다. 앱이 직접 업로드하고 URL만 돌려주는 `UPLOAD_IMAGE`
액션이 나중에 생기면 `src`가 URL로 바뀔 뿐이라 호출부는 그대로입니다.

## 다음 단계 (후속 티켓)

- 화면별 이식 (`src/pages/*`의 PlaceholderPage 교체)
- 인증 플로우 + 보호 라우트, 브릿지 로그인 액션 연동
- 엔드포인트 모듈(`src/services/api/endpoints/*`) 추가
- PetContext(펫 목록·선택 상태) → `BottomTabBar`의 `hasPet`, `PetTab` 연결
- `CustomAlert` 이식 후 `MultiImageSelector`/`BottomTabBar`의 `onError`·`onDisabledTabClick` 연결
- 알림 서비스 이식 후 `TopBar`의 미확인 알림 표시·이동 연결
- `WheelPicker`/`PagedList` 완성도 보강 (휠 원근 효과, 목록 가상 스크롤)
