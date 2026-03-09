/**
 * Pixelmatch로 기준 이미지(baseline) vs 구현 스크린샷(implementation) 비교
 * - baseline: Figma에서 추출한 스크린샷 또는 이전 승인된 스크린샷
 * - implementation: scripts/screenshot.ts 로 저장한 output/implementation.png
 * - 크기가 다르면 implementation 을 baseline 크기로 리사이즈한 뒤 비교
 * 결과: output/diff.png, output/report.html
 */
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'output');
const BASELINE_PATH =
  process.env.BASELINE_PATH ?? path.join(OUT_DIR, 'baseline.png');
const IMPL_PATH = path.join(OUT_DIR, 'implementation.png');
const DIFF_PATH = path.join(OUT_DIR, 'diff.png');
const REPORT_PATH = path.join(OUT_DIR, 'report.html');

const ALPHA_THRESHOLD = 128;

function isBaselinePlaceholderGray(data: Uint8Array, i: number): boolean {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  if (a < ALPHA_THRESHOLD) return false;
  const gray = (r + g + b) / 3;
  return gray >= 228 && gray <= 252 && Math.abs(r - gray) <= 8 && Math.abs(g - gray) <= 8 && Math.abs(b - gray) <= 8;
}

function isImplSkeletonGray(data: Uint8Array, i: number): boolean {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  if (a < ALPHA_THRESHOLD) return false;
  const gray = (r + g + b) / 3;
  return gray >= 240 && gray <= 252 && Math.abs(r - gray) <= 8 && Math.abs(g - gray) <= 8 && Math.abs(b - gray) <= 8;
}

const CARD_IMAGE_HEIGHT_RATIO = 316 / 500;

function forcePlaceholderDiff(
  baselineData: Uint8Array,
  implData: Uint8Array,
  diffData: Uint8Array,
  width: number,
  height: number
): void {
  const RED = [255, 0, 0];
  const MIN_GRAY_DIFF = 5;
  const yEnd = Math.floor(height * CARD_IMAGE_HEIGHT_RATIO);
  for (let y = 0; y < yEnd; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (!isBaselinePlaceholderGray(baselineData, i) || !isImplSkeletonGray(implData, i)) continue;
      const br = baselineData[i];
      const ir = implData[i];
      if (Math.abs(br - ir) <= MIN_GRAY_DIFF) continue;
      diffData[i] = RED[0];
      diffData[i + 1] = RED[1];
      diffData[i + 2] = RED[2];
    }
  }
}

/** 카드 모서리 밴드 제외한 '진짜 내부'만 사용 → border-radius 차이는 모서리에서 잡히도록 유지 */
const CARD_RADIUS = 20;

/** 네 모서리 영역 크기 (border-radius 차이 잡기 위해 이 안에서는 더 엄격 비교) */
const CORNER_SIZE = 60;
/** 모서리에서 RGB 채널 차이 이하면 동일로 봄 (0–255) */
const CORNER_COLOR_THRESHOLD = 15;
/** 모서리에서 Alpha 차이 이하면 동일로 봄. Figma는 모서리 밖을 투명(0), 브라우저는 불투명(255)이라 반드시 비교 필요 */
const CORNER_ALPHA_THRESHOLD = 32;

function isInCornerRegion(x: number, y: number, w: number, h: number): boolean {
  if (x < CORNER_SIZE && y < CORNER_SIZE) return true;
  if (x >= w - CORNER_SIZE && y < CORNER_SIZE) return true;
  if (x < CORNER_SIZE && y >= h - CORNER_SIZE) return true;
  if (x >= w - CORNER_SIZE && y >= h - CORNER_SIZE) return true;
  return false;
}

/** 모서리 영역만 추가로 엄격 비교 → border-radius(20px vs 10px) 등 차이 표시. RGB+Alpha 모두 비교 (Figma 투명 vs 브라우저 배경) */
function markCornerDiffs(
  baselineData: Uint8Array,
  implData: Uint8Array,
  diffData: Uint8Array,
  width: number,
  height: number
): number {
  const RED = [255, 0, 0];
  let marked = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isInCornerRegion(x, y, width, height)) continue;
      const i = (y * width + x) * 4;
      const dr = Math.abs(baselineData[i] - implData[i]);
      const dg = Math.abs(baselineData[i + 1] - implData[i + 1]);
      const db = Math.abs(baselineData[i + 2] - implData[i + 2]);
      const da = Math.abs(baselineData[i + 3] - implData[i + 3]);
      if (
        dr <= CORNER_COLOR_THRESHOLD &&
        dg <= CORNER_COLOR_THRESHOLD &&
        db <= CORNER_COLOR_THRESHOLD &&
        da <= CORNER_ALPHA_THRESHOLD
      )
        continue;
      diffData[i] = RED[0];
      diffData[i + 1] = RED[1];
      diffData[i + 2] = RED[2];
      diffData[i + 3] = 255;
      marked++;
    }
  }
  return marked;
}

