import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import VendorSupplierApproval from "@/lib/mongodb/models/qhse-form-checklist/VendorSupplierApproval";

const isValidRating = (value) =>
  typeof value === "number" && value >= 1 && value <= 4;

const calculatePercentage = (values) => {
  const total = values.reduce((sum, v) => sum + v, 0);
  const max = values.length * 4;
  return Math.round((total / max) * 100);
};

export async function PUT(req, { params }) {
  await connectDB();

  try {
    const { id } = await params;
    const body = await req.json();
    const record = await VendorSupplierApproval.findById(id);

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Vendor approval record not found" },
        { status: 404 }
      );
    }

    // Only DRAFT records can be edited / submitted
    if (record.status !== "DRAFT") {
      return NextResponse.json(
        {
          success: false,
          error: "Only DRAFT records can be updated",
        },
        { status: 403 }
      );
    }

    // Update basic fields if provided
    if (body.vendorName) {
      record.vendorName = body.vendorName.trim();
    }
    if (body.vendorAddress) {
      record.vendorAddress = body.vendorAddress.trim();
    }
    if (body.date) {
      record.date = body.date;
    }
    if (body.year) {
      record.year = body.year;
    }
    if (body.requestedBy) {
      record.requestedBy = body.requestedBy.trim();
    }
    if (body.forAccountsSign) {
      record.forAccountsSign = body.forAccountsSign.trim();
    }

    // Ratings - merge and recalculate percentages
    const parts = body.supplyOfParts || record.supplyOfParts || {};
    const services = body.supplyOfServices || record.supplyOfServices || {};

    // Validate if ratings are provided
    const partsRatings = [
      parts.technicalComparison,
      parts.commercialComparison,
      parts.legalEntityForServiceOrSupply,
      parts.agreesToOceaneTerms,
      parts.infrastructureAndFacilities,
      parts.previousExperienceExpertise,
    ];

    if (partsRatings.some((v) => !isValidRating(v))) {
      return NextResponse.json(
        { success: false, error: "Invalid Supply of Parts ratings" },
        { status: 400 }
      );
    }

    const servicesRatings = [
      services.skilledManpowerAvailability,
      services.contractorCertifications,
      services.hseSystemDueDiligence,
      services.insuranceAndWorkPermit,
      services.previousExperienceYears,
    ];

    if (servicesRatings.some((v) => !isValidRating(v))) {
      return NextResponse.json(
        { success: false, error: "Invalid Supply of Services ratings" },
        { status: 400 }
      );
    }

    const partsPercentage = calculatePercentage(partsRatings);
    const servicesPercentage = calculatePercentage(servicesRatings);
    const overallPercentage = Math.round(
      (partsPercentage + servicesPercentage) / 2
    );

    record.supplyOfParts = {
      ...record.supplyOfParts,
      ...parts,
      percentageScore: partsPercentage,
    };

    record.supplyOfServices = {
      ...record.supplyOfServices,
      ...services,
      percentageScore: servicesPercentage,
    };

    record.overallPercentageScore = overallPercentage;
    record.approvedVendorEligible = overallPercentage >= 80;

    // Update status: either stay DRAFT or move to UNDER_REVIEW
    if (body.status) {
      record.status = body.status;
    }

    await record.save();

    return NextResponse.json(
      {
        success: true,
        data: record,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Vendor Supplier Approval Update Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


