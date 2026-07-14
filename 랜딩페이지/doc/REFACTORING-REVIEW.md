# Style Lab V4 — 리팩토링 검토안

> **상태:** **4차 — Lab 통합·공통 모듈·u-card** (2026-06-02)  
> **기준 코드:** `style-lab-v3/` → `style-lab-v4/`  
> **Style Lab:** **V4에서 유지** (제거하지 않음)

---

## 구현 완료 체크리스트

- [x] V3 → V4 복사
- [x] `archive/` 삭제
- [x] dead JS 삭제 (`authors-showcase-lab.js`, `cases-showcase-s5.js`, `cases-carousel.js`, `i-diff-lab.js`, `promise-carousel.js`, `pillars-carousel.js`)
- [x] dead CSS 삭제 (showcase s1–s5, diff/showcase lab ~390줄)
- [x] `css/tokens.css` 분리 + `--accordion-title-size`
- [x] `css/`, `lab/` 폴더 구조
- [x] `css/theme.css` → `css/sections/*` 6파일 분할
- [x] HTML 빌드 (`npm run build`, `src/partials/`)
- [x] color-lab `GROUP_IDS` / `GROUP_META` 리팩터
- [x] title / lab bar → **Style Lab V4**
- [x] JS `js/` 서브폴더 정리
- [x] 문서 `doc/` 폴더 정리
- [x] `lab/lab-shell.js` 분리 (motion toggle, Lab UI 접기)
- [x] `assets/images/`, `assets/videos/` 통합 + HTML 경로 갱신
- [x] `css/components/card.css`, `css/components/accordion.css` 분리
- [x] dead CSS 2차: `_components.css` quote variant, `card.css` 미사용 블록, `motion.css` 프로덕션만 (~700줄)
- [x] stale build scripts 제거 (`split-theme.mjs`, `trim-dead-css.mjs`, `build:css`)
- [x] `js/motion-utils.js` + 모션 헬퍼 중복 제거 (Lab refresh 훅 유지)
- [x] `_sections-misc.css` → 6개 섹션 파일 분할
- [x] Tier A dead CSS + HTML orphan 정리
- [x] `js/video-in-view.js` (vibe + stakes)
- [x] 성능 quick wins: defer, preload none, bookstore rAF pause
- [x] `lab/init-head.js` — head 인라인 스크립트 단일화 (motion/embed/collapse FOUC, StyleLabStorage V2→V4)
- [x] `lab/style-lab-api.js` — `StyleLab.onRefresh` / `refreshMotionChain` + legacy `__styleLabV2/V3*` 래퍼
- [x] Lab CSS 분리: `lab/lab-chrome.css`, `lab/gradient-effects.css` (`_gradient-lab.css` 제거)
- [x] `js/marquee-loop.js` — `wrapOffset`, `bindDocDrag`, `createRafLoop`
- [x] `js/carousel-autoplay.js` — `buildDots`, `createAutoplay`, `bindHoverPause` (poets 적용)
- [x] `css/components/u-card.css` — 공통 card surface (bg/border/shadow)
- [x] `preview/preview-dual.css`, `preview/preview-dual.js` 분리
- [x] `scripts/check-html.mjs` + `npm run check`
- [x] motion/stats/hero-subject-reel/bookstore → `StyleLab.onRefresh` 등록
- [ ] (선택) `cases-3d-carousel.js` dots/autoplay → CarouselAutoplay
- [ ] (선택) site-nav/bookstore → `MarqueeLoop.bindDocDrag` fuller 통합

---

## 0. 검토 전제 & 한계

- 본 문서는 V3 작업 맥락(Style Lab, stats 컬러, 타이포 `--card-*` 변수, preview-dual 등)과 **다회 코드 리뷰**를 바탕으로 작성했습니다.
- V3 디렉터리가 현 세션에서 직접 grep되지 않아, **라인 수는 작업 중 추정치**입니다. V4 착수 시 `wc -l`로 §1 표를 갱신하세요.
- **실행 전 반드시:** V3를 V4로 복사한 뒤, 각 항목별로 diff·브라우저 회귀 테스트를 수행해야 합니다.
- **의도적으로 제외:** 디자인/카피 변경, 섹션 추가·삭제, SEO/배포 파이프라인 도입(별도 논의).

