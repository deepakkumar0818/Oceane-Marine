import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import HseInductionChecklist from "@/lib/mongodb/models/qhse-form-checklist/HseInductionChecklist";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Origin",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await req.json();

    if (
      !body.employeeOrContractorName ||
      !body.dateOfInduction ||
      !body.location
    ) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      !body.hseChecklist ||
      typeof body.hseChecklist !== "object" ||
      Array.isArray(body.hseChecklist)
    ) {
      return NextResponse.json(
        { error: "HSE checklist must be a valid object" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      !body.jobSpecificChecklist ||
      typeof body.jobSpecificChecklist !== "object" ||
      Array.isArray(body.jobSpecificChecklist)
    ) {
      return NextResponse.json(
        { error: "Job specific checklist must be a valid object" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      !body.signatures?.employeeSignature ||
      !body.signatures?.inductionGivenBySignature
    ) {
      return NextResponse.json(
        { error: "All required signatures must be provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    const formData = {
      employeeOrContractorName: body.employeeOrContractorName.trim(),
      dateOfInduction: new Date(body.dateOfInduction),
      location: body.location.trim(),
      hseChecklist: body.hseChecklist,
      jobSpecificChecklist: body.jobSpecificChecklist,
      signatures: {
        employeeSignature: body.signatures.employeeSignature,
        employeeSignatureDate: body.signatures.employeeSignatureDate
          ? new Date(body.signatures.employeeSignatureDate)
          : new Date(),
        inductionGivenBySignature: body.signatures.inductionGivenBySignature,
      },
      status: "Pending",
      submittedBy: body.submittedBy || null,
      formNo: body.formNo || body.formCode || null,
      revisionNo: body.revisionNo || body.version || "1.0",
      revisionDate: body.revisionDate
        ? new Date(body.revisionDate)
        : new Date(),
      approvedBy: body.approvedBy || null,
    };

    const newHseInductionChecklist = await new HseInductionChecklist(
      formData
    ).save();

    return NextResponse.json(
      { success: true, data: newHseInductionChecklist },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("HSE Induction Checklist Create Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checklist" },
      { status: 500, headers: corsHeaders }
    );
  }
}
