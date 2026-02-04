import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSDeclaration from "@/lib/mongodb/models/operation-sts-checklist/DeclarationOfSea";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req) {
  await connectDB();

  try {
    const body = await req.json();

    // Validate required fields
    if (!body.shipOperationType) {
      return NextResponse.json(
        { error: "shipOperationType is required" },
        { 
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" }
        }
      );
    }

    // Auto-generate revision number (sequential: 1, 2, 3, ...)
    // Find all declarations with revision numbers and get the maximum
    const allDeclarations = await STSDeclaration.find({
      revisionNo: { $exists: true, $ne: null, $ne: "" }
    })
      .select("revisionNo")
      .lean();

    let maxRevision = 0;
    
    // Find the maximum numeric revision number
    allDeclarations.forEach((decl) => {
      const revNum = parseInt(decl.revisionNo, 10);
      if (!isNaN(revNum) && revNum > maxRevision) {
        maxRevision = revNum;
      }
    });

    // Next revision number is max + 1, or 1 if no declarations exist
    const nextRevisionNo = String(maxRevision + 1);

    // Create new declaration with auto-generated revision number
    const newDeclaration = await STSDeclaration.create({
      ...body,
      revisionNo: body.revisionNo || nextRevisionNo, // Use provided or auto-generated
      version: body.version || "1.0",
      status: body.status || "Pending",
    });

    return NextResponse.json(
      {
        message: "Declaration of Sea created successfully",
        data: newDeclaration,
        revisionNo: newDeclaration.revisionNo,
      },
      {
        status: 201,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (error) {
    console.error("Declaration of Sea create error:", error);
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}