### 0.1 3회 검토 요약 (자기 검증 로그)

| 회차 | 질문 | 결론 |
|------|------|------|
| **1차** | 어디가 가장 무거운가? | `theme.css` + `color-lab.js` + Lab/showcase variant CSS |
| **2차** | 무엇을 함부로 지우면 안 되나? | motion 토글, stats marquee, cases 3D, Style Lab localStorage |
| **3차** | “가볍게” = 파일 수 감소? | **아니오.** dead code 제거·패턴 통합·Lab 분리가 목표 |

---

## 1. 현재 구조 요약 (V3)

| 구분 | 파일 (대략) | 역할 | 규모 감 |
|------|-------------|------|---------|
| HTML | `index.html`, `preview-dual.html` | 마크업 + Lab bar + color panel | ~800+ / ~360 lines |
| CSS | `base.css` | 레이아웃·공통 섹션·히어로·타이포 골격 | ~460 lines |
| CSS | `theme.css` | i-mylight 테마 전체 (섹션·카드·캐러셀·FAQ·커리큘럼…) | **~2,800 lines** |
| CSS | `site-nav.css` | 네비·stats 밴드·모달 | ~460 lines |
| CSS | `color-lab.css` | Style Lab UI (chips, panel, dropdown) | ~550 lines |
| CSS | `motion.css` | `[data-motion="on"]` 애니메이션 | ~250 lines |
| JS | `color-lab.js` | 컬러 프리셋·localStorage·Lab UI 접기 | ~1,000 lines |
| JS | `site-nav.js` | 네비·stats 마quee·OT 모달 | ~300 lines |
| JS | 기타 | `poets-carousel.js`, `cases-3d-carousel.js`, `total-price-animate.js`, pillars/promise 캐러셀 등 | 각 ~100–250 lines |
| 기타 | `archive/` | 구 섹션 스냅샷 (`i-poem-section` 등) | 프로덕션 미참조 추정 |

**핵심 관찰:** CSS·JS 모두 **단일 HTML 페이지**를 위해 파일은 나뉘어 있으나, `theme.css`와 `color-lab.js`에 **기능·스타일이 과밀**하게 모여 있음.

---

## 2. 1차 검토 — “무겁게 만드는” 원인

### 2.1 CSS: `theme.css` 단일 거대 파일

- 거의 모든 섹션이 `html[data-theme="i-mylight"] .section--i-*` 형태로 **동일 접두사 반복**.
- 카드류 스타일(`.i-block`, `.promise-card`, `.pillar`, `.showcase-card`, `.i-diff__row`)이 **padding / border / shadow / radius** 패턴을 각각 복붙.
- 타이포가 `--card-title-size`, `--card-body-size`로 일부 통일됐으나, **FAQ·커리큘럼 Part 헤드는 16px 고정** 등 예외가 분산 → “전역 규칙 + 로컬 override” 혼재.
- showcase 레이아웃(`showcase--s1` ~ `s5`)은 **Lab/비교용 변형**과 **실제 출판 사례(cases-card)** 가 한 파일에 공존.

**→ 가볍게 만들 수 있는 방향:** 공통 카드/섹션 토큰 + `@layer components` 또는 partial CSS 파일 분리(기능별이 아닌 **패턴별**).

### 2.2 CSS: `base.css` ↔ `theme.css` 이중 정의

- `.hero__title`, `.section__title`, `.pillar__title` 등 **base에 골격 + theme에 i-mylight override** 구조.
- base의 `.pillar__title` / theme의 `html[data-theme="i-mylight"] .pillar__title`이 **font-size·weight·layout**을 나눠 갖고 있어, 한쪽만 수정하면 불일치 발생(이미 V3에서 경험).

**→ 제안:** `data-theme="i-mylight"`가 사실상 유일 테마라면, base는 **리셋·container·Lab shell만** 남기고 테마는 theme(또는 v4 `theme/`) 한곳으로.

### 2.3 CSS: Lab 전용 vs 페이지 스타일 혼재

- `color-lab.css`는 Lab UI 전용이지만, **Lab bar 높이·`--lab-bar-h`** 등이 `index.html` 인라인 스크립트·`base.css`·`color-lab.js`에 걸쳐 있음.
- `theme.css` 내부에 `.i-diff__quote-lab`, `.i-cases__showcase-lab`, `.i-diff__layout-lab` 등 **개발/비교용 Lab 마크업** 스타일이 프로덕션 CSS에 포함.

