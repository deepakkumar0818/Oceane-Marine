import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import NearMiss from "@/lib/mongodb/models/qhse-near-miss/NearMiss";

export async function GET() {
  await connectDB();
  try {
    const nearMisses = await NearMiss.find();
    return NextResponse.json({ nearMisses });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
