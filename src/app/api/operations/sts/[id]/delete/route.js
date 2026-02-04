import { NextResponse } from "next/server";
import StsOperation from "@/lib/mongodb/models/StsOperation";
import { connectDB } from "@/lib/config/connection";

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const userOperation = await StsOperation.findById(id);
    if (!userOperation) {
      return NextResponse.json(
        { error: "Operation not found" },
        { status: 404 }
      );
    }

    if (!userOperation.isLatest) {
      return NextResponse.json(
        { error: "Only latest version can be deleted" },
        { status: 403 }
      );
    }

    await StsOperation.deleteOne({
      parentOperationId: userOperation.parentOperationId,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
