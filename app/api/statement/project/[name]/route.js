import { NextResponse } from "next/server";
import { getProject } from "@/lib/sheets";
import { buildProjectStatement } from "@/lib/statement";
import { generateProjectStatementPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request, { params }) {
  const projectName = decodeURIComponent(params.name);

  let project;
  try {
    project = await getProject(projectName);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const statement = buildProjectStatement(project);
  const pdfBuffer = await generateProjectStatementPdf(statement);

  const filename = `${projectName.replace(/[^a-z0-9]+/gi, "-")}-statement.pdf`;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
