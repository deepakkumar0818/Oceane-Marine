import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import BestPractice from "@/lib/mongodb/models/qhse-best-practices/BestPractice";

export async function GET() {
  await connectDB();
  try {
    const bestPractices = await BestPractice.find().sort({ createdAt: -1 });
    return NextResponse.json({ bestPractices });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}