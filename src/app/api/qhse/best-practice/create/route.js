import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import BestPractice from "@/lib/mongodb/models/qhse-best-practices/BestPractice";

export async function POST(req) {
  await connectDB();

  try {
    const { description, eventDate } = await req.json();

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    if (!eventDate) {
      return NextResponse.json(
        { error: "Event date is required" },
        { status: 400 }
      );
    }

    const newBestPractice = await new BestPractice({
      description: description.trim(),
      eventDate,
      createdBy: req.user?.id || null,
    }).save();

    return NextResponse.json(
      {
        message: "Best practice created successfully",
        data: newBestPractice,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}