/** (x,y)가 카드의 둥근 모서리 밴드를 제외한 내부 사각형 안에 있는지. 모서리 영역은 diff에서 건드리지 않음. */
function isInCardInnerRect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): boolean {
  return x >= r && x < w - r && y >= r && y < h - r;
}

const CARD_INTERIOR_MATCH_GRAY = 220;

function liftCardInteriorDarkPixels(
  diffData: Uint8Array,
  width: number,
  height: number
): void {
  const r = Math.min(CARD_RADIUS, Math.floor(width / 8), Math.floor(height / 8));
  const DARK_THRESHOLD = 210;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isInCardInnerRect(x, y, width, height, r)) continue;
      const i = (y * width + x) * 4;
      if (diffData[i] === 255 && diffData[i + 1] === 0 && diffData[i + 2] === 0) continue;
      if (diffData[i] < DARK_THRESHOLD || diffData[i + 1] < DARK_THRESHOLD || diffData[i + 2] < DARK_THRESHOLD) {
        diffData[i] = CARD_INTERIOR_MATCH_GRAY;
        diffData[i + 1] = CARD_INTERIOR_MATCH_GRAY;
        diffData[i + 2] = CARD_INTERIOR_MATCH_GRAY;
      }
    }
  }
}

function isDiffPixel(diffData: Uint8Array, i: number): boolean {
  const r = diffData[i * 4];
  const g = diffData[i * 4 + 1];
  const b = diffData[i * 4 + 2];
  return r === 255 && g === 0 && b === 0;
}

function countDiffPixels(diffData: Uint8Array, pixelCount: number): number {
  let n = 0;
  for (let i = 0; i < pixelCount; i++) {
    if (isDiffPixel(diffData, i)) n++;
  }
  return n;
}

