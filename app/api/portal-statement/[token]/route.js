import { NextResponse } from "next/server";
import { verifyContractorToken, isPortalConfigured } from "@/lib/portalToken";
import { getContractorFullDetail } from "@/lib/sheets";
import { buildContractorStatement } from "@/lib/statement";
import { generateContractorStatementPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request, { params }) {
  if (!isPortalConfigured()) {
    return NextResponse.json({ error: "Contractor portal is not configured." }, { status: 503 });
  }

  const token = decodeURIComponent(params.token || "");
  const contractorName = verifyContractorToken(token);
  if (!contractorName) {
    return NextResponse.json({ error: "Invalid or expired link." }, { status: 403 });
  }

  let contractor;
  try {
    contractor = await getContractorFullDetail(contractorName);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  if (!contractor) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  let pdfBuffer;
  try {
    const statement = buildContractorStatement(contractor);
    pdfBuffer = await generateContractorStatementPdf(statement);
  } catch (err) {
    console.error("PDF generation failed (portal statement):", err);
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
