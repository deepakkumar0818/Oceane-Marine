import { NextResponse } from "next/server";
import cloudinary from "@/lib/config/claudinary";
import { connectDB } from "@/lib/config/connection";
import MOCRiskAssessment from "@/lib/mongodb/models/qhse-moc/mocs-riskAssessment";
import path from "node:path";

const ALLOWED_EXT = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10MB per file

export async function POST(req) {
  await connectDB();

  try {
    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    // Upload each file to Cloudinary
    for (const file of files) {
      if (!file || typeof file === "string" || !file.name || file.size === 0) {
        continue;
      }

      // Validate file size
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `File "${file.name}" exceeds 10MB limit`,
          },
          { status: 400 }
        );
      }

      // Validate file extension
      const ext = path.extname(file.name).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) {
        return NextResponse.json(
          {
            success: false,
            error: `File "${file.name}" has invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, GIF`,
          },
          { status: 400 }
        );
      }

      // Determine resource type
      const isRaw =
        ext === ".pdf" ||
        ext === ".doc" ||
        ext === ".docx" ||
        ext === ".xls" ||
        ext === ".xlsx" ||
        ext === ".ppt" ||
        ext === ".pptx" ||
        ext === ".txt";
      const resourceType = isRaw ? "raw" : "image";

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "oceane/qhse/moc/risk-assessment",
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
            filename_override: file.name,
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary Upload Error:", error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(buffer);
      });

      // Store file information
      uploadedFiles.push({
        name: file.name,
        filename: uploadResult.original_filename || file.name,
        size: file.size,
        url: uploadResult.secure_url,
        mimeType: file.type || uploadResult.resource_type,
        uploadedAt: new Date(),
      });
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid files to upload" },
        { status: 400 }
      );
    }

    // Calculate total size
    const totalSize = uploadedFiles.reduce(
      (sum, file) => sum + file.size,
      0
    );

    // Save to database (uploadedBy optional; requires auth middleware to populate req.user)
    const mocRiskAssessment = new MOCRiskAssessment({
      title: `MOC Risk Assessment - ${new Date().toLocaleDateString()}`,
      files: uploadedFiles,
      totalSize: totalSize,
      ...(req.user?._id ? { uploadedBy: req.user._id } : {}),
    });

    await mocRiskAssessment.save();

    return NextResponse.json(
      {
        success: true,
        message: "Files uploaded successfully",
        data: mocRiskAssessment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Risk Assessment Upload Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to upload files",
      },
      { status: 500 }
    );
  }
}

