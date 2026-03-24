import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'output');

/** URL의 node-id(705-13193) → API용(705:13193) */
function urlNodeIdToApi(urlNodeId: string): string {
  return urlNodeId.replace('-', ':');
}

function parseFigmaUrl(url: string): { fileKey: string; nodeId: string } | null {
  const match = url.match(/figma\.com\/design\/([^/]+)\/[^?]+\?[^#]*node-id=(\d+-\d+)/);
  if (!match) return null;
  return { fileKey: match[1], nodeId: match[2] };
}

async function downloadFigmaImage(filename: string, fileKey: string, nodeIdForApi: string, token: string, scale: string) {
  const apiUrl = `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeIdForApi)}&format=png&scale=${scale}`;
  const res = await fetch(apiUrl, { headers: { 'X-Figma-Token': token } });

  if (!res.ok) {
    console.error(`❌ Figma API 오류 [${filename}]:`, res.status, await res.text());
    return false;
  }

  const data = (await res.json()) as { err?: string; images?: Record<string, string> };
  if (data.err) {
    console.error(`❌ Figma API [${filename}]:`, data.err);
    return false;
  }

  const imageUrl = data.images?.[nodeIdForApi];
  if (!imageUrl) {
    console.error(`❌ 이미지 URL 없음 [${filename}]: 노드 ID 및 파일 접근 권한을 확인하세요.`);
    return false;
  }

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    console.error(`❌ 이미지 다운로드 실패 [${filename}]:`, imageRes.status);
    return false;
  }

  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const filePath = path.join(OUT_DIR, `${filename}.png`);
  writeFileSync(filePath, buffer);
  console.log(`✅ [${filename}] Baseline 저장 완료: ${filePath} (scale=${scale})`);
  return true;
}

async function main() {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    console.error('❌ FIGMA_ACCESS_TOKEN 이 환경변수에 필요합니다.');
    console.warn('.env 파일이나 Vercel 환경변수 설정에서 발급받은 토큰을 설정해주세요.');
    process.exit(1);
  }

  const configPath = path.join(process.cwd(), 'figma.config.json');
  if (!existsSync(configPath)) {
    console.error('❌ figma.config.json 파일이 루트 폴더에 없습니다. 컴포넌트별 URL 매핑을 추가해주세요.');
    process.exit(1);
  }

  const configStr = readFileSync(configPath, 'utf8');
  let configMap: Record<string, string> = {};
  try {
    configMap = JSON.parse(configStr);
  } catch (e) {
    console.error('❌ figma.config.json 은 올바른 JSON 형식이 아닙니다.');
    process.exit(1);
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const scale = process.env.FIGMA_EXPORT_SCALE ?? '2';

  for (const [componentName, url] of Object.entries(configMap)) {
    const parsed = parseFigmaUrl(url);
    if (!parsed) {
      console.warn(`⚠️ [${componentName}] 올바르지 않은 Figma 노드 URL 포맷입니다: ${url}`);
      continue;
    }
    const nodeIdForApi = urlNodeIdToApi(parsed.nodeId);
    console.log(`다운로드 요청 중: [${componentName}] ...`);
    await downloadFigmaImage(componentName, parsed.fileKey, nodeIdForApi, token, scale);
  }
}

main();
