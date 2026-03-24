# Auto Visual QA (Storybook Overlay)

Figma 디자인과 구현 코드 결과물을 **Storybook 오버레이** 기능을 통해 직관적으로 비교하여 시각적 차이를 확인하는 파이브라인입니다.

- **스택**: Vite, React, TypeScript, Tailwind CSS / Storybook, Figma API
- **준비물**: Figma 디자인(노드 URL), Cursor + Figma API Token

---

## 빠른 실행

```bash
npm install
```

```bash
# 터미널 1: 개발 서버
npm run dev

# 터미널 2: 스토리북 실행
npm run storybook

# 터미널 3: Figma 시안 다운로드 (최초 1회 또는 디자인 변경 시)
# figma.config.json 에 구성된 모든 노드를 가져옵니다.
npm run figma-baseline
```

---

## 🔍 Visual QA 방법 (오버레이)

1. `npm run storybook`으로 스토리북을 실행합니다.
2. 검수할 컴포넌트(예: `BasicCard`) 스토리를 선택합니다.
3. 우측 하단의 **Figma Overlay (QA)** 패널에서 체크박스를 켭니다.
4. **투명도 슬라이더**를 조절하며 구현 화면과 Figma 원본 시안을 겹쳐보며 차이를 확인합니다.

---

## 스크립트

| 명령                     | 설명                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| `npm run dev`            | Vite 개발 서버 (5173)                                                |
| `npm run storybook`      | Storybook 개발 서버 (6006) - **메인 QA 도구**                        |
| `npm run figma-baseline` | `figma.config.json`의 원본 이미지들을 `output/` 폴더에 다운로드     |
| `npm run build-storybook`| Vercel 등 배포를 위한 스토리북 정적 빌드                             |

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