**→ 제안:** Lab-only CSS/JS를 `lab/` 서브폴더로 묶고, `?lab=0` 또는 빌드 플래그 없이는 **link/script 자체를 빼는** 구조(정적 HTML 기준: `preview-dual.html` / 로컬 전용 `index-lab.html` 분리도 후보).

**구체적 Lab-only CSS selector (theme.css 내):**

- `.i-diff__quote-lab`, `.i-diff__layout-lab`, `.i-cases__showcase-lab`
- `.i-diff__lab-item`, `.i-diff__lab-summary`, `.i-diff__lab-chevron`
- `.showcase--s1` ~ `.showcase--s5` (Featured/rail/poster 등 **레이아웃 variant**)
- `.showcase-card--rail`, `.showcase-card--poster`, `.showcase-s1__strip` …

**구체적 Lab-only HTML 패턴 (index.html):**

- `<div class="lab-bar-shell">` ~ color panel 전체
- `<details class="i-diff__lab-item">` 형태의 Quote/Layout 비교 블록
- 출판 사례 섹션 내 showcase variant 스위처(있다면)

**index.html `<head>` 인라인 스크립트:**

- Lab UI collapsed 초기화, `--lab-bar-h` 설정 등 → **color-lab.js / lab-shell.js와 중복·분산** 가능성. V4에서 단일 초기화 진입점 권장.

### 2.4 JS: `color-lab.js` 과대

- `main` / `cta` / `bg` / `stats` 그룹이 **동일 CRUD·render·dropdown·panel** 로직을 거의 복제.
- `renderChips` / `renderDropdown` / `applyPreset` / `configurePanelForGroup`이 group별 `if` 분기로만 확장 → 그룹 추가 시마다 4~6곳 수정.
- Lab UI 접기(`initLabUiToggle`), Motion 토글(`initMotion`)이 color-lab.js 안에 **관심사 혼합**.

**→ 제안:**  
  - `groups` 설정 객체 하나로 SEED·apply·panelTitle·allowedTypes 통합  
  - Lab chrome(motion, collapse)은 `lab-shell.js`로 분리  
  - **예상 절감:** color-lab.js ~30–40% (300–400 lines)

**현재 group별 분기 지점 (리팩터 시 통합 대상):**

| 함수/영역 | group 분기 |
|-----------|------------|
| `SEED` / `state` | main, cta, bg, stats 각각 |
| `loadState` / `ensureActive` | 4회 반복 |
| `applyPreset` | main / bg / stats / cta(else) |
| `panelTitle` / `configurePanelForGroup` | stats=solid only, bg=palette |
| `init()` | applyActive + renderColorUI ×4 |
| HTML | chips-* / dd-* ×4 (desktop + mobile) |

**stats 그룹 추가 이후:** 위 패턴이 **5번째 그룹 추가 시 6곳 이상 수정** — config-driven이면 1곳 추가로 충분.

### 2.5 JS: 캐러셀·카운터 스크립트 분산

- poets / cases-3d / promise-3d / pillars / stats marquee 등 **패턴 유사**(viewport, track, dots, autoplay, reduced-motion).
- 각 파일이 독립 IIFE → 공통 `createCarousel({...})` 없이 **drag/autoplay/clone 로직 중복** 가능성 높음.

**→ 제안:** `lib/carousel.js` (~80–120 lines) + 섹션별 thin config.  
  - **리스크:** cases 3D transform·blur는 특수 케이스 → 공통화 범위를 **2D fade/slide만**으로 제한.

### 2.6 HTML: `index.html` 단일 대형 파일

- Lab bar + color panel + 전 섹션 + script 10개+ 가 한 파일.
- 섹션 마크업 패턴 반복: `.section` > `.container` > `.section__tag` + `.section__title` + 카드 그리드.

**→ 제안 (정적 한계 내):**  
  - **단기:** 섹션별 HTML 주석·접두 id 통일만 (리스크 낮음)  
  - **중기:** 빌드 없이는 `#include` 불가 → **V4에서 섹션 파일 분리 + 간단 concat 스크립트** (`npm run build:html` 1개) 검토  
  - **장기:** 11ty/vite 등 (별도 항목, 이번 “가볍게” 범위 밖일 수 있음)

