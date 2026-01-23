import { NextResponse } from "next/server";
import { connectDB } from "@/lib/config/connection";
import VendorApproval from "@/lib/mongodb/models/qhse-form-checklist/VendorSupplierApproval";

const isValidRating = (value) =>
  typeof value === "number" && value >= 1 && value <= 4;

const calculatePercentage = (values) => {
  const total = values.reduce((sum, v) => sum + v, 0);
  const max = values.length * 4;
  return Math.round((total / max) * 100);
};

export async function POST(req) {
  await connectDB();

  try {
    const body = await req.json();
    if (
      !body.vendorName ||
      !body.vendorAddress ||
      !body.date ||
      !body.year ||
      !body.requestedBy ||
      !body.forAccountsSign
    ) {
      return NextResponse.json(
        { error: "Missing required basic fields" },
        { status: 400 }
      );
    }

    const parts = body.supplyOfParts;
    if (
      !parts ||
      !isValidRating(parts.technicalComparison) ||
      !isValidRating(parts.commercialComparison) ||
      !isValidRating(parts.legalEntityForServiceOrSupply) ||
      !isValidRating(parts.agreesToOceaneTerms) ||
      !isValidRating(parts.infrastructureAndFacilities) ||
      !isValidRating(parts.previousExperienceExpertise)
    ) {
      return NextResponse.json(
        { error: "Invalid or missing Supply of Parts ratings" },
        { status: 400 }
      );
    }

    const partsPercentage = calculatePercentage([
      parts.technicalComparison,
      parts.commercialComparison,
      parts.legalEntityForServiceOrSupply,
      parts.agreesToOceaneTerms,
      parts.infrastructureAndFacilities,
      parts.previousExperienceExpertise,
    ]);

    const services = body.supplyOfServices;
    if (
      !services ||
      !isValidRating(services.skilledManpowerAvailability) ||
      !isValidRating(services.contractorCertifications) ||
      !isValidRating(services.hseSystemDueDiligence) ||
      !isValidRating(services.insuranceAndWorkPermit) ||
      !isValidRating(services.previousExperienceYears)
    ) {
      return NextResponse.json(
        { error: "Invalid or missing Supply of Services ratings" },
        { status: 400 }
      );
    }

    const servicesPercentage = calculatePercentage([
      services.skilledManpowerAvailability,
      services.contractorCertifications,
      services.hseSystemDueDiligence,
      services.insuranceAndWorkPermit,
      services.previousExperienceYears,
    ]);

    const overallPercentage = Math.round(
      (partsPercentage + servicesPercentage) / 2
    );

    const approvedVendorEligible = overallPercentage >= 80;

    const record = await VendorApproval.create({
      vendorName: body.vendorName,
      vendorAddress: body.vendorAddress,
      date: body.date,
      year: body.year,

      supplyOfParts: {
        ...parts,
        percentageScore: partsPercentage,
      },

      supplyOfServices: {
        ...services,
        percentageScore: servicesPercentage,
      },

      overallPercentageScore: overallPercentage,
      approvedVendorEligible,

      requestedBy: body.requestedBy,
      forAccountsSign: body.forAccountsSign,

      status: body.status,
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error("Create Vendor Approval Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
