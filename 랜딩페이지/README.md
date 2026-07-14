# 다시, 봄 — 프로덕션 랜딩 페이지

`style-lab-v4`에서 **Style Lab UI를 제거**하고, 확정된 컬러·콘텐츠만 남긴 배포용 버전입니다.

## 고정 컬러 (Style Lab 최종 선택)

| 그룹 | 값 |
|------|-----|
| 메인 (warm) | `#E55710` |
| CTA (accent) | `#FF3355` |
| 배경 밴드 | 하늘 `#EAF1FF` · 노랑 `#FFF8E1` · 분홍 `#FFEDF2` |
| Stats 배경 | `#322B24` |

`css/tokens.css`, `css/site-nav.css`에 하드코딩되어 있습니다.

## 빌드

```bash
npm run build    # src/partials → index.html
npm run check    # 동기화 검증
```

## 프리뷰

- `index.html` — 메인 랜딩
- `preview-dual.html` — 모바일/데스크탑 듀얼 프리뷰
- `?motion=off` — 모션 비활성

## style-lab-v4와 차이

- `lab/` 폴더 없음 (color-lab, lab-bar, init-head 등)
- 상단 Lab 바 없음 → 네비가 화면 최상단에 고정
- 컬러 패널·localStorage 실험 UI 없음

원본 실험은 `../style-lab-v4/`에서 계속 사용할 수 있습니다.
