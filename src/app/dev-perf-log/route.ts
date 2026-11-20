import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROW_MARK = "<!-- /PERF_ROWS -->";
const DETAIL_MARK = "<!-- /PERF_DETAILS -->";

const isProd = process.env.NODE_ENV === "production";

const LOG_PATH = path.join(process.cwd(), "PERF-LOG.md");

const notFound = () => new NextResponse("Not Found", { status: 404 });

export async function POST(req: Request) {
  if (isProd) return notFound();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON 파싱 실패" }, { status: 400 });
  }

  const { row, detail, summary, markdown } = (body ?? {}) as {
    row?: unknown;
    detail?: unknown;
    summary?: unknown;
    markdown?: unknown;
  };

  if (typeof row !== "string" || !row.trim().startsWith("|")) {
    return NextResponse.json({ ok: false, error: "row 는 '|' 로 시작하는 표 한 줄이어야 한다" }, { status: 400 });
  }
  if (detail == null || typeof detail !== "object") {
    return NextResponse.json({ ok: false, error: "detail 객체가 필요하다" }, { status: 400 });
  }

  const safeRow = row.replace(/[\r\n]+/g, " ").trim();
  const title = typeof summary === "string" && summary.trim() ? summary.trim().slice(0, 120) : new Date().toISOString();

  let md: string;
  try {
    md = await fs.readFile(LOG_PATH, "utf8");
  } catch {
    return NextResponse.json({ ok: false, error: `PERF-LOG.md 를 못 읽었다: ${LOG_PATH}` }, { status: 500 });
  }

  if (!md.includes(ROW_MARK) || !md.includes(DETAIL_MARK)) {
    return NextResponse.json(
      { ok: false, error: `PERF-LOG.md 에 마커(${ROW_MARK} / ${DETAIL_MARK})가 없다` },
      { status: 500 },
    );
  }

  const human = typeof markdown === "string" && markdown.trim() ? `${markdown.trim()}\n\n` : "";
  const detailBlock =
    `<details><summary>${title}</summary>\n\n` +
    human +
    "<details><summary>원본 JSON</summary>\n\n" +
    "```json\n" +
    `${JSON.stringify(detail, null, 2)}\n` +
    "```\n\n" +
    "</details>\n\n" +
    "</details>\n\n";

  const next = md.replace(ROW_MARK, `${safeRow}\n${ROW_MARK}`).replace(DETAIL_MARK, `${detailBlock}${DETAIL_MARK}`);

  try {
    await fs.writeFile(LOG_PATH, next, "utf8");
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `PERF-LOG.md 쓰기 실패: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, file: LOG_PATH, appended: safeRow });
}

export async function GET() {
  if (isProd) return notFound();
  const exists = await fs
    .access(LOG_PATH)
    .then(() => true)
    .catch(() => false);
  return NextResponse.json({ ok: true, logExists: exists, file: LOG_PATH });
}
