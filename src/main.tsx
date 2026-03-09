/* 전역 스타일·Tailwind 테마를 앱 전체(BasicCard 포함)에 적용하기 위해 진입점에서 가장 먼저 로드 */
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
