# Auto Visual QA — 플로우 & 사용법 (Storybook Overlay)

## 전체 플로우

```
[Designer] → Figma Design (Auto Layout, 시맨틱 네이밍)
    ↓
[Figma URL 구성] → `figma.config.json`에 컴포넌트명과 피그마 링크 추가
    ↓
[Baseline 다운로드] → `npm run figma-baseline` 실행하여 output/ 폴더에 시안 저장
    ↓
[개발자 구현] → Storybook 스토리에 `overlay: { url: '/컴포넌트명.png' }` 파라미터 등록
    ↓
[Visual QA] → Storybook UI에서 "Figma Overlay (QA)" 활성화 후 투명도 조절하며 육안 검증
    ↓
[협업/배포] → Vercel 전용 URL을 디자이너와 공유하여 실시간 피드백 및 수정
```

---

## 🛠️ 주요 설정 및 도구

### 1. Figma Baseline 관리 (`figma.config.json`)
여러 컴포넌트의 디자인 시안을 한 번에 관리합니다.
- 파일 위치: 프로젝트 루트 전역 `figma.config.json`
- 형식:
  ```json
  {
    "BasicCard": "https://www.figma.com/design/...",
    "SNSCard": "https://www.figma.com/design/..."
  }
  ```
- 실행: `npm run figma-baseline` 실행 시 `output/BasicCard.png`, `output/SNSCard.png` 등이 생성됩니다.

### 2. Storybook 오버레이 기능
컴포넌트 위에 시안 이미지를 반투명하게 겹쳐서 비교합니다.
- **활성화**: 스토리북 우측 상단(Docs) 또는 우측 하단(Canvas)의 **Figma Overlay (QA)** 패널 체크박스 클릭.
- **투명도 조절**: 슬라이더를 통해 '구현 코드'와 'Figma 원본' 사이의 비중을 조절 (0% = 코드만, 100% = 디자인만).
- **위치 조절**: 패널은 UI를 가리지 않도록 항상 컴포넌트 우측 상단 바깥에 배치됩니다.

---

## 🚀 실행 순서

| 단계 | 작업 내용 | 명령어 |
| --- | --- | --- |
| 1 | 환경변수 설정 | `.env`에 `FIGMA_ACCESS_TOKEN` 설정 |
| 2 | 디자인 구성 | `figma.config.json`에 가져올 디자인 링크 추가 |
| 3 | 시안 동기화 | `npm run figma-baseline` (이미지 파일 생성 및 Git 커밋 권장) |
| 4 | 개발 및 확인 | `npm run storybook` 실행 후 오버레이 기능을 켜고 구현 |
| 5 | 배포 및 공유 | GitHub Push 후 Vercel 자동 배포 URL을 팀에 공유 |

---

## 💡 협업 팁

- **Pixel Perfect 검수**: 투명도를 50%로 두었을 때 텍스트가 겹쳐서 '잔상'이 보이지 않는다면 1px 단위까지 일치하는 상태입니다.
- **이미지 최신화**: 디자이너가 피그마 시안을 수정했다면 다시 `npm run figma-baseline`을 실행해 로컬 이미지만 갈아 끼우면 즉시 QA 환경이 업데이트됩니다.
- **배포 주소 활용**: Vercel에 배포된 스토리북 주소는 디자이너가 직접 접속하여 오버레이를 껐다 켰다 하며 검토하기에 최적입니다.
