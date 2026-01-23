import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import StsOperation from "@/lib/mongodb/models/StsOperation";

export async function GET() {
  await connectDB();

  const list = await StsOperation.find({ isLatest: true }).sort({
    createdAt: -1,
  });

  return NextResponse.json(list);
}
