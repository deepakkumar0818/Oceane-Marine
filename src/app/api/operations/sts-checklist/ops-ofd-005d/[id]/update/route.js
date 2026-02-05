import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSChecklist5D from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-005D";
import { incrementRevisionForUpdate } from "../../../revision";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function sanitizeSignatory(s) {
  if (!s || typeof s !== "object") return undefined;
  const out = {};
  if (s.name !== undefined) out.name = s.name;
  if (s.rank !== undefined) out.rank = s.rank;
  if (s.signature !== undefined) out.signature = s.signature;
  if (s.date !== undefined) out.date = s.date ? new Date(s.date) : null;
  if (s.time !== undefined) out.time = s.time;
  return Object.keys(out).length ? out : undefined;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req, { params }) {
  await connectDB();

  try {
    const { id } = await params;
    const formData = await req.formData();
    const dataStr = formData.get("data");

    if (!dataStr) {
      return NextResponse.json(
        { error: "Form data is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = JSON.parse(dataStr);

    const existing = await STSChecklist5D.findById(id).lean();

    if (!existing) {
      return NextResponse.json(
        { error: "Checklist not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const revisionNo = incrementRevisionForUpdate(existing.documentInfo?.revisionNo);

    const updateData = {
      documentInfo: {
        ...(existing.documentInfo || {}),
        ...(body.documentInfo || {}),
        revisionNo,
      },
      shipTerminalNames: body.shipTerminalNames ?? existing.shipTerminalNames ?? {},
      declarationChecklist: Array.isArray(body.declarationChecklist) ? body.declarationChecklist : (existing.declarationChecklist || []),
      repetitiveChecksHours: body.repetitiveChecksHours !== undefined ? body.repetitiveChecksHours : existing.repetitiveChecksHours,
      status: body.status ?? existing.status ?? "DRAFT",
      createdBy: body.createdBy ?? existing.createdBy ?? undefined,
    };

    if (body.terminalBerthedShipSignatory !== undefined) {
      const sanitized = sanitizeSignatory(body.terminalBerthedShipSignatory);
      updateData.terminalBerthedShipSignatory = { ...(existing.terminalBerthedShipSignatory || {}), ...(sanitized || {}) };
    }
    if (body.outerShipSignatory !== undefined) {
      const sanitized = sanitizeSignatory(body.outerShipSignatory);
      updateData.outerShipSignatory = { ...(existing.outerShipSignatory || {}), ...(sanitized || {}) };
    }
    if (body.terminalSignatory !== undefined) {
      const sanitized = sanitizeSignatory(body.terminalSignatory);
      updateData.terminalSignatory = { ...(existing.terminalSignatory || {}), ...(sanitized || {}) };
    }

    const updatedChecklist = await STSChecklist5D.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        message: "OPS-OFD-005D checklist updated successfully",
        data: updatedChecklist,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-005D update error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
