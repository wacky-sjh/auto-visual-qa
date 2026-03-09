# Auto Visual QA — 팀 보고 요약

## 목적

**Figma 디자인**과 **AI/개발자가 구현한 코드 결과물**을 픽셀 단위로 비교해, 시각적 차이를 리포트로 확인하는 파이프라인입니다.

---

## 핵심 플로우

1. **Baseline**: Figma 디자인의 레이어/프레임 링크로 Figma API를 호출해 해당 프레임 이미지를 저장한다.
2. **구현물 캡처**: 코드로 구현한 뒤 Playwright로 화면 스크린샷을 저장한다.
3. **정규화**: Sharp로 두 이미지를 같은 크기로 리사이징하고, 해상도·인코딩 등을 동일한 픽셀 포맷(RGBA)으로 맞춘다.
4. **픽셀 비교**: Pixelmatch로 같은 (x, y) 위치 픽셀끼리 색 차이를 계산하고, threshold보다 크면 “다른 픽셀”로 판단해 차이 영역을 표시한다.
5. **결과 저장**: pngjs로 diff 픽셀 데이터를 PNG(diff.png)로 저장하고, report.html을 생성한다.

---

## 검증 단위 (두 가지)

| 구분              | Baseline                                  | Implementation                       | 용도                       |
| ----------------- | ----------------------------------------- | ------------------------------------ | -------------------------- |
| **단일 컴포넌트** | Figma에서 해당 노드만 export              | 해당 요소만 스크린샷 (selector 지정) | 카드, 버튼, Input, 모달 등 |
| **전체 화면**     | 페이지 프레임 전체 export (예: 1920×1080) | 동일 뷰포트로 전체 페이지 스크린샷   | 완성된 페이지 레이아웃     |

---

## 구현된 기능

- **Figma baseline 자동 저장**: `.env`에 토큰 + Figma 노드 URL → `npm run figma-baseline` → `output/baseline.png`
- **구현물 스크린샷**: 전체 화면(1920×1080) 또는 **특정 컴포넌트만** selector로 캡처
- **비주얼 diff**: baseline vs implementation 픽셀 비교. **비교 전 두 이미지를 Sharp로 동일 크기·RGBA 정규화** 후 Pixelmatch로 diff. 크기 다르면 자동 리사이즈 후 비교.
- **리포트**: `output/report.html` — **원본 (Figma)**, **구현 (코드)**, **Diff (차이 마스크)** 3개로 차이 위치 확인.
- **신뢰성 보강**: [FigDiff](https://github.com/FigDiff/figdiff-server) 참고 — 이미지 정규화, `VISUAL_DIFF_THRESHOLD` 환경변수로 허용 오차 조절(기본 `0.25`). 상세는 `docs/WORKFLOW.md`의 "리포트 신뢰성 개선" 참고.

---

## 스택

- 프론트: Vite, React, TypeScript, Tailwind CSS
- 비주얼 QA: Playwright(스크린샷), Pixelmatch(diff), Sharp(리사이즈·이미지 정규화)
- 연동: Figma REST API, Cursor Figma MCP(코드 생성 시 활용)

---

## 실행 순서 (요약)

1. `npm run figma-baseline` — 기준 이미지 저장 (최초 1회 또는 디자인 변경 시)
2. `npm run dev` — 로컬 서버
3. `npm run screenshot` 또는 `npm run screenshot:component -- "[data-qa=컴포넌트명]"` — 구현 스크린샷
4. `npm run visual-diff` — diff 생성 및 `output/report.html` 생성
5. report.html 브라우저로 열어 차이 확인 후 수정 반복

상세 사용법은 `README.md`, `docs/WORKFLOW.md` 참고.

---

## 정확도와 한계

- **픽셀 단위 비교**: Pixelmatch가 픽셀마다 색을 비교하므로, **2px 차이(border-radius 8px vs 6px 같은)도 곡선 부위 픽셀이 달라지면 감지됩니다.** “이 영역이 다르다”는 걸 찾는 데는 충분히 정확합니다.
- **차이 “값”은 안 나옴**: diff는 “어디가 다른지(픽셀 위치)”만 보여줍니다. “8px vs 6px이다” 같은 수치는 알 수 없고, 리포트 보고 코드/피그마에서 직접 확인해야 합니다.
- **영향 요인**
  - 구현 이미지를 baseline 크기로 **리사이즈**하면, 확대/축소 보간 때문에 가장자리가 살짝 흐려질 수 있어, 아주 미세한 디테일은 완벽하지 않을 수 있음.
  - Figma 렌더링과 브라우저(CSS) 렌더링이 달라서, 같은 수치여도 픽셀이 1~2개 다르게 나올 수 있음(노이즈).
  - **threshold** 로 미세한 색 차이를 무시해 렌더링 노이즈를 줄임. 기본값 **0.25** 이며, `VISUAL_DIFF_THRESHOLD` 환경변수로 조절 가능(예: `VISUAL_DIFF_THRESHOLD=0.3 npm run visual-diff`). 값을 올리면 오탐은 줄고 실제 차이를 놓칠 수 있고, 낮추면 더 예민해지나 오탐이 늘어날 수 있음.
  - 비교 전 **baseline·implementation을 Sharp로 동일 파이프라인 정규화**해 포맷/채널을 맞춰, 색상·인코딩 차이로 인한 오탐을 줄임.
- **요약**: “디테일한 차이가 있는지, 어디 부위인지”를 찾는 용도로는 유효하고, 2px 수준 차이도 보통 감지됩니다. “정확히 몇 px 차이인지”까지 자동으로 알려주지는 않습니다.
