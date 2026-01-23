import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import TrainingRecord from "@/lib/mongodb/models/qhse-training/TrainingRecord";
import TrainingPlan from "@/lib/mongodb/models/qhse-training/TrainingPlan";
import Counter from "@/lib/mongodb/models/generateFormCode";
import fs from "fs";
import path from "path";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    if (year) {
      // Records for a specific year (by plannedDate year)
      const yr = Number.parseInt(year, 10);
      const records = await TrainingRecord.find({
        plannedDate: {
          $gte: new Date(`${yr}-01-01T00:00:00.000Z`),
          $lte: new Date(`${yr}-12-31T23:59:59.999Z`),
        },
      })
        .sort({ plannedDate: 1 })
        .lean();

      return NextResponse.json({ success: true, data: records });
    }

    // Return available years from records
    const all = await TrainingRecord.find().select("plannedDate").lean();
    const years = [
      ...new Set(
        all
          .map((r) => new Date(r.plannedDate).getFullYear())
          .filter((y) => !Number.isNaN(y))
      ),
    ].sort((a, b) => b - a);

    return NextResponse.json({ success: true, data: years });
  } catch (error) {
    console.error("Get Training Records Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const formData = await req.formData();

    const trainingPlanId = formData.get("trainingPlanId");
    const plannedDate = formData.get("plannedDate");
    const topic = formData.get("topic");
    const instructor = formData.get("instructor");
    const actualTrainingDate = formData.get("actualTrainingDate");
    const attendanceJson = formData.get("attendance");
    const attendance = JSON.parse(attendanceJson || "[]");
    const attachmentFile = formData.get("attachment");

    // Basic validation
    if (
      !trainingPlanId ||
      !plannedDate ||
      !topic ||
      !instructor ||
      !actualTrainingDate ||
      !attendance?.length
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const topicTrimmed = topic.trim();
    const instructorTrimmed = instructor.trim();

    // Validate attendance structure - each item must have traineeName
    const invalidAttendance = attendance.some(
      (item) => !item?.traineeName?.trim()
    );

    if (invalidAttendance) {
      return NextResponse.json(
        { success: false, error: "Each attendance entry must have a trainee name" },
        { status: 400 }
      );
    }

    // Format attendance array to match schema (traineeName required, others optional)
    const formattedAttendance = attendance.map((item) => ({
      traineeName: item.traineeName.trim(),
      department: item.department?.trim() || undefined,
      designation: item.designation?.trim() || undefined,
      signature: item.signature?.trim() || undefined,
    }));

    // Ensure plan exists
    const plan = await TrainingPlan.findById(trainingPlanId);

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Training plan not found" },
        { status: 404 }
      );
    }

    // Check if the specific planItem (for this plannedDate) exists
    const planItem = plan.planItems.find(
      (item) => new Date(item.plannedDate).toISOString().split("T")[0] === 
                 new Date(plannedDate).toISOString().split("T")[0]
    );

    if (!planItem) {
      return NextResponse.json(
        { success: false, error: "Plan item not found for this planned date" },
        { status: 404 }
      );
    }

    // Ensure plan is approved (planItems don't carry status; rely on plan.status)
    if (plan.status !== "Approved") {
      return NextResponse.json(
        { success: false, error: "This plan item is not approved yet" },
        { status: 403 }
      );
    }

    // Prevent duplicate record for same plannedDate
    const existingRecord = await TrainingRecord.findOne({
      trainingPlanId,
      plannedDate: new Date(plannedDate),
    });

    if (existingRecord) {
      return NextResponse.json(
        { success: false, error: "Training record already exists" },
        { status: 409 }
      );
    }

    // Generate formCode (same pattern as drills and other modules)
    const counter = await Counter.findOneAndUpdate(
      { key: "TRAINING_RECORD" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const formCode = `QAF-OFD-${String(counter.seq).padStart(3, "0")}`;

    // Handle file upload if provided
    let attachmentData = null;
    if (attachmentFile && typeof attachmentFile !== "string") {
      const ALLOWED_EXT = new Set([
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".jpg",
        ".jpeg",
        ".png",
      ]);
      const MAX_SIZE = 25 * 1024 * 1024; // 25MB

      if (attachmentFile.size > MAX_SIZE) {
        return NextResponse.json(
          { success: false, error: "File exceeds 25MB limit" },
          { status: 400 }
        );
      }

      const ext = path.extname(attachmentFile.name).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) {
        return NextResponse.json(
          { success: false, error: "Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG" },
          { status: 400 }
        );
      }

      // Create upload directory
      const uploadDir = path.join(process.cwd(), "uploads", "training-records");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const safeFileName = attachmentFile.name.replace(/\s+/g, "_");
      const fileName = `${timestamp}-${safeFileName}`;
      const filePath = path.join(uploadDir, fileName);

      // Save file
      const buffer = Buffer.from(await attachmentFile.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      attachmentData = {
        filePath: `uploads/training-records/${fileName}`,
        fileName: attachmentFile.name,
      };
    }

    const record = await TrainingRecord.create({
      formCode,
      trainingPlanId,
      plannedDate: new Date(plannedDate),
      topic: topicTrimmed,
      instructor: instructorTrimmed,
      actualTrainingDate: new Date(actualTrainingDate),
      attendance: formattedAttendance,
      status: "Completed", // auto-complete/approve records
      attachment: attachmentData,
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("Create Training Record Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
