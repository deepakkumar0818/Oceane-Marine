import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import STSDeclaration from "@/lib/mongodb/models/operation-sts-checklist/DeclarationOfSea";
import { getNextRevisionForCreate } from "../../revision";

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

    const revisionNo = await getNextRevisionForCreate(STSDeclaration);

    const newDeclaration = await STSDeclaration.create({
      ...body,
      revisionNo,
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

