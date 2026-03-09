# Auto Visual QA — 플로우 & 사용법

## 전체 플로우

```
[Designer] → Figma Design (Auto Layout, 시맨틱 네이밍)
    ↓
[Figma 노드 URL + MCP] → AI 코드 생성 (Cursor)
    ↓
[Local Render] → Playwright 스크린샷 → implementation.png
    ↓
[Pixelmatch] → baseline vs implementation 비교 → diff + report.html
    ↓
[피드백] → 수정 후 반복
```

---

## 검증 방식 (단일 컴포넌트 / 전체 화면)

| 방식              | Baseline                       | Implementation   | 명령 예시                                                |
| ----------------- | ------------------------------ | ---------------- | -------------------------------------------------------- |
| **단일 컴포넌트** | Figma 해당 노드만 export       | 요소만 캡처      | `npm run screenshot:component -- "[data-qa=basic-card]"` |
| **전체 화면**     | 페이지 프레임 전체 (1920×1080) | 동일 뷰포트 전체 | `npm run screenshot`                                     |

단일 컴포넌트일 때는 반드시 selector로 **해당 요소만** 찍어야 baseline(노드만 export)과 올바르게 비교됨.  
크기는 다르면 visual-diff에서 **자동 리사이즈** 후 비교.

---

## 실행 순서

| #   | 단계           | 명령                                                                                 |
| --- | -------------- | ------------------------------------------------------------------------------------ |
| 1   | Figma baseline | `.env`에 `FIGMA_ACCESS_TOKEN`, `FIGMA_URL` 설정 후 `npm run figma-baseline`          |
| 2   | 로컬 렌더      | `npm run dev`                                                                        |
| 3   | 구현 스크린샷  | 단일: `npm run screenshot:component -- "[data-qa=xxx]"` / 전체: `npm run screenshot` |
| 4   | 비주얼 diff    | `npm run visual-diff`                                                                |
| 5   | 확인           | `output/report.html` 브라우저로 열기                                                 |

---

## Figma baseline 가져오기

- **권장**: Figma Personal Access Token 발급 후 `.env`에 `FIGMA_ACCESS_TOKEN`, `FIGMA_URL`(Copy link to selection URL) 설정 → `npm run figma-baseline` → `output/baseline.png` 자동 저장.
- **수동**: Figma에서 해당 레이어 Export → PNG를 `output/baseline.png`로 저장.

---

## 리포트

`npm run visual-diff` 후 생성되는 `output/report.html`:

- **원본 (Figma)** / **구현 (코드)** / **Diff (차이 마스크)** 3개 이미지로 표시 (diff = 빨간색 = 픽셀 차이).

브라우저에서 `output/report.html` 파일을 열면 됨.

---

## 리포트 신뢰성 개선 (FigDiff 참고)

[FigDiff/figdiff-server](https://github.com/FigDiff/figdiff-server)는 Figma vs 웹을 **이미지 픽셀 비교**로 검증하며, 아래 방식을 참고해 우리 파이프라인을 보강했다.

| FigDiff 방식 | 우리 적용 |
| ------------- | --------- |
| **이미지 특성 통일** (Figma sRGB vs 스크린샷 색상 프로파일 차이) | 비교 전 baseline/implementation을 **Sharp로 동일 크기·RGBA로 정규화** (`normalizeToRawRgba`) |
| **허용 오차(threshold)** 로 미세 차이 무시 | `VISUAL_DIFF_THRESHOLD` 환경변수 (기본 `0.25`)로 조절 가능 |
| **블록 단위 비교** (5×5 평균으로 화질/렌더링 차이 완화) | 현재는 픽셀 단위(pixelmatch) 유지. 필요 시 전처리(블러 등)로 확장 가능 |
| **뷰포트 일치** | baseline 크기로 implementation 리사이즈 후 비교 (기존 동작 유지) |

**환경변수**

- `VISUAL_DIFF_THRESHOLD`: 픽셀 차이 허용 (0~1, 기본 `0.25`). 올리면 폰트/안티앨리어싱 오탐이 줄고, 너무 높으면 실제 차이를 놓칠 수 있음. **border-radius·레이아웃 등 미세 차이**를 잡으려면 값을 낮추면 됨 (예: `VISUAL_DIFF_THRESHOLD=0.1`).