### 2.7 `archive/` 폴더

- `archive/i-poem-section/` 등 **현 index에서 미로드**로 추정.
- CSS/JS/HTML 중복 보관 → 리포지토리·검색 노이즈만 증가.

**→ 제안:** git tag/브랜치로 보존 후 **V4에서 제거** (Impact 높음, Risk 낮음).

---

## 3. 2차 검토 — “과하게 줄이면 위험한” 부분 (의심 목록)

| 항목 | 줄이면 안 되는 이유 |
|------|---------------------|
| `html[data-theme="i-mylight"]` 접두사 일괄 제거 | 다른 테ma 실험·Style Lab 전제가 깨질 수 있음 → **theme 단일화 후** 제거 |
| showcase s1–s5 Lab 레이아웃 삭제 | `index.html`에 lab summary/details가 남아 있으면 UI 깨짐 → **HTML과 함께** 제거 |
| motion.css 전체 제거 | `[data-motion="off"]` URL·토글이 전제 → **파일 통합은 가능, 삭제는 불가** |
| stats marquee JS 단순화 | 모바일 drag·clone·awards 정렬 등 엣지 케이스 많음 → **후순위** |
| CSS 변수 과도 통합 | FAQ/Part 16px 같은 **의도적 예외**를 변수 하나에 넣으면 다시 override 지옥 |

---

## 4. 3차 검토 — 자기 검증 (재의심)

**Q1. “가볍다”의 정의가 무엇인가?**  
- 바이트 수 ↓ vs 인지 부하 ↓ vs 수정 포인트 ↓ → **V4 목표는 “수정 포인트 ↓ + dead code ↓”** 로 한정하는 것이 안전.  
- `theme.css` 분할만 하면 **총 라인 수는 오히려 늘 수 있음** (import overhead). “가볍게” ≠ “파일 수 적게”.

**Q2. Lab 분리 시 preview-dual은?**  
- dual preview가 `index.html` iframe이면 Lab bar 중복·postMessage 이슈 확인 필요 → **분리 전 preview-dual 동작 명세 필요**.

**Q3. color-lab 그룹 리팩터만으로 체감이 큰가?**  
- 유지보수는 좋아지나 **로드 크기는 미미** (~30KB 미만). 사용자 체감은 **theme.css trim + archive 제거**가 더 큼.

**Q4. 타이포 변수 `--card-*` / `--body-size` 예외**  
- FAQ·curriculum 16px 고정은 **별 토큰 `--accordion-title-size: 16px`** 으로 명시하는 편이 “가벼운 코드”(의도가 CSS에 드러남).

**Q5. 한 번에 할 작업 수**  
- 아래 Tier 1만으로도 V4 MVP. Tier 2·3은 상의 후 스프린트 분리 권장.

---

## 5. 리팩토링 후보 리스트 (우선순위)

### Tier 1 — High impact / Low risk (V4 1차 권장)

| ID | 작업 | 기대 효과 | 리스크 | 예상 규모 |
|----|------|-----------|--------|-----------|
| **R1** | `style-lab-v4/` = V3 복사 후 작업 브랜치화 | 안전한 실험 | 없음 | — |
| **R2** | `archive/` 제거 (git에만 보존) | 탐색·혼란 ↓ | 낮음 | ~수백 lines |
| **R3** | Lab-only 스타일·마크업 식별 → `lab/`로 이동 (`color-lab.*`, lab bar, panel, `*-lab` showcase) | `theme.css` **10–15%** 감소 가능 | 중간 (HTML link 순서) | ~300–400 lines CSS |
| **R4** | 공통 카드 유틸 클래스 도입 (예: `.u-card`, `.u-card__title`, `.u-card__body`) + 기존 `.i-block` 등 **점진 위임** | border/shadow/padding 중복 ↓ | 중간 (회귀) | theme.css -200 lines 목표 |
| **R5** | 타이포 토큰 정리: `--card-title-size`, `--card-body-size`, **`--accordion-title-size: 16px`** (FAQ 질문·curriculum Part), `--body-size` | FAQ/Part/카드 H3 혼선 ↓ | 낮음 | 소폭 |
| **R6** | `color-lab.js` → `groups` config 테이블화 (main/cta/bg/stats) | 그룹 추가 1곳 수정 | 낮음 | -300 lines 목표 |

