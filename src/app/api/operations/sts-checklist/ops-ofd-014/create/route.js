import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSEquipmentChecklist from "@/lib/mongodb/models/operation-sts-checklist/OPS-OFD-014";
import { getNextRevisionForCreate } from "../../revision";
import fs from "fs/promises";
import path from "path";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Initial rows per table (match external form: 3 each)
const INITIAL_ROWS = 3;
const FENDER_ROW = { fenderId: "", endPlates: "", bShackle: "", swivel: "", secondShackle: "", mooringShackle: "", fenderBody: "", tires: "", pressure: "" };
const HOSE_ROW = { hoseId: "", endFlanges: "", bodyCondition: "", nutsBolts: "", markings: "" };
const OTHER_ROW = { equipmentId: "", gaskets: "", ropes: "", wires: "", billyPugh: "", liftingStrops: "" };

function defaultEquipmentRows(count, rowTemplate) {
  return Array.from({ length: count }, () => ({ ...rowTemplate }));
}

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

    // Handle signature file upload if provided
    const signatureFile = formData.get("signature");
    let signatureUrl = body.signatureBlock?.mooringMasterSignature;

    if (signatureFile && typeof signatureFile !== "string" && signatureFile.name) {
      const bytes = await signatureFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(
        process.cwd(),
        "public/uploads/signatures/ops-ofd-014"
      );
      await fs.mkdir(uploadDir, { recursive: true });

      const fileName = `${Date.now()}-${signatureFile.name}`;
      const filePath = path.join(uploadDir, fileName);

      await fs.writeFile(filePath, buffer);
      signatureUrl = `/uploads/signatures/ops-ofd-014/${fileName}`;
    }

    const revisionNo = await getNextRevisionForCreate(STSEquipmentChecklist);

    // Prepare the document data
    const documentData = {
      documentInfo: {
        ...(body.documentInfo || {}),
        formNo: body.documentInfo?.formNo || "OPS-OFD-014",
        revisionNo,
        issueDate: body.documentInfo?.issueDate ? new Date(body.documentInfo.issueDate) : new Date(),
        approvedBy: body.documentInfo?.approvedBy || "JS",
        page: body.documentInfo?.page ?? "",
      },
      jobInfo: body.jobInfo || {},
      fenderEquipment: Array.isArray(body.fenderEquipment) && body.fenderEquipment.length > 0
        ? body.fenderEquipment
        : defaultEquipmentRows(INITIAL_ROWS, FENDER_ROW),
      hoseEquipment: Array.isArray(body.hoseEquipment) && body.hoseEquipment.length > 0
        ? body.hoseEquipment
        : defaultEquipmentRows(INITIAL_ROWS, HOSE_ROW),
      otherEquipment: Array.isArray(body.otherEquipment) && body.otherEquipment.length > 0
        ? body.otherEquipment
        : defaultEquipmentRows(INITIAL_ROWS, OTHER_ROW),
      remarks: body.remarks || "",
      signatureBlock: {
        mooringMasterSignature: signatureUrl || "",
      },
      status: body.status || "DRAFT",
      createdBy: body.createdBy || undefined,
    };

    const newChecklist = await STSEquipmentChecklist.create(documentData);

    return NextResponse.json(
      {
        message: "OPS-OFD-014 equipment checklist created successfully",
        data: newChecklist,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("OPS-OFD-014 create error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
