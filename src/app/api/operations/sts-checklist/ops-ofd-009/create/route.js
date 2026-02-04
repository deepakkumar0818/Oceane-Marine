import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import MooringMastersJobReport from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-009";

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

    // Prepare the document data
    const documentData = {
      documentInfo: body.documentInfo || {
        formNo: "OPS-OFD-009",
        revisionNo: "",
        issueDate: new Date(),
        approvedBy: "JS",
      },
      shipToBeLighted: body.shipToBeLighted || {},
      receivingShip: body.receivingShip || {},
      status: body.status || "DRAFT",
      createdBy: body.createdBy || undefined,
    };

    const newReport = await MooringMastersJobReport.create(documentData);

    return NextResponse.json(
      {
        message: "OPS-OFD-009 job report created successfully",
        data: newReport,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-009 create error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
