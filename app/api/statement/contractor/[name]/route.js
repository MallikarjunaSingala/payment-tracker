import { NextResponse } from "next/server";
import { getContractorFullDetail } from "@/lib/sheets";
import { buildContractorStatement } from "@/lib/statement";
import { generateContractorStatementPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request, { params }) {
  const contractorName = decodeURIComponent(params.name);

  let contractor;
  try {
    contractor = await getContractorFullDetail(contractorName);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  if (!contractor) {
    return NextResponse.json({ error: "Contractor not found." }, { status: 404 });
  }

  const statement = buildContractorStatement(contractor);
  const pdfBuffer = await generateContractorStatementPdf(statement);

  const filename = `${contractorName.replace(/[^a-z0-9]+/gi, "-")}-statement.pdf`;

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
