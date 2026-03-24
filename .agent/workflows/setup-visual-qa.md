---
description: [Figma -> Storybook 오버레이 Visual QA 세팅]
---

이 워크플로우는 React/Vite 환경에서 Figma 시안과 실제 컴포넌트를 Storybook 상에서 반투명 오버레이로 겹쳐보며 QA할 수 있는 인프라를 자동 세팅합니다.

### 1단계: Storybook 및 필수 애드온 설치
Storybook을 초기화하고, 시각 검수에 최적화된 애드온들을 설치합니다.

// turbo
```bash
npx storybook@latest init -y
npm install -D @storybook/addon-designs @storybook/addon-a11y dotenv
```

### 2단계: Multi-Component Figma Baseline 스크립트
1. 루트에 `figma.config.json` 파일을 생성하여 컴포넌트별 Figma URL을 관리합니다.
2. `scripts/figma-baseline.ts` 파일을 생성하여 해당 JSON을 읽고 이미지를 `output/` 폴더에 일괄 다운로드하는 로직을 작성합니다.
3. `package.json`의 scripts에 다음을 추가합니다:
   ```json
   "figma-baseline": "npx tsx scripts/figma-baseline.ts",
   "build-storybook": "mkdir -p output && storybook build"
   ```

### 3단계: 오버레이 데코레이터 주입 (`withOverlay.tsx`)
`.storybook/withOverlay.tsx` 컴포넌트를 생성합니다. 
- **기능**: 투명도 슬라이더, 디자인-코드 토글 기능을 포함합니다.
- **UI 배치**: UI를 가리지 않도록 컴포넌트 우측 상단 바깥에 패널을 배치합니다 (`position: absolute`, `translateX(100%)`).

### 4단계: Storybook 설정 업데이트
1. `.storybook/main.ts`:
   - `staticDirs: ["../output"]` 설정 추가 (이미지 서빙용)
   - `addons` 배열에 `@storybook/addon-designs` 추가
2. `.storybook/preview.ts`:
   - `decorators: [withOverlay]` 등록
   - `import '../src/index.css';` 등 전역 스타일 임포트

### 5단계: 배포 환경 구성 (Vercel)
루트에 `vercel.json`을 생성하여 스토리북 단독 배포 설정을 추가합니다.
```json
{
  "buildCommand": "npm run build-storybook",
  "outputDirectory": "storybook-static"
}
```

### 6단계: 사용법
컴포넌트 스토리 파일(`*.stories.tsx`)에 아래 파라미터를 추가하여 오버레이를 활성화합니다.
```ts
export const Default = {
  tags: ['autodocs'],
  parameters: {
    overlay: { url: '/ComponentName.png' }
  }
};
```
