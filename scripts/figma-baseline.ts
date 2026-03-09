/**
 * Figma REST API로 특정 노드 이미지를 export 해서 output/baseline.png 로 저장
 *
 * 환경변수 (.env 에 넣어두면 됨):
 *   FIGMA_ACCESS_TOKEN  - Figma Personal access token (필수)
 *   FIGMA_URL          - Figma에서 "Copy link to selection" 한 전체 URL (권장)
 *   또는 FIGMA_FILE_KEY + FIGMA_NODE_ID 를 따로 지정
 *
 * fileKey / nodeId 는 별도로 구할 필요 없음. Figma에서 레이어 선택 후
 * "Copy link to selection" 한 URL 에 이미 들어 있음.
 *   예: .../design/h4eQr8F9UqPSTCpc2Qj0vO/파일이름?node-id=705-13193
 *       → fileKey = h4eQr8F9UqPSTCpc2Qj0vO, nodeId = 705-13193
 *
 *   FIGMA_EXPORT_SCALE - export 배율 (기본 2). 1 이면 디자인 px 그대로(350x500 → 350x500 PNG)
 *       → baseline 이미지가 350x500보다 큰 이유: scale=2 이면 350x500 레이어가 700x1000 으로 내보내짐
 *   Figma에서 "Copy link to selection" 시, 카드만 나오게 하려면 350x500 카드 레이어만 선택할 것
 *       (상위 프레임을 선택하면 위쪽에 투명 여백이 포함되어 이미지가 더 커짐)
 *
 * 토큰 발급: Figma → Settings → Account → Personal access tokens
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'output');
const BASELINE_PATH = path.join(OUT_DIR, 'baseline.png');

/** URL의 node-id(705-13193) → API용(705:13193) */
function urlNodeIdToApi(urlNodeId: string): string {
  return urlNodeId.replace('-', ':');
}

function parseFigmaUrl(
  url: string
): { fileKey: string; nodeId: string } | null {
  const match = url.match(
    /figma\.com\/design\/([^/]+)\/[^?]+\?[^#]*node-id=(\d+-\d+)/
  );
  if (!match) return null;
  return { fileKey: match[1], nodeId: match[2] };
}

async function main() {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  let fileKey = process.env.FIGMA_FILE_KEY;
  let nodeId = process.env.FIGMA_NODE_ID;

  if (!token) {
    console.error(
      'FIGMA_ACCESS_TOKEN 이 필요합니다. .env 에 넣거나 환경변수로 지정하세요.'
    );
    console.error(
      '토큰 발급: Figma → Settings → Account → Personal access tokens'
    );
    process.exit(1);
  }

  const url = process.env.FIGMA_URL;
  if (url) {
    const parsed = parseFigmaUrl(url);
    if (parsed) {
      fileKey = fileKey ?? parsed.fileKey;
      nodeId = nodeId ?? parsed.nodeId;
    }
  }

  if (!fileKey || !nodeId) {
    console.error(
      'FIGMA_URL 또는 (FIGMA_FILE_KEY + FIGMA_NODE_ID) 가 필요합니다.'
    );
    console.error(
      'Figma에서 레이어 선택 → 우클릭 "Copy link to selection" → .env 에 FIGMA_URL=... 로 붙여넣기'
    );
    process.exit(1);
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // Figma API는 노드 ID를 콜론 형식(705:13193)으로 받음. URL은 하이픈(705-13193)
  const nodeIdForApi = urlNodeIdToApi(nodeId);
  const scale = process.env.FIGMA_EXPORT_SCALE ?? '2'; // 1 = 디자인 px 그대로(350x500), 2 = 2배(700x1000)
  const apiUrl = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeIdForApi)}&format=png&scale=${scale}`;
  const res = await fetch(apiUrl, {
    headers: { 'X-Figma-Token': token },
  });

  if (!res.ok) {
    console.error('Figma API 오류:', res.status, await res.text());
    process.exit(1);
  }

  const data = (await res.json()) as {
    err?: string;
    images?: Record<string, string>;
  };
  if (data.err) {
    console.error('Figma API:', data.err);
    process.exit(1);
  }

  const imageUrl = data.images?.[nodeIdForApi];
  if (!imageUrl) {
    console.error(
      '이미지 URL을 받지 못했습니다. 노드 ID와 파일 접근 권한을 확인하세요.'
    );
    process.exit(1);
  }

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    console.error('이미지 다운로드 실패:', imageRes.status);
    process.exit(1);
  }

  const buffer = Buffer.from(await imageRes.arrayBuffer());
  writeFileSync(BASELINE_PATH, buffer);
  console.log('Baseline 저장:', BASELINE_PATH, `(scale=${scale}, 350x500 디자인 → ${scale === '1' ? '350x500' : '700x1000'} PNG)`);
}

main();
