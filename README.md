# Auto Visual QA

Figma 디자인과 구현 코드 결과물을 **픽셀 단위로 비교**해 시각적 차이를 확인하는 파이프라인입니다.

- **스택**: Vite, React, TypeScript, Tailwind CSS / Playwright, Pixelmatch, Figma API
- **준비물**: Figma 디자인(노드 URL), Cursor + Figma MCP(코드 생성 시)

**팀 보고 요약** → [docs/REPORT.md](docs/REPORT.md)  
**플로우·사용법** → [docs/WORKFLOW.md](docs/WORKFLOW.md)

---

## 빠른 실행

```bash
npm install
npx playwright install chromium
```

```bash
# 터미널 1
npm run dev

# 터미널 2 (서버 실행 후)
npm run figma-baseline   # .env 에 FIGMA_ACCESS_TOKEN, FIGMA_URL 설정 필요
npm run screenshot       # 또는 npm run screenshot:component -- "[data-qa=basic-card]"
npm run visual-diff
```

`output/report.html` 을 브라우저로 열어 차이 확인.

---

## 스크립트

| 명령                                              | 설명                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                                     | Vite 개발 서버 (5173)                                            |
| `npm run figma-baseline`                          | Figma 노드 이미지 → output/baseline.png (.env 필요)              |
| `npm run screenshot`                              | 구현 화면 스크린샷 → output/implementation.png (기본 1920×1080)  |
| `npm run screenshot:component -- "[data-qa=xxx]"` | 해당 요소만 스크린샷 (단일 컴포넌트 검증용)                      |
| `npm run visual-diff`                             | baseline vs implementation 비교 → output/diff\*.png, report.html |

---

## 환경 변수

- **Figma baseline**: `FIGMA_ACCESS_TOKEN`, `FIGMA_URL` (또는 `FIGMA_FILE_KEY`, `FIGMA_NODE_ID`) — `.env` 에 설정
- **스크린샷**: `PREVIEW_URL`, `SCREENSHOT_VIEWPORT`, `SCREENSHOT_SELECTOR`, `SCREENSHOT_MODE`

---

## 디렉터리

```
auto-visual-qa/
├── docs/
│   ├── REPORT.md    # 팀 보고 요약
│   └── WORKFLOW.md  # 플로우·검증 방식·실행 순서
├── scripts/         # figma-baseline, screenshot, visual-diff
├── src/             # Vite + React 앱
└── output/         # 스크린샷·diff·report (git 제외)
```
