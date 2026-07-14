# 성능 최적화 체크리스트

> dead code·JS 중복 정리 완료 후 검토용. Style Lab 유지 전제.

## 1. 로드 크기 (정적 자산)

| 항목 | 현재 | 검토 |
|------|------|------|
| CSS link 수 | tokens + theme hub + base + site-nav + motion + lab + components | Lab 제외 빌드 타깃 여부 (후속) |
| JS script 수 | motion-utils + lab 2 + 페이지 11 | defer/async 통일 검토 |
| Pretendard CDN | variable 전체 | subset / self-host / `font-display: swap` 확인 |
| 이미지 | `assets/images/` | WebP/AVIF, `width`/`height`, lazy (`loading="lazy"`) |
| 영상 | hero, stakes, vibe 등 | `preload`, poster, 모바일 소스 분기 |

## 2. 런타임 (스크롤·애니메이션)

| 항목 | 파일 | 메모 |
|------|------|------|
| Scroll reveal | `motion.js` | `IntersectionObserver` 1개 — OK |
| Stats marquee | `site-nav.js` | clone·drag — 모바일 프로파일링 |
| 3D 캐러셀 | `cases-3d-carousel.js` | blur/filter — GPU 부하 |
| Bookstore loop | `bookstore-carousel.js` | `requestAnimationFrame` 루프 |
| Hero video | `hero-video.js`, `vibe-header-video.js` | 동시 재생·디코딩 |
| Price counter | `total-price-animate.js` | in-view 1회 — OK |

## 3. Style Lab 오버헤드

- `color-lab.js` (~1k lines): 프로덕션에서도 항상 로드 — **embed=1** 또는 빌드 플래그로 strip 검토 (Lab UI 유지 vs 배포 분리)
- localStorage read/write: 초기 1회 — 무시 가능
- refresh 훅: `__styleLabV2RefreshMotion` 등 — Lab 토글 시만 실행

## 4. CSS

- `motion.css`: `prefers-reduced-motion` 미디어 쿼리 — OK
- dead selector 제거 후 **Coverage** 한 번 더 (DevTools → Coverage)
- `_gradient-lab.css`: Lab 그라디언트 모드 전용 — 유지

## 5. HTML / 네트워크

- `preview-dual.html`: iframe 2개 → 로컬 개발 전용
- 외부 CDN (Pretendard, 이미지 URL) — SRI·fallback
- Critical CSS 인라인: 미적용 (정적 단일 페이지 — 우선순위 낮음)

## 6. 권장 측정 순서

1. Lighthouse (Mobile, Slow 4G) — `index.html`, `?motion=on`
2. Performance panel — 스크롤 + stats + cases 3D 구간
3. Network — 캐시 없음 기준 total weight
4. `?motion=off` / `prefers-reduced-motion` 회귀

## 7. 빠른 wins (낮은 리스크)

- [x] below-fold 영상 `preload="none"` (vibe, stakes)
- [x] script `defer` 통일 (순서: motion-utils → lab → page)
- [x] bookstore rAF — viewport 밖이면 loop pause
- [ ] 히어로·stakes poster 이미지 압축
- [ ] DevTools Coverage로 잔여 dead CSS 샘플링

## 8. 중기 (상의 후)

- [ ] Lab 포함 / 미포함 HTML 이중 빌드
- [ ] CSS minify + 단일 bundle (배포용)
- [ ] 캐러셀 공통 모듈 (JS 크기·동작 통일)
