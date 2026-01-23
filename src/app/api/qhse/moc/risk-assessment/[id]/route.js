import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import MOCRiskAssessment from "@/lib/mongodb/models/qhse-moc/mocs-riskAssessment";
import cloudinary from "@/lib/config/claudinary";

export async function DELETE(req, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const upload = await MOCRiskAssessment.findById(id);

    if (!upload) {
      return NextResponse.json(
        { success: false, error: "Upload not found" },
        { status: 404 }
      );
    }

    // Delete files from Cloudinary
    if (upload.files && upload.files.length > 0) {
      for (const file of upload.files) {
        if (file.url) {
          try {
            // Extract public_id from Cloudinary URL
            const urlParts = file.url.split("/");
            const folderIndex = urlParts.findIndex(
              (part) => part === "risk-assessment"
            );
            if (folderIndex !== -1) {
              const publicIdParts = urlParts.slice(folderIndex + 1);
              // Remove file extension from public_id
              const publicId = publicIdParts
                .join("/")
                .replace(/\.[^/.]+$/, "");
              
              // Determine resource type from URL
              const isRaw = file.url.includes("/raw/upload/");
              const resourceType = isRaw ? "raw" : "image";

              await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType,
              });
            }
          } catch (cloudinaryError) {
            console.error(
              `Failed to delete file from Cloudinary: ${file.url}`,
              cloudinaryError
            );
            // Continue even if Cloudinary deletion fails
          }
        }
      }
    }

    // Delete from database
    await MOCRiskAssessment.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: "Upload deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Risk Assessment delete error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete upload",
      },
      { status: 500 }
    );
  }
}

