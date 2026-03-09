/**
 * Playwright로 로컬 프리뷰 페이지 스크린샷 캡처
 *
 * 환경변수:
 *   PREVIEW_URL          - 촬영할 URL (기본: http://localhost:5173)
 *   SCREENSHOT_MODE      - "component" | "full" (기본: full)
 *   SCREENSHOT_VIEWPORT  - "width,height" (기본 full: 1920,1080 / component: baseline과 동일)
 *   SCREENSHOT_SELECTOR  - 지정 시 해당 요소만 캡처 (환경변수 또는 인자로 전달)
 *     예: SCREENSHOT_SELECTOR="[data-qa=basic-card]" npm run screenshot
 *
 * 간편 명령
 *   npm run screenshot:card              → BasicCard만 캡처 (component 모드 + [data-qa=basic-card])
 *   npm run screenshot:component        → 인자 없으면 기본으로 [data-qa=basic-card] 캡처
 *   npm run screenshot:component -- "[data-qa=login-form]"  → 다른 셀렉터 지정
 *
 *   BASELINE_PATH        - component 모드에서 뷰포트 크기 읽을 기준 이미지 (기본: output/baseline.png)
 *
 * 단일 컴포넌트 검증
 *   - 픽셀 정확: SCREENSHOT_MODE=component (baseline과 동일 뷰포트)
 *   - 편의: SCREENSHOT_SELECTOR 만 지정 (요소만 캡처 → visual-diff에서 리사이즈 후 비교)
 * 전체 화면 검증: 기본 1920×1080, SCREENSHOT_VIEWPORT 로 변경 가능
 *
 * 요소 캡처 품질 (selector 사용 시)
 *   - deviceScaleFactor 2로 고해상도 촬영 후 baseline 크기로 리사이즈해 테두리/폰트 선명도 향상
 *   - 폰트 로딩 대기(document.fonts.ready) 후 200ms 추가 대기
 *   - body overflow hidden으로 스크롤바 제외, display 보정 후 150ms 대기로 레이아웃 안정화
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'output');
const SCREENSHOT_PATH = path.join(OUT_DIR, 'implementation.png');
const BASE_URL = process.env.PREVIEW_URL ?? 'http://localhost:5173';
const BASELINE_PATH =
  process.env.BASELINE_PATH ?? path.join(OUT_DIR, 'baseline.png');
/** tailwind pc: 700px — 이보다 작으면 BasicCard 데스크톱이 hidden이라 컴포넌트 모드에서 항상 이 이상으로 */
const MIN_VIEWPORT_WIDTH_COMPONENT = 701;

async function getViewportSize(): Promise<{ width: number; height: number }> {
  const mode = process.env.SCREENSHOT_MODE ?? 'full';
  const explicit = process.env.SCREENSHOT_VIEWPORT;

  if (explicit) {
    const [w, h] = explicit.split(',').map((s) => parseInt(s.trim(), 10));
    if (!Number.isNaN(w) && !Number.isNaN(h)) return { width: w, height: h };
  }

  if (mode === 'component' && existsSync(BASELINE_PATH)) {
    const buf = readFileSync(BASELINE_PATH);
    const meta = await sharp(buf).metadata();
    if (meta.width != null && meta.height != null) {
      const w = Math.max(meta.width, MIN_VIEWPORT_WIDTH_COMPONENT);
      return { width: w, height: meta.height };
    }
  }

  return { width: 1920, height: 1080 };
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // selector: 환경변수 > 인자 > (component 모드일 때 기본값 [data-qa=basic-card])
  const defaultSelector =
    process.env.SCREENSHOT_MODE === 'component'
      ? '[data-qa=basic-card]'
      : undefined;
  const selector =
    (process.env.SCREENSHOT_SELECTOR ??
      process.argv[2]?.trim() ??
      defaultSelector) ||
    undefined;

  const viewport = await getViewportSize();

  const browser = await chromium.launch();
  // 요소 캡처 시: 고해상도(2x)로 찍어서 테두리/안티앨리어싱이 말끔하게 나오도록 함 (deviceScaleFactor는 컨텍스트 생성 시에만 지정 가능)
  const deviceScaleFactor = selector ? 2 : 1;
  const viewportForCapture = selector
    ? { width: 1280, height: 800 }
    : viewport;
  const context = await browser.newContext({
    viewport: viewportForCapture,
    deviceScaleFactor,
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(30_000);
  await page.goto(BASE_URL, { waitUntil: 'load' });
  // 폰트·이미지 등 로딩 안정화 (networkidle은 느리므로 짧은 대기)
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => document.fonts?.ready);
  await new Promise((r) => setTimeout(r, 200));

  if (selector) {
    // 스크롤바가 캡처에 들어가지 않도록 body overflow 숨김
    await page.evaluate(() => {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    });
    const locator = page.locator(selector).first();
    await locator.waitFor({ state: 'attached', timeout: 15_000 });
    // hidden pc:block 등 반응형으로 숨겨진 요소를 강제로 보이게 해서 캡처 (뷰포트 이슈 회피)
    await locator.evaluate((el) => {
      el.classList.remove('hidden');
      (el as HTMLElement).style.setProperty('display', 'block');
    });
    // 캡처 시에만: 개발 서버에서는 안 보이는데 스크린샷에서만 보이는 border/outline 제거 (visual diff 오탐 감소)
    await locator.evaluate((root) => {
      const el = root as HTMLElement;
      el.style.outline = 'none';
      el.style.border = 'none';
      const card = el.querySelector('[class*="rounded-[20px]"]') ?? el.firstElementChild;
      if (card instanceof HTMLElement) {
        card.style.outline = 'none';
        card.style.setProperty('border', 'none', 'important');
      }
      el.querySelectorAll('*').forEach((n) => ((n as HTMLElement).style.outline = 'none'));
    });
    // 레이아웃 안정화 후 캡처 (테두리/그림자 등이 잘리지 않도록)
    await new Promise((r) => setTimeout(r, 150));
    await locator.screenshot({
      path: SCREENSHOT_PATH,
      timeout: 10_000,
      type: 'png',
    });
  } else {
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
  }

  await context.close();
  await browser.close();

  // 요소 캡처 + baseline 존재 시: 2x로 찍은 이미지를 baseline 크기로 리사이즈해 저장 (비교 시 크기 일치 + 다운스케일로 선명도 유지. sharp는 입출력 동일 경로 불가 → 버퍼로 리사이즈 후 덮어쓰기)
  if (selector && deviceScaleFactor > 1 && existsSync(BASELINE_PATH)) {
    const baselineBuf = readFileSync(BASELINE_PATH);
    const meta = await sharp(baselineBuf).metadata();
    if (meta.width != null && meta.height != null) {
      const inputBuf = readFileSync(SCREENSHOT_PATH);
      const resized = await sharp(inputBuf)
        .resize(meta.width, meta.height, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
        .png()
        .toBuffer();
      writeFileSync(SCREENSHOT_PATH, resized);
    }
  }

  const sizeNote = selector
    ? ' (element only)'
    : ` (${viewport.width}×${viewport.height})`;
  console.log('Screenshot saved:', SCREENSHOT_PATH, sizeNote);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
