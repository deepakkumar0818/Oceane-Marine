import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSDeclaration from "@/lib/mongodb/models/operation-sts-checklist/DeclarationOfSea";

function getNextVersion(latestVersion) {
  if (!latestVersion) return "1.0";
  return (parseFloat(latestVersion) + 0.1).toFixed(1);
}

export async function POST(req, { params }) {
  await connectDB();

  try {
    const { id } = params;
    const body = await req.json();

    // Get the existing declaration
    const existing = await STSDeclaration.findById(id).lean();

    if (!existing) {
      return NextResponse.json(
        { error: "Declaration not found" },
        { status: 404 }
      );
    }

    // Get the latest version for this formNo (if exists) or use existing version
    // We need to find the highest version number for this formNo
    let latest = null;
    if (existing.formNo) {
      // Find all records with the same formNo and get the one with highest version
      const allVersions = await STSDeclaration.find({
        formNo: existing.formNo,
      })
        .select("version")
        .lean()
        .sort({ createdAt: -1 });
      
      if (allVersions.length > 0) {
        // Get the version with highest numeric value
        latest = allVersions.reduce((prev, current) => {
          const prevVersion = parseFloat(prev.version || "0");
          const currentVersion = parseFloat(current.version || "0");
          return currentVersion > prevVersion ? current : prev;
        });
      }
    }

    // If no formNo or no other versions found, use the existing version
    const baseVersion = latest?.version || existing.version || "1.0";
    const nextVersion = getNextVersion(baseVersion);

    // Prepare new document data - preserve formNo and revisionNo (revisionNo doesn't change on edit)
    const newDeclarationData = {
      ...existing,
      ...body,
      version: nextVersion,
      status: body.status || existing.status || "Pending",
      // Preserve formNo if it exists, otherwise keep it undefined
      formNo: existing.formNo || body.formNo,
      // Preserve revisionNo - it should NOT change on edit (only version increments)
      revisionNo: existing.revisionNo || body.revisionNo,
    };

    // Remove MongoDB-specific fields to create a new document
    delete newDeclarationData._id;
    delete newDeclarationData.createdAt;
    delete newDeclarationData.updatedAt;
    delete newDeclarationData.__v;

    // Create a new entry with incremented version (this creates a NEW record)
    const updatedDeclaration = await STSDeclaration.create(newDeclarationData);

    return NextResponse.json({
      success: true,
      message: "Declaration updated successfully. New version created.",
      data: updatedDeclaration,
      version: nextVersion,
      previousVersion: baseVersion,
    });
  } catch (error) {
    console.error("Declaration of Sea update error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

