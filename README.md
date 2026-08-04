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

| 키                        | 설명                                                             |
| ------------------------- | ---------------------------------------------------------------- |
| `VITE_API_URL`            | puppynote-server 주소                                            |
| `VITE_API_TIMEOUT`        | 요청 타임아웃(ms). 기본 10000                                    |
| `VITE_KAKAO_MAP_APP_KEY`  | 카카오맵 JS SDK 앱 키 (산책 상세의 위치 지도). 비어 있으면 그 영역만 안내 문구로 대체됩니다. [Kakao Developers](https://developers.kakao.com) 앱 설정 > 플랫폼 > Web에 서비스 도메인 등록 필요 |

## 폴더 구조

```
public/assets/         # 네이티브 앱 assets/에서 옮겨온 PNG (탭 아이콘, 알림, 앱 아이콘, 소셜 버튼)
src/
├── bridge/            # 앱 WebView 브릿지 (window.PuppyNoteBridge)
│   ├── protocol.ts    #   규약 상수/타입 (앱 BridgeProtocol.ts의 웹 사본)
│   ├── bridge.ts      #   isInApp / requestBridge / onBridgeEvent
│   └── useBridge.ts   #   React 훅
├── components/
│   ├── auth/          # 로그인/회원가입 화면 조각
│   ├── common/        # 화면 공용 컴포넌트 (+ modal/, index.ts barrel)
│   ├── layout/        # TopBar, BottomTabBar
│   ├── pet/           # 펫 컨텍스트에 붙어 있는 컴포넌트 (PetTabBar, PetRegistrationModal)
│   └── walk/          # 산책 화면 전용 컴포넌트 (펫 컨텍스트·산책 API를 아는 것들, index.ts barrel)
├── hooks/             # useAlert, useHardwareBack, useBodyScrollLock, usePullToRefresh
├── layouts/           # TabLayout(탭 있음) / PlainLayout(탭 없음)
├── pages/             # 화면 단위 컴포넌트
├── routes/            # paths.ts(경로 상수·탭 정의), router.tsx, ProtectedRoute
├── services/
│   ├── api/           # ApiService(axios 인스턴스·인터셉터), types, endpoints/
│   ├── auth/          # tokenStorage, authService, AuthProvider
│   ├── image/         # imagePicker (브릿지 PICK_IMAGE + <input type="file"> 폴백)
│   ├── location/      # 현재 좌표 (브릿지 GET_LOCATION + Geolocation API 폴백)
│   ├── map/           # 카카오맵 JS SDK 로더 (kakaoMap.ts) — 산책 상세 지도 전용
│   └── pet/           # PetContext/PetProvider (펫 목록·선택 상태), selectedPetStorage
├── utils/             # cn(className 합치기), date, clipboard
└── index.css          # Tailwind 진입점 + @theme 디자인 토큰 + 모바일 셸 변수/유틸리티
```

`@/*` 별칭이 `src/*`를 가리킵니다 (`vite.config.ts`와 `tsconfig.app.json`에 함께 설정).

## 모바일 셸

- `index.html`의 viewport: `viewport-fit=cover`, `user-scalable=no` — 노치 대응 + 웹뷰 확대 방지
- `#root`는 `--app-max-width`(480px)로 고정, PC에서는 가운데 정렬만 합니다
- safe-area는 CSS 변수(`--safe-top/bottom/left/right`)와 유틸리티(`pt-safe`, `pb-safe`, `px-safe`, `pb-tab-bar`)로 다룹니다
- `TabLayout`은 세로 flex(상단 바 / 펫 탭 / 스크롤 본문 / 하단 탭) 구조라 탭 바를 `fixed`로 띄우지 않아도 되고, 키보드가 올라와도 레이아웃이 깨지지 않습니다
- 하단 탭 구성은 네이티브 앱 `AppNavigator`와 동일합니다: 홈 / 산책 / 용품 / 커뮤니티 / 음식 / 설정
- 스크롤 본문(`<main data-scroll-container>`)은 하나뿐이고, 화면은 그 안쪽만 그립니다. 당겨서 새로고침(`usePullToRefresh`)은 이 표식으로 스크롤 요소를 찾습니다
- 상단 펫 탭이 보이는 화면은 `routes/paths.ts`의 `PET_TAB_ROUTES`가 정합니다 (네이티브 `Layout showPetTab`에 대응)

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
| `common/PetTab`                          | `common/item/PetTab.tsx`                       | 표시 전용. 데이터·모달을 붙인 것은 `pet/PetTabBar`         |
| `pet/PetTabBar`                          | `common/item/PetTab.tsx`                       | 펫 컨텍스트 + 등록 모달 + 삭제 확인 알럿                   |
| `pet/PetRegistrationModal`               | `common/modal/PetRegistrationModal.tsx`        | 등록/수정 겸용. 가운데 모달(바텀시트 아님)                 |
| `common/WheelPicker`                     | `common/item/WheelPicker.tsx`                  | **프로토타입** — 스크롤 스냅 기반                          |
| `common/PagedList`                       | `common/item/PagedFlatList.tsx`                | **프로토타입** — IntersectionObserver 무한 스크롤          |
| `common/MultiImageSelector`              | `common/item/MultiImageSelector.tsx`           | 브릿지 `PICK_IMAGE` + `<input type="file">` 폴백           |
| `common/modal/BottomSheetModal`          | (각 모달에 흩어져 있던 딤/시트 공통부)         | Esc · 딤 클릭 · 하드웨어 뒤로가기로 닫힘                   |
| `common/modal/GlobalDetailModal`         | `common/modal/GlobalDetailModal.tsx`           | 고정 높이 바텀시트(산책 상세·알람 관리 등). 드래그해서 닫기는 미구현(BottomSheetModal과 동일하게 딤·Esc·하드웨어 뒤로가기만) |
| `common/modal/DatePickerModal`           | `common/modal/DatePickerModal.tsx`             | **프로토타입** — OS 기본 피커 미사용                       |
| `common/modal/TimePickerModal`           | `common/modal/TimePickerModal.tsx`             | **프로토타입** — OS 기본 피커 미사용                       |
| `common/AddTopBar`                       | `common/item/AddTopBar.tsx`                    | 등록/추가 화면(PlainLayout) 전용 상단 바. 뒤로가기 고정, 앱 아이콘 없음 |
| `common/PhotoGallery`                    | `common/item/PhotoGallery.tsx`                 | **프로토타입** — 핀치/더블탭 확대 없음(스와이프 + 라이트박스만) |

## HTTP 클라이언트

`src/services/api/ApiService.ts`

- 요청 시 저장된 accessToken을 `Authorization: Bearer`로 부착
- 응답에서 공통 래퍼(`{ statusCode, httpStatus, message, data }`)를 벗겨 반환
- 401이면 `POST /api/v1/auth/refresh`로 갱신 후 원요청을 1회 재시도. 갱신 중 들어온 401 요청들은 큐에 넣었다가 새 토큰으로 한 번에 재시도(single-flight)
- 갱신까지 실패하면 토큰을 지우고 `setLogoutListener` 콜백 호출 → `App.tsx`가 `/login`으로 보냅니다

갱신 엔드포인트/응답 형태는 네이티브 앱의 `src/services/ApiService.ts`와 동일하게 맞춰 두었고, 실제 연동 티켓에서 백엔드와 최종 확인합니다.

### 엔드포인트 모듈

`src/services/api/endpoints/*`. 필드명·상태코드는 `puppynote-server`의 컨트롤러/DTO를 직접 대조해 맞췄습니다.

| 모듈         | 엔드포인트                                                       | 서버 원본                     |
| ------------ | ---------------------------------------------------------------- | ----------------------------- |
| `auth`       | `/api/v1/auth/*`, `/api/v1/user/signup`, `/api/v1/user/email/send` | `LoginController` `UserController` |
| `user`       | `GET /api/v1/user/profile`                                        | `UserController`              |
| `pet`        | `GET/POST /api/v1/pets`, `PATCH/DELETE /api/v1/pets/{petId}`      | `PetController`               |
| `home`       | `GET /api/v1/home?petId=`                                         | `HomeController`              |
| `weather`    | `GET /api/v1/weather?latitude=&longitude=`                        | `WeatherController`           |
| `petTip`     | `GET /api/v1/pet-tips/random`                                     | `PetTipController`            |
| `petItem`    | `GET /api/v1/pet-items?petId=` (목록만 — 용품 티켓에서 확장)       | `PetItemController`           |
| `storage`    | `POST /api/v1/storage/{bucketKind}` (multipart)                   | `StorageController`           |
| `walk`       | `GET /api/v1/walks`, `GET /api/v1/walks/{walkId}`, `GET /api/v1/walks/calendar`, `POST /api/v1/walks`, `DELETE /api/v1/walks/{walkId}` | `WalkController` |
| `petWalkAlarm` | `GET/POST/PUT /api/v1/pet-walk-alarms`, `PATCH /api/v1/pet-walk-alarms/status`, `DELETE /api/v1/pet-walk-alarms/{alarmId}` | `PetWalkAlarmController` |

> 업로드 응답은 **이미지 키**이고 조회 응답은 **CloudFront 전체 URL**입니다. 기존 이미지를 그대로
> 유지할 때는 `extractImageKey(url)`로 키를 되뽑아 보냅니다(네이티브와 같은 방식).

## 펫 상태 (PetContext)

`src/services/pet/`. 선택된 펫은 홈·산책·용품·가족 관리가 함께 보는 값이라 전역에 둡니다.

```ts
const { pets, selectedPet, isLoadingPet, updateSelectedPet, refreshPets } = usePet()
```

- Provider는 `ProtectedRoute` 안에 있습니다. 로그인해야 조회할 수 있는 데이터이고, 로그아웃하면
  언마운트되며 상태가 함께 비워집니다(네이티브 `resetPetContext`가 필요 없는 이유)
- 선택은 앱 SecureStore(`selectedPetId`/`selectedPetName`), 브라우저에서는 localStorage에 남습니다.
  펫 id/이름뿐이라 토큰과 달리 localStorage를 허용합니다
- 화면은 `isLoadingPet`이 false가 된 뒤에 데이터를 부르세요. 그 전에 부르면 "펫 없음"으로 잘못 그려집니다
- `BottomTabBar`의 `hasPet`(산책/용품 잠금)도 이 값으로 `TabLayout`이 내려줍니다

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

서버로 올릴 때는 `storageApi.uploadImage('PUPPY_PROFILE', picked)`를 쓰면 됩니다.

### 위치

```ts
const { latitude, longitude } = await getCurrentCoordinates()
```

앱 안에서는 브릿지 `GET_LOCATION`(accuracy: balanced), 일반 브라우저에서는 웹 표준
Geolocation API를 씁니다. 권한 거부 등은 예외로 던지므로, 호출부에서 해당 UI만 감추면 됩니다
(홈 날씨 위젯이 그렇게 동작합니다).

주소까지 함께 필요하면(예: 산책 기록 추가의 장소 자동입력) `getCurrentPosition()`을 씁니다.

```ts
const { latitude, longitude, address } = await getCurrentPosition()
```

앱 브릿지에는 `reverseGeocode: true`를 함께 넘겨 주소를 받아오지만, 웹 표준 Geolocation
폴백 경로는 역지오코딩 수단이 없어 `address`가 항상 `null`입니다 — 그 경우 사용자가 직접
입력합니다.

## 지도 (카카오맵)

`src/services/map/kakaoMap.ts`가 카카오맵 JS SDK 로더입니다. 네이티브 `react-native-maps`에
대응하는 웹 표준이 없어서, `puppymap-front-web`과 동일하게 카카오맵을 씁니다.

- SDK `<script>` 태그는 `index.html`에 `autoload=false`로 미리 넣어 두었고, 앱키는
  `%VITE_KAKAO_MAP_APP_KEY%` 자리에 Vite가 빌드/개발 서버 기동 시 치환합니다
- 실제 초기화(`kakao.maps.load`)는 지도를 쓰는 화면에 들어갈 때만 `loadKakaoMaps()`가 수행합니다
- 이 앱에서 지도를 쓰는 곳은 산책 상세(`components/walk/WalkMap.tsx`) 한 곳뿐이고, 마커 하나만
  찍습니다 — 네이티브 원본도 좌표 하나(`WalkDetail.latitude/longitude`)만 저장/조회해서 경로
  (폴리라인) 데이터 자체가 없습니다
- `VITE_KAKAO_MAP_APP_KEY`가 비어 있으면 지도 영역이 안내 문구로 대체됩니다 (에러가 아닙니다)

## 화면 이식 현황

| 화면                       | 상태     | 네이티브 원본                                    |
| -------------------------- | -------- | ------------------------------------------------ |
| 로그인 / 회원가입 / 비번찾기 | 완료     | `screens/login/*`                                |
| 홈                         | 완료     | `screens/home/HomeScreen.tsx`                    |
| 반려동물 등록/관리         | 완료     | `common/modal/PetRegistrationModal.tsx`, `common/item/PetTab.tsx` |
| 산책 (관리/기록추가/상세/알람) | 완료 | `screens/walk/*`, `components/walk/*`            |
| 용품 (목록/등록/카테고리/구매내역) | 완료 | `screens/supply/*`                          |
| 커뮤니티 (목록/상세/글쓰기/내 게시물) | 완료 | `screens/community/*`                    |
| 음식 / AI 문답             | 완료     | `screens/food/FoodScreen.tsx`                    |
| 설정 / 프로필 / 가족 관리 / 알림 | 완료 | `screens/setting/*`, `screens/notification/*` |

기획서상 MVP 범위(Phase1) 전 화면 이식 완료.

## 다음 단계 (후속 티켓)

- 디바이스 푸시 토큰 서버 등록: `puppynote-server`에 등록 API가 아직 없어
  `AuthProvider.finishLogin`에 TODO만 남겨둠 (브릿지로 토큰을 가져오는 부분은 완료)
- `WheelPicker`/`PagedList` 완성도 보강 (휠 원근 효과, 목록 가상 스크롤)
