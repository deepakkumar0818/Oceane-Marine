import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import DeclarationOfSea from "@/lib/mongodb/models/operation-sts-checklist/DeclarationOfSea";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");

    // Build query
    const query = {};
    
    // Filter by year if provided (using issueDate)
    if (year) {
      const yearNum = Number.parseInt(year, 10);
      if (!Number.isNaN(yearNum)) {
        const startDate = new Date(`${yearNum}-01-01T00:00:00.000Z`);
        const endDate = new Date(`${yearNum + 1}-01-01T00:00:00.000Z`);
        query.issueDate = {
          $gte: startDate,
          $lt: endDate,
        };
      }
    }

    const declarations = await DeclarationOfSea.find(query)
      .sort({ issueDate: -1, createdAt: -1 })
      .lean();

    // Get available years from all declarations
      const allDeclarations = await DeclarationOfSea.find({ issueDate: { $exists: true, $ne: null } })
      .select("issueDate")
      .lean();

    const yearsSet = new Set();
    allDeclarations.forEach((declaration) => {
      if (declaration.issueDate) {
        const declarationYear = new Date(declaration.issueDate).getFullYear();
        yearsSet.add(declarationYear);
      }
    });

    const years = Array.from(yearsSet).sort((a, b) => b - a);

    return NextResponse.json(
      {
        success: true,
        data: declarations,
        years: years.length > 0 ? years : [new Date().getFullYear()],
      },
      {
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  } catch (error) {
    console.error("Declaration of Sea list error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}