### Tier 2 — Medium impact / Medium risk

| ID | 작업 | 기대 효과 | 리스크 |
|----|------|-----------|--------|
| **R7** | `theme.css` → `tokens.css` + `components/` + `sections/` 분할 | 탐색성 ↑ | import 순서·특이성 충돌 |
| **R8** | `base.css` 축소: theme 전용 규칙 이전 | 이중 정의 ↓ | hero/section 회귀 |
| **R9** | 캐러셀 공통 모듈 (poets, promise dots/autoplay) | JS -20% | motion·3D cases |
| **R10** | `site-nav.js` + stats marquee 설정 객체화 | 가독성 | stats 모바일 |
| **R11** | `preview-dual.html` ↔ Lab 분리 정책 문서화·정리 | dual 유지보수 | iframe 경로 |

### Tier 3 — Optional / Higher risk

| ID | 작업 | 비고 |
|----|------|------|
| **R12** | showcase s1–s5 **미사용 variant** HTML+CSS 제거 | 실제 사용 variant만 남기기 — **사용자 확인 필수** |
| **R13** | HTML 섹션 partial + build concat | devDependency 1개 |
| **R14** | CSS minify + 단일 bundle (배포용) | Lab 제외 빌드 |
| **R15** | `data-theme` 제거 및 단일 테마 CSS | Style Lab “테마 실험” 범위 축소 |

---

## 6. 제안 폴더 구조 (V4)

```
style-lab-v4/
├── index.html              # 프로덕션 랜딩 (Lab script 선택적)
├── preview-dual.html
├── README.md
├── doc/
│   ├── REFACTORING-REVIEW.md
│   ├── UX-기획서.md
│   └── 카피-검토.md
├── assets/
│   ├── images/
│   └── videos/
├── css/
│   ├── tokens.css
│   ├── theme.css           # @import hub
│   ├── components/
│   ├── components/
│   │   ├── card.css
│   │   ├── accordion.css
│   │   └── u-card.css      # 공통 card surface
│   ├── sections/
│   │   ├── _base.css
│   │   ├── _components.css # i-diff quotes (카드는 components/)
│   │   ├── _sections-promise.css
│   │   ├── _sections-cases.css
│   │   ├── _sections-misc.css
│   │   └── _gradient-lab.css
│   ├── base.css
│   ├── site-nav.css
│   └── motion.css
├── lab/
│   ├── init-head.js        # head FOUC·embed·collapse·storage 마이그레이션
│   ├── style-lab-api.js    # StyleLab.onRefresh / refreshMotionChain
│   ├── lab-chrome.css      # lab-bar shell (base.css에서 분리)
│   ├── gradient-effects.css
│   ├── color-lab.css
│   ├── color-lab.js
│   └── lab-shell.js
├── js/
│   └── …
├── scripts/
└── src/
```

**로드 전략 (상의 필요):**

- **A안:** `index.html` = Lab CSS/JS 항상 포함 (현状 유지, 구조만 정리)  
- **B안:** `index.html` = Lab 없음 / `index-lab.html` = Lab 포함 (가장 가벼운 프로덕션)  
- **C안:** 쿼리 `?lab=1`일 때만 dynamic import (JS만 가능, CSS는 link 분기)

---

## 7. Dead code · 중복 의심 체크리스트 (구현 전 grep)

V4 복사 후 아래를 돌려 **삭제 후보 확정**:

```bash
# HTML에 없는 CSS selector (수동 샘플링 + coverage)
rg -o 'class="[^"]+"' index.html | sort -u > /tmp/html-classes.txt
rg -o '\.[a-zA-Z][\w-]*' css/theme.css | sort -u > /tmp/css-classes.txt

# index.html 미참조 JS
for f in js/*.js lab/*.js; do basename "$f"; done
rg 'script src' index.html

# archive 참조
rg 'archive/' .

# lab-only 클래스
rg 'lab|showcase--s[0-9]|i-diff__.*-lab' index.html css/
```

---

## 8. 권장 진행 순서 (상의용)

