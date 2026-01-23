import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import PoacCrossCompetency from "@/lib/mongodb/models/qhse-poac/PoacCrossCompetency";
import { POAC_EVALUATION_ITEMS } from "@/lib/constants/qhse-poac/poacEvaluationItems";
import mongoose from "mongoose";

export async function POST(req) {
  await connectDB();

  try {
    const body = await req.json();

    const {
      nameOfPOAC,
      evaluationDate,
      jobRefNo,
      leadPOAC,
      evaluationItems = [],
    } = body;

    /* =========================
       REQUIRED FIELD VALIDATION
       ========================= */
    if (!nameOfPOAC?.trim())
      return NextResponse.json(
        { error: "Name of POAC is required" },
        { status: 400 }
      );

    if (!evaluationDate)
      return NextResponse.json(
        { error: "Evaluation date is required" },
        { status: 400 }
      );

    if (!jobRefNo?.trim())
      return NextResponse.json(
        { error: "Job Ref No is required" },
        { status: 400 }
      );

    if (!leadPOAC?.trim())
      return NextResponse.json(
        { error: "Lead POAC is required" },
        { status: 400 }
      );

    /* =========================
       NORMALIZE EVALUATION (STRING ENUM)
       ========================= */
    const normalizeEval = (value) => {
      if (value === undefined || value === null || value === "") return null;

      const strVal = String(value);
      if (["1", "2", "3", "4", "5"].includes(strVal)) return strVal;

      throw new Error("Invalid evaluation value. Allowed values: 1–5");
    };

    /* =========================
       MAP INPUT ITEMS BY srNo
       ========================= */
    const itemMap = new Map(
      evaluationItems.map((item) => [
        item.srNo,
        {
          evaluation: normalizeEval(item.evaluation),
          remarks: item.remarks?.trim() || "",
        },
      ])
    );

    /* =========================
       BUILD ALL 75 ITEMS
       ========================= */
    const finalEvaluationItems = POAC_EVALUATION_ITEMS.map((master) => ({
      srNo: master.srNo,
      area: master.area,
      evaluation: itemMap.get(master.srNo)?.evaluation ?? null,
      remarks: itemMap.get(master.srNo)?.remarks ?? "",
    }));

    /* =========================
       CREATE DOCUMENT
       ========================= */
    const tempParentId = new mongoose.Types.ObjectId();

    const form = await PoacCrossCompetency.create({
      parentOperationId: tempParentId,
      isLatest: true,

      // Required
      nameOfPOAC: nameOfPOAC.trim(),
      evaluationDate: new Date(evaluationDate),
      jobRefNo: jobRefNo.trim(),
      leadPOAC: leadPOAC.trim(),

      // Optional
      dischargingVessel: body.dischargingVessel?.trim(),
      receivingVessel: body.receivingVessel?.trim(),
      location: body.location?.trim(),
      typeOfOperation: body.typeOfOperation?.trim(),
      weatherCondition: body.weatherCondition?.trim(),

      deadweightDischarging:
        body.deadweightDischarging !== "" &&
        body.deadweightDischarging !== undefined
          ? Number(body.deadweightDischarging)
          : null,

      deadweightReceiving:
        body.deadweightReceiving !== "" &&
        body.deadweightReceiving !== undefined
          ? Number(body.deadweightReceiving)
          : null,

      revNo: body.revNo || "1.1",
      revDate: body.revDate ? new Date(body.revDate) : null,
      approvedBy: body.approvedBy?.trim(),

      evaluationItems: finalEvaluationItems,

      leadPOACComment: body.leadPOACComment?.trim(),
      leadPOACName: body.leadPOACName?.trim(),
      leadPOACDate: body.leadPOACDate ? new Date(body.leadPOACDate) : null,
      leadPOACSignature: body.leadPOACSignature?.trim(),

      opsSupportTeamComment: body.opsSupportTeamComment?.trim(),

      opsTeamName: body.opsTeamName?.trim(),
      opsTeamDate: body.opsTeamDate ? new Date(body.opsTeamDate) : null,
      opsTeamSignature: body.opsTeamSignature?.trim(),

      opsTeamSupdtName: body.opsTeamSupdtName?.trim(),
      opsTeamSupdtDate: body.opsTeamSupdtDate
        ? new Date(body.opsTeamSupdtDate)
        : null,
      opsTeamSupdtSignature: body.opsTeamSupdtSignature?.trim(),

      status: body.status || "Draft",
      createdBy: body.createdBy || null,
    });

    form.parentOperationId = form._id;
    await form.save();

    return NextResponse.json(
      {
        success: true,
        message: "POAC Cross Competency form created successfully",
        data: form,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POAC CREATE ERROR:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
