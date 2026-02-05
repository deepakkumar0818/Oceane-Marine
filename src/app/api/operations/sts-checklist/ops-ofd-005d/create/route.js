import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSChecklist5D from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-005D";
import { getNextRevisionForCreate } from "../../revision";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const DEFAULT_DECLARATION_CHECKLIST = [
  { checklistId: "3A", label: "Checklist 3A Before cargo Transfer", terminalBerthedShip: false, outerShip: false, terminal: false, notApplicable: false },
  { checklistId: "3B", label: "Checklist 3B (Additional for LPG and LNG)", terminalBerthedShip: false, outerShip: false, terminal: false, notApplicable: false },
  { checklistId: "7", label: "Checklist 7 Checks Pre Transfer Conference alongside a terminal", terminalBerthedShip: false, outerShip: false, terminal: false, notApplicable: false },
  { checklistId: "4B", label: "Checklist 4B (Additional for Vapour Balancing)", terminalBerthedShip: false, outerShip: false, terminal: false, notApplicable: false },
  { checklistId: "4C", label: "Checklist 4C (Additional for Chemicals)", terminalBerthedShip: false, outerShip: false, terminal: false, notApplicable: false },
  { checklistId: "4D", label: "Checklist 4D (Additional for LPG and LNG)", terminalBerthedShip: false, outerShip: false, terminal: false, notApplicable: false },
  { checklistId: "4E", label: "Checklist 4E (Additional for LNG)", terminalBerthedShip: false, outerShip: false, terminal: false, notApplicable: false },
  { checklistId: "4F", label: "Checklist 4F Pre Transfer Agreement", terminalBerthedShip: false, outerShip: false, terminal: false, notApplicable: false },
];

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();
    const dataStr = formData.get("data");

    if (!dataStr) {
      return NextResponse.json(
        { error: "Form data is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = JSON.parse(dataStr);

    const revisionNo = await getNextRevisionForCreate(STSChecklist5D);

    const sanitizeSignatory = (s) => {
      if (!s || typeof s !== "object") return {};
      return {
        name: s.name ?? "",
        rank: s.rank ?? "",
        signature: s.signature ?? "",
        date: s.date ? new Date(s.date) : null,
        time: s.time ?? "",
      };
    };

    const documentData = {
      documentInfo: {
        ...(body.documentInfo || {}),
        formNo: body.documentInfo?.formNo || "OPS-OFD-005",
        revisionNo,
        issueDate: body.documentInfo?.issueDate ? new Date(body.documentInfo.issueDate) : new Date(),
        approvedBy: body.documentInfo?.approvedBy || "JS",
      },
      shipTerminalNames: body.shipTerminalNames || {},
      declarationChecklist: Array.isArray(body.declarationChecklist) && body.declarationChecklist.length > 0
        ? body.declarationChecklist
        : DEFAULT_DECLARATION_CHECKLIST,
      repetitiveChecksHours: body.repetitiveChecksHours ?? "",
      terminalBerthedShipSignatory: sanitizeSignatory(body.terminalBerthedShipSignatory),
      outerShipSignatory: sanitizeSignatory(body.outerShipSignatory),
      terminalSignatory: sanitizeSignatory(body.terminalSignatory),
      status: body.status || "DRAFT",
      createdBy: body.createdBy || undefined,
    };

    const newChecklist = await STSChecklist5D.create(documentData);

    return NextResponse.json(
      {
        message: "OPS-OFD-005D checklist created successfully",
        data: newChecklist,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-005D create error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
