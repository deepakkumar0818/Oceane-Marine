import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSTimesheet from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-018";
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

    const revisionNo = await getNextRevisionForCreate(STSTimesheet);

    // Prepare the document data
    const documentData = {
      documentInfo: {
        ...(body.documentInfo || {}),
        formNo: body.documentInfo?.formNo || "OPS-OFD-018",
        revisionNo,
        issueDate: body.documentInfo?.issueDate ? new Date(body.documentInfo.issueDate) : new Date(),
        approvedBy: body.documentInfo?.approvedBy || "JS",
        page: body.documentInfo?.page ?? "",
      },
      basicInfo: body.basicInfo || {},
      operationTimings: (body.operationTimings || []).map((timing) => ({
        activityName: timing.activityName || "",
        fromDate: timing.fromDate ? new Date(timing.fromDate) : undefined,
        fromTime: timing.fromTime || "",
        toDate: timing.toDate ? new Date(timing.toDate) : undefined,
        toTime: timing.toTime || "",
        remarks: timing.remarks || "",
      })),
      additionalActivities: (body.additionalActivities || []).map((timing) => ({
        activityName: timing.activityName || "",
        fromDate: timing.fromDate ? new Date(timing.fromDate) : undefined,
        fromTime: timing.fromTime || "",
        toDate: timing.toDate ? new Date(timing.toDate) : undefined,
        toTime: timing.toTime || "",
        remarks: timing.remarks || "",
      })),
      weatherDelay: body.weatherDelay || {},
      cargoInfo: body.cargoInfo || {},
      finalRemarks: body.finalRemarks || "",
      status: body.status || "DRAFT",
      createdBy: body.createdBy || undefined,
    };

    const newTimesheet = await STSTimesheet.create(documentData);

    return NextResponse.json(
      {
        message: "OPS-OFD-018 timesheet created successfully",
        data: newTimesheet,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-018 create error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
