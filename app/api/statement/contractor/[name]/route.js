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

  let pdfBuffer;
  try {
    const statement = buildContractorStatement(contractor);
    pdfBuffer = await generateContractorStatementPdf(statement);
  } catch (err) {
    console.error("PDF generation failed (contractor statement):", err);
    return NextResponse.json(
      { error: "Failed to generate PDF statement.", detail: err.message },
      { status: 500 }
    );
  }

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
