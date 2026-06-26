import { NextResponse } from "next/server";
import { getPublicAiReport } from "@/lib/api";

// Public, unauthenticated context.md share link — e.g. for pasting into an LLM's
// web-fetch tool. The path segment carries a literal ".md" suffix (the report id
// is the only credential, mirroring the backend's GET /ai-reports/:id/public), so
// it's stripped before hitting the API.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = rawId.replace(/\.md$/i, "");

  const report = await getPublicAiReport(id);

  if (!report || !report.content) {
    return new NextResponse("Report not found.\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(report.content, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