/** FigDiff 참고: 비교 전 두 이미지를 동일한 파이프라인(Sharp)으로 정규화해 포맷/채널 일치 → 오탐 감소 */
async function normalizeToRawRgba(
  buffer: Buffer,
  width: number,
  height: number
): Promise<Uint8Array> {
  const { data } = await sharp(buffer)
    .resize(width, height)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return new Uint8Array(data);
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  if (!existsSync(BASELINE_PATH)) {
    console.error('Baseline image not found:', BASELINE_PATH);
    process.exit(1);
  }
  if (!existsSync(IMPL_PATH)) {
    console.error('Implementation screenshot not found:', IMPL_PATH);
    console.error('Run: npm run screenshot (with dev server running)');
    process.exit(1);
  }

  const baselineBuf = readFileSync(BASELINE_PATH);
  const implBuffer = readFileSync(IMPL_PATH);
  const baselineMeta = await sharp(baselineBuf).metadata();
  const width = baselineMeta.width!;
  const height = baselineMeta.height!;
  if (width == null || height == null) {
    console.error('Baseline image has no width/height');
    process.exit(1);
  }
  console.log('비교 전 두 이미지 Sharp로 정규화(동일 크기·RGBA)...');
  const baselineData = await normalizeToRawRgba(baselineBuf, width, height);
  const implData = await normalizeToRawRgba(implBuffer, width, height);

  const diff = new PNG({ width, height });
  // 모서리(border-radius)·레이아웃 등 미세 차이는 threshold 낮추면 잡힘. 예: VISUAL_DIFF_THRESHOLD=0.1
  const PIXELMATCH_THRESHOLD = parseFloat(process.env.VISUAL_DIFF_THRESHOLD ?? '0.25');
  pixelmatch(
    baselineData,
    implData,
    diff.data,
    width,
    height,
    {
      threshold: PIXELMATCH_THRESHOLD,
      diffColor: [255, 0, 0],
      aaColor: [255, 0, 0],
      alpha: 1,
    }
  );

  forcePlaceholderDiff(baselineData, implData, diff.data as Uint8Array, width, height);
  const cornerMarked = markCornerDiffs(baselineData, implData, diff.data as Uint8Array, width, height);
  if (cornerMarked > 0) console.log('모서리 영역 차이 픽셀(추가 표시):', cornerMarked);
  let numDiffPixels = countDiffPixels(diff.data as Uint8Array, width * height);
  liftCardInteriorDarkPixels(diff.data as Uint8Array, width, height);
  const totalPixels = width * height;
  const diffPercent = ((numDiffPixels / totalPixels) * 100).toFixed(2);
  console.log('대조: 전체(카드 이미지 영역 포함), 모자이크/스켈레톤은 차이로 집계');

  writeFileSync(DIFF_PATH, PNG.sync.write(diff));
  console.log('Diff image saved:', DIFF_PATH);
  console.log('Diff pixels:', numDiffPixels, '/', totalPixels, `(${diffPercent}%)`);

  const reportHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>Visual Diff Report</title>
  <style>
    body { font-family: system-ui; padding: 24px; background: #1a1a1a; color: #eee; }
    h1 { margin-bottom: 8px; }
    .meta { color: #888; font-size: 13px; margin-bottom: 16px; }
    .report-grid { display: grid; gap: 16px; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; }
    .report-grid .cell img { max-width: 100%; height: auto; border: 1px solid #333; border-radius: 8px; }
    .report-grid .cell h2 { margin: 0 0 8px 0; font-size: 16px; font-weight: 600; }
    .blend-toolbar { min-height: 72px; }
    .blend-controls { display: flex; flex-wrap: wrap; gap: 20px 32px; margin-bottom: 12px; align-items: center; }
    .blend-controls label { display: flex; align-items: center; gap: 8px; font-size: 13px; white-space: nowrap; }
    .blend-controls input[type="range"] { width: 120px; accent-color: #6b8cff; }
    .blend-controls .val { min-width: 28px; color: #aaa; }
    .blend-container { position: relative; display: inline-block; max-width: 100%; border: 1px solid #333; border-radius: 8px; overflow: hidden; }
    .blend-container .blend-base { display: block; max-width: 100%; height: auto; vertical-align: top; }
    .blend-container .blend-overlay { position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
  </style>
</head>
<body>
  <h1>Visual Diff Report</h1>
  <p class="meta">Diff: <strong>${numDiffPixels} pixels (${diffPercent}%)</strong> — 빨간색 = 픽셀 차이, 밝은 회색 = 일치</p>
  <div class="report-grid">
    <div class="cell blend-cell">
      <h2>비교 (투명도 조절)</h2>
      <div class="blend-toolbar">
        <p class="meta" style="margin-bottom:12px;">원본과 구현 이미지를 겹쳐 보며, 막대바로 각 레이어 투명도를 조절할 수 있습니다.</p>
        <div class="blend-controls">
          <label>원본 (Figma) <input type="range" id="baseline-opacity" min="0" max="100" value="50" /> <span class="val" id="baseline-val">50</span>%</label>
          <label>구현 (코드) <input type="range" id="impl-opacity" min="0" max="100" value="50" /> <span class="val" id="impl-val">50</span>%</label>
        </div>
      </div>
      <div class="blend-container">
        <img src="baseline.png" alt="baseline" class="blend-base" id="baseline-layer" />
        <img src="implementation.png" alt="implementation" class="blend-overlay" id="impl-layer" />
      </div>
    </div>
    <div class="cell"><h2>Diff (차이 마스크)</h2><div class="blend-toolbar"></div><img src="diff.png" alt="diff" /></div>
    <div class="cell"><h2>원본 (Figma)</h2><img src="baseline.png" alt="baseline" /></div>
    <div class="cell"><h2>구현 (코드)</h2><img src="implementation.png" alt="implementation" /></div>
  </div>
  <script>
    (function(){
      var base = document.getElementById('baseline-layer');
      var impl = document.getElementById('impl-layer');
      var baseInput = document.getElementById('baseline-opacity');
      var implInput = document.getElementById('impl-opacity');
      var baseVal = document.getElementById('baseline-val');
      var implVal = document.getElementById('impl-val');
      function pct(v) { return (v / 100).toFixed(2); }
      baseInput.addEventListener('input', function() { base.style.opacity = pct(this.value); baseVal.textContent = this.value; });
      implInput.addEventListener('input', function() { impl.style.opacity = pct(this.value); implVal.textContent = this.value; });
      base.style.opacity = pct(baseInput.value);
      impl.style.opacity = pct(implInput.value);
    })();
  </script>
</body>
</html>
`;
  writeFileSync(REPORT_PATH, reportHtml);
  console.log('Report saved:', REPORT_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
