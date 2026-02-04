import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import MooringMasterExpenseSheet from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-029";
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

    const revisionNo = await getNextRevisionForCreate(MooringMasterExpenseSheet);

    // Prepare the document data
    const documentData = {
      documentInfo: {
        ...(body.documentInfo || {}),
        formNo: body.documentInfo?.formNo || "OPS-OFD-029",
        revisionNo,
        issueDate: body.documentInfo?.issueDate ? new Date(body.documentInfo.issueDate) : new Date(),
        approvedBy: body.documentInfo?.approvedBy || "JS",
      },
      personalDetails: body.personalDetails || {},
      bankDetails: body.bankDetails || {},
      travelDetails: {
        departureFromHomeTown: body.travelDetails?.departureFromHomeTown || {},
        arrivalAtHomeTown: body.travelDetails?.arrivalAtHomeTown || {},
      },
      statementOfExpenses: (body.statementOfExpenses || []).map((expense) => ({
        description: expense.description || "",
        numberOfDaysOrMisc: expense.numberOfDaysOrMisc || "",
        dailyRate: expense.dailyRate || 0,
        amount: expense.amount || 0,
        officeTotal: expense.officeTotal || 0,
      })),
      totals: body.totals || {},
      status: body.status || "DRAFT",
      createdBy: body.createdBy || undefined,
    };

    const newExpenseSheet = await MooringMasterExpenseSheet.create(documentData);

    return NextResponse.json(
      {
        message: "OPS-OFD-029 expense sheet created successfully",
        data: newExpenseSheet,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-029 create error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