1. **R1** V3 → V4 복사  
2. **R2** archive 제거 여부 확정  
3. **R5** 타이포 토큰 (`--accordion-title-size`) 정리 — 이미 논의된 FAQ/Part 16px 반영  
4. **R6** color-lab groups 리팩터  
5. **R3 + R4** Lab 분리 + 카드 유틸 (HTML link 같이)  
6. 브라우저 회귀: hero, stats, pillars, promise 3D, cases 3D, FAQ, curriculum, closing/promo, Style Lab 4그룹  
7. Tier 2는 1차 안정 후

---

## 9. 사용자와 상의할 질문

### 확정·방향 (2026-06-02 상의)

1. **Style Lab:** **V4에서 유지.** 리팩터는 Lab 코드 **정리·분리**만 수행. 배포 시 Lab strip은 [PERFORMANCE-CHECKLIST.md](./PERFORMANCE-CHECKLIST.md) 후속 검토.

2. **showcase s1–s5:** V2 Lab 개념. **V3 실사용은 아래 §9.1** — `showcase--s*` CSS·Lab HTML은 **dead code 후보**.

3. **archive/:** §9.2 참고 — V4에서 **삭제 OK** 여부만 추가 확인.

4. **theme.css 분할 vs 유지:** §9.3 (본문 답변과 동일).

5. **빌드 도구:** §9.4 (본문 답변과 동일).

### 9.1 V3 출판 사례 섹션 — 실제 사용 (V2 s1–s5 아님)

| 구분 | V2 (Lab) | V3 (확정 UI) |
|------|----------|--------------|
| HTML | `#i-cases-showcase-lab` + s1~s5 접기/펼치기 | `.cases-card` + 3D 캐러셀 마크업 |
| JS | `authors-showcase-lab.js` | **`cases-3d-carousel.js`** |
| CSS | `.showcase--s1` ~ `.showcase--s5` 전용 (~수백 lines) | **`.section--i-cases .cases-card`** + 공통 `.showcase-card__*` |
| 개념 | 5가지 레이아웃 비교 | **커버플로우(s5) 계열 3D** + promise 3D와 유사 |

**V4 정리 제안:** `showcase--s1~s5`, `i-cases__showcase-lab`, `authors-showcase-lab.js` 참조가 V3 index에 없으면 **CSS/HTML/JS 일괄 삭제** (가장 큰 단일 절감 후보).

### 9.2 archive/ 이란?

V2에서 **랜딩 페이지에서 뺀 섹션의 백업 폴더**입니다.

- **`archive/i-poem-section/`** — 「1주차 끝, 손에 들리는 첫 시」 시 카드 스택 섹션
- 포함: `section.html`, `styles.css`, `poem-stack.js`, `README.md`
- **현재 index.html에서 로드하지 않음** — git에만 두거나 V4에서 폴더 삭제해도 페이지 동작에 영향 없음

### 9.3 theme.css **분할** vs **단일 유지**

| | **단일 유지** (`theme.css` 하나) | **분할** (`tokens` + `components` + `sections`) |
|--|----------------------------------|--------------------------------------------------|
| 찾기 | 한 파일 grep — 단순 | 파일별로 나뉨 — 섹션 수정 시 해당 파일만 |
| 충돌 | 없음 | `@import` 순서·특이성 주의 |
| **총 라인** | 적어 보임 | import 헤더로 **늘 수 있음** |
| 협업 | diff가 한 파일에 몰림 | PR 단위 나누기 쉬움 |
| **로드 크기** | 동일 (정적 HTML, link 여러 개) | 동일 |

**요약:** 분할은 **파일 크기 축소가 아니라 유지보수 구조** 선택. “가볍게” 목표만 보면 **dead code 삭제가 먼저**, 분할은 Tier 2.

### 9.4 빌드 도구 도입 시 **바뀌는 것**

**지금 (순수 정적):** `index.html` 하나에 800줄+ — 브라우저가 파일 그대로 연다.

**빌드 도입 후 (예: 11ty, vite, `npm run build:html`):**

| 항목 | 변경 |
|------|------|
| **개발** | `sections/hero.html` 등 조각 편집 → 빌드가 `index.html` **생성** |
| **배포** | `dist/` 폴더만 올림 (선택: CSS minify, Lab strip) |
| **필수 도구** | Node + `npm install` / `npm run build` |
| **장점** | HTML 중복↓, Lab 제외 빌드, partial 재사용 |
| **단점** | 워크플로 한 단계 추가, HTML 더블클릭 미리보기는 **빌드 결과** 기준 |

