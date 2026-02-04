import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSChecklist6AB from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-005B";
import { getNextRevisionForCreate } from "../../revision";
import fs from "fs/promises";
import path from "path";

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

    const revisionNo = await getNextRevisionForCreate(STSChecklist6AB);

    // Prepare the document data
    const documentData = {
      documentInfo: {
        ...(body.documentInfo || {}),
        formNo: body.documentInfo?.formNo || "OPS-OFD-005B",
        revisionNo,
        revisionDate: body.documentInfo?.revisionDate ? new Date(body.documentInfo.revisionDate) : new Date(),
        approvedBy: body.documentInfo?.approvedBy || "JS",
      },
      transferInfo: body.transferInfo || {},
      checklist6A: body.checklist6A || {},
      checklist6B: body.checklist6B || [],
      responsiblePersons: body.responsiblePersons || {},
      status: body.status || "DRAFT",
      createdBy: body.createdBy || undefined,
    };

    const newChecklist = await STSChecklist6AB.create(documentData);

    return NextResponse.json(
      {
        message: "OPS-OFD-005B checklist created successfully",
        data: newChecklist,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-005B create error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
