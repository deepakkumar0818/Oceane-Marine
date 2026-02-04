import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSHourlyQuantityLog from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-015";
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

    const revisionNo = await getNextRevisionForCreate(STSHourlyQuantityLog);

    // Prepare the document data
    const documentData = {
      documentInfo: {
        ...(body.documentInfo || {}),
        formNo: body.documentInfo?.formNo || "OPS-OFD-015",
        revisionNo,
        issueDate: body.documentInfo?.issueDate ? new Date(body.documentInfo.issueDate) : new Date(),
        approvedBy: body.documentInfo?.approvedBy || "JS",
      },
      transferInfo: body.transferInfo || {},
      hourlyRecords: (body.hourlyRecords || []).map((record) => ({
        serialNumber: record.serialNumber,
        date: record.date ? new Date(record.date) : undefined,
        time: record.time || "",
        dischargedQuantity: record.dischargedQuantity || 0,
        receivedQuantity: record.receivedQuantity || 0,
        differenceQuantity: record.differenceQuantity || 0,
        checkedBy: record.checkedBy || "",
      })),
      status: body.status || "DRAFT",
      createdBy: body.createdBy || undefined,
    };

    const newLog = await STSHourlyQuantityLog.create(documentData);

    return NextResponse.json(
      {
        message: "OPS-OFD-015 hourly quantity log created successfully",
        data: newLog,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-015 create error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
