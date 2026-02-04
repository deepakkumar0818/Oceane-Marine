import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import MooringMasterExpenseSheet from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-029";
import { incrementRevisionForUpdate } from "../../../revision";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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

    const existing = await MooringMasterExpenseSheet.findById(id).lean();

    if (!existing) {
      return NextResponse.json(
        { error: "Expense sheet not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Always compute revision from existing doc in DB (never use body.documentInfo.revisionNo)
    const revisionNo = incrementRevisionForUpdate(existing.documentInfo?.revisionNo);

    const formNo = body.documentInfo?.formNo || existing.documentInfo?.formNo || "OPS-OFD-029";
    const issueDate = body.documentInfo?.issueDate ? new Date(body.documentInfo.issueDate) : existing.documentInfo?.issueDate;
    const approvedBy = body.documentInfo?.approvedBy ?? existing.documentInfo?.approvedBy ?? "JS";

    const updateData = {
      personalDetails: body.personalDetails || existing.personalDetails || {},
      bankDetails: body.bankDetails || existing.bankDetails || {},
      travelDetails: {
        departureFromHomeTown: body.travelDetails?.departureFromHomeTown || existing.travelDetails?.departureFromHomeTown || {},
        arrivalAtHomeTown: body.travelDetails?.arrivalAtHomeTown || existing.travelDetails?.arrivalAtHomeTown || {},
      },
      statementOfExpenses: (body.statementOfExpenses || existing.statementOfExpenses || []).map((expense) => ({
        description: expense.description || "",
        numberOfDaysOrMisc: expense.numberOfDaysOrMisc || "",
        dailyRate: expense.dailyRate || 0,
        amount: expense.amount || 0,
        officeTotal: expense.officeTotal || 0,
      })),
      totals: body.totals || existing.totals || {},
      status: body.status || existing.status || "DRAFT",
      createdBy: body.createdBy || existing.createdBy || undefined,
      // Dot notation so documentInfo.revisionNo persists even when documentInfo was missing
      "documentInfo.formNo": formNo,
      "documentInfo.revisionNo": revisionNo,
      "documentInfo.issueDate": issueDate,
      "documentInfo.approvedBy": approvedBy,
    };

    const updatedExpenseSheet = await MooringMasterExpenseSheet.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        message: "OPS-OFD-029 expense sheet updated successfully",
        data: updatedExpenseSheet,
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-029 update error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
