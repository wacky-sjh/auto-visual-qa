---
description: [Figma -> Storybook 오버레이 Visual QA 세팅]
---

이 워크플로우는 React/Vite 환경에서 디자이너의 Figma 원본과 프론트엔드 개발자의 실제 컴포넌트를 Storybook에서 반투명 오버레이로 겹쳐보며 육안 검증(QA)할 수 있는 인프라를 автомати화하여 세팅합니다.

### 1단계: Storybook 및 애드온 설치
Storybook을 초기화하고, 디자인 연동에 필요한 패키지(`@storybook/addon-designs`, `dotenv`)를 설치합니다.

// turbo
```bash
npx storybook@latest init -y
npm install -D @storybook/addon-designs dotenv
```

### 2단계: Figma API 스크립트 세팅
`.env` 파일에서 Figma URL과 토큰을 읽어 `output/baseline.png`로 저장해주는 스크립트를 만듭니다.
`scripts/figma-baseline.ts` 파일을 생성하고 작성합니다: (자세한 코드는 참조 레포의 figma-baseline.ts 사용)

`package.json`의 scripts에 다음을 추가합니다:
```json
"figma-baseline": "npx tsx scripts/figma-baseline.ts"
```

### 3단계: 오버레이 데코레이터 컴포넌트 추가
스토리북 화면 위에 기준 이미지를 올리고 투명도를 조절할 수 있는 컴포넌트(`.storybook/withOverlay.tsx`)를 생성합니다. (슬라이더 및 "구현 화면", "Figma 원본" 레이블 포함)

### 4단계: Storybook Config 수정
1. `.storybook/main.ts`에 다음과 같이 추가합니다.
   - `staticDirs: ["../output"]`
   - `addons` 배열에 `"@storybook/addon-designs"` 추가
2. `.storybook/preview.ts`에 전역 CSS와 데코레이터를 등록합니다.
```ts
import '../src/index.css'; // 혹은 전역 CSS 경로
import { withOverlay } from './withOverlay';

export default {
  decorators: [withOverlay]
};
```

### 5단계: 스토리에 파라미터 연동하기
새로운 컴포넌트의 `.stories.tsx` 파일에 아래와 같이 파라미터를 추가하여 오버레이 연동을 완료합니다.
```ts
export const Default = {
  parameters: {
    overlay: { url: '/baseline.png' }
  }
};
```
