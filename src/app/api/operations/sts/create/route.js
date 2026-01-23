import { NextResponse } from "next/server";
import cloudinary from "@/lib/config/claudinary";
import { connectDB } from "@/lib/config/connection";
import StsOperation from "@/lib/mongodb/models/StsOperation";
import Equipment from "@/lib/mongodb/models/pms/Equipment";
import mongoose from "mongoose";
import path from "node:path";

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();

    /* =====================
       EXTRACT TEXT FIELDS
    ====================== */
    const body = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") body[key] = value;
    });

    /* =====================
       FILE UPLOAD CONFIG
    ====================== */
    const FILE_FIELDS = [
      "chsSSQ",
      "chsQ88",
      "chsGAPlan",
      "chsMSDS",
      "chsMooringArrangement",
      "chsIndemnity",
      "msSSQ",
      "msQ88",
      "msGAPlan",
      "msMSDS",
      "msMooringArrangement",
      "msIndemnity",
      "jpo",
      "riskAssessment",
      "mooringPlan",
      "DeclarationAtSea",
      "checklist1",
      "checklist2",
      "checklist3AB",
      "checklist4AF",
      "checklist5AC",
      "checklist6AB",
      "checklist7",
      "stsTimesheet",
      "standingOrder",
      "stsEquipChecklistPriorOps",
      "stsEquipChecklistAfterOps",
      "chsFeedback",
      "msFeedback",
      "hourlyChecks",
      "restHoursCKL",
      "incidentReporting",
    ];

    const uploadedFiles = {};

    const ALLOWED_EXT = new Set([
      ".pdf",
      ".doc",
      ".docx",
      ".png",
      ".jpg",
      ".jpeg",
    ]);
    const MAX_SIZE = 25 * 1024 * 1024; // 25MB

    /* =====================
       FILE UPLOAD LOOP
    ====================== */
    for (const field of FILE_FIELDS) {
      const file = formData.get(field);

      // Skip if missing or empty
      if (!file || typeof file !== "object" || !file.name || file.size === 0) {
        continue;
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `${field} exceeds 25MB limit` },
          { status: 400 }
        );
      }

      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) {
        return NextResponse.json(
          { error: `Invalid file type for ${field}` },
          { status: 400 }
        );
      }

      // 1. Determine Resource Type
      // CRITICAL FIX: Force PDF, DOC, DOCX to "raw".
      // This ensures they are stored as files and not processed as images (which corrupts them).
      const isRaw = ext === ".pdf" || ext === ".doc" || ext === ".docx";
      const resourceType = isRaw ? "raw" : "image";

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 2. Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "oceane/sts",
            // FIX: Explicitly set resource_type based on file extension
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
            filename_override: file.name,
            // FIX: Removed 'allowed_formats' as it causes errors with 'raw' resource_type
          },
          (error, result) => {
            if (error) {
              console.error(`Cloudinary Upload Error for ${field}:`, error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(buffer);
      });

      // 3. Store the URL
      // The secure_url will now correctly point to /raw/upload/ or /image/upload/ automatically
      uploadedFiles[field] = uploadResult.secure_url;
    }

    /* =====================
       EQUIPMENT VALIDATION
    ====================== */
    let equipmentIds = [];
    if (body.equipments) {
      try {
        equipmentIds = Array.isArray(body.equipments)
          ? body.equipments
          : JSON.parse(body.equipments);
      } catch (e) {
        equipmentIds = [body.equipments];
      }
    }

    let equipments = [];
    if (equipmentIds.length > 0) {
      equipments = await Equipment.find({
        _id: { $in: equipmentIds },
        isInUse: false,
      });

      if (equipments.length !== equipmentIds.length) {
        return NextResponse.json(
          { error: "One or more selected equipments are not available" },
          { status: 400 }
        );
      }
    }

    /* =====================
       OPERATION TIMES
    ====================== */
    const operationStartTime = body.operationStartTime
      ? new Date(body.operationStartTime)
      : new Date();
    const operationEndTime = body.operationEndTime
      ? new Date(body.operationEndTime)
      : null;

    /* =====================
       EQUIPMENT USAGE
    ====================== */
    const equipmentUsage = equipments.map((eq) => ({
      equipment: eq._id,
      startTime: operationStartTime,
      status: "IN_USE",
    }));

    /* =====================
       CREATE STS OPERATION
    ====================== */
    const parentOperationId = new mongoose.Types.ObjectId();

    const stsOperation = await StsOperation.create({
      ...body,
      ...uploadedFiles,
      parentOperationId,
      equipments: equipmentUsage,
      operationStartTime,
      operationEndTime,
      version: 1,
      isLatest: true,
    });

    /* =====================
       LOCK EQUIPMENTS
    ====================== */
    if (equipmentIds.length > 0) {
      await Equipment.updateMany(
        { _id: { $in: equipmentIds } },
        {
          isInUse: true,
          lastUsedAt: new Date(),
        }
      );
    }

    return NextResponse.json(
      {
        message: "STS Operation created successfully",
        data: stsOperation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("STS CREATE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
