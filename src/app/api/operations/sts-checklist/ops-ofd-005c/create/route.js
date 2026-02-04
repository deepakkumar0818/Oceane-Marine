import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSChecklist5C from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-005C";
import { getNextRevisionForCreate } from "../../revision";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

    const revisionNo = await getNextRevisionForCreate(STSChecklist5C);

    // Prepare the document data
    const documentData = {
      documentInfo: {
        ...(body.documentInfo || {}),
        formNo: body.documentInfo?.formNo || "OPS-OFD-005C",
        revisionNo,
        issueDate: body.documentInfo?.issueDate ? new Date(body.documentInfo.issueDate) : new Date(),
        approvedBy: body.documentInfo?.approvedBy || "JS",
      },
      terminalTransferInfo: body.terminalTransferInfo || {},
      checklistItems: body.checklistItems || [],
      responsiblePersons: body.responsiblePersons || {},
      status: body.status || "DRAFT",
      createdBy: body.createdBy || undefined,
    };

    const newChecklist = await STSChecklist5C.create(documentData);

    return NextResponse.json(
      {
        message: "OPS-OFD-005C checklist created successfully",
        data: newChecklist,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-005C create error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