**안 바뀌는 것:** 브라우저에서 보이는 **최종 DOM/CSS** — 빌드 없이도 동일하게 만들 수 있음. 도구는 **작업 방식**만 바꿈.

### 9.5 미결정

- [ ] archive/ V4에서 삭제 OK?
- [ ] Tier 1만 vs Tier 1+2?
- [ ] HTML partial 빌드 도입 여부 (당장은 **순수 정적 유지**로 가정 가능)

---

## 10. 요약

| 목표 | 핵심 액션 |
|------|-----------|
| CSS 가볍게 | Lab/showcase dead variant 제거 + 카드 패턴 통합 + theme 분할 |
| JS 가볍게 | color-lab groups화 + (선택) carousel core |
| HTML 가볍게 | Lab 분리 또는 partial build |
| 혼란 ↓ | archive 제거, 타이포·accordion 토큰 명시 |
| 안전 | V4 복사본에서 Tier 1 → 회귀 → Tier 2 |

**다음 단계:** 위 §9 질문에 답 주시면, 확정된 범위로 V4 리팩토링 implementation plan(체크리스트·파일별 diff 예상)을 이 문서에 추가하겠습니다.

---

## 부록 A. CSS 중복 패턴 (구체 예)

### A.1 “카드 박스” 반복 속성

다음 selector들이 유사한 **padding / border / radius / shadow** 를 각각 선언:

- `.i-block`, `.i-diff__row`, `.promise-card`, `.pillar`, `.i-curriculum__part`
- `.i-faq__item`, `.i-info`, `.showcase--s1 .showcase-card--featured`, `.cases-card`

**V4 제안:** `.u-card` + modifier로 1차 통합.

### A.2 `html[data-theme="i-mylight"]` 접두사

theme.css 대부분 rule이 이 접두사 → selector 문자열 반복. i-mylight만 유지할 경우 Tier 3에서 접두사 제거 검토.

### A.3 base ↔ theme 타이포 이중 정의

| 요소 | base.css | theme.css |
|------|----------|-----------|
| `.hero__title` | clamp 42–68 | color 등 override |
| `.section__title` | clamp 28–40 | `.hl` color |
| `.pillar__title` / `.pillar__text` | line-height | font-size, weight, layout |

**V4:** 타이포는 `tokens.css` 단일 소스.

### A.4 섹션별 card border-color 미세 조정

FAQ 섹션 근처에서 섹션마다 `border-color`만 다른 override 다수 → `--card-border-tint-*` 토큰화 후보.

---

## 부록 B. JS 중복·특수 케이스

| 스크립트 | 공통 패턴 | 공통화 제외 |
|----------|-----------|-------------|
| `poets-carousel.js` | fade, dots, autoplay, arrows | — |
| promise 3D | dots, viewport | 3D transform |
| `cases-3d-carousel.js` | drag, dots | blur, 3D |
| `site-nav.js` stats | marquee, clone | awards 정렬 |
| `total-price-animate.js` | in-view trigger | 가격 easing |

---

## 부록 C. 타이포 예외 (V3 현재)

| 요소 | 크기 | 비고 |
|------|------|------|
| `--body-size` | 17px → 데스크탑 16px | 페이지 기본 |
| `--card-title-size` | clamp → 데스크탑 20px | 카드 H3 |
| `--card-body-size` | 14px → 데스크탑 16px | 카드 본문 |
| `.i-faq__item summary` | **16px 고정** | card-title 미사용 |
| `.i-curriculum__part-head` | **16px 고정** | 동上 |

→ V4 **R5:** `--accordion-title-size: 16px` 로 명시.

---

## 부록 D. V4 착수 1일차 체크리스트

- [ ] `cp -R style-lab-v3/* style-lab-v4/` (본 MD 유지)
- [ ] `wc -l` 로 §1 표 갱신
- [ ] `rg 'archive/' style-lab-v4` → 참조 0 확인
- [ ] `rg 'showcase--s' index.html` → 실사용 variant 목록
- [ ] Tier 1 범위 확정 (§9)
- [ ] 회귀: index, preview-dual, `?motion=off`, Style Lab 4그룹

