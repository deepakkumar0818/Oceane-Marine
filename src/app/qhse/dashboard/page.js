"use client";

import { Suspense } from "react";
import QhseDashboardContent from "./QhseDashboardContent";
import QhseSidebarWrapper from "../components/QhseSidebarWrapper";

export default function QhseDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-transparent text-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      }
    >
      <div className="min-h-screen bg-transparent text-white flex">
        <QhseSidebarWrapper />
        <div className="flex-1 ml-72 pr-4">
          <QhseDashboardContent />
        </div>
      </div>
    </Suspense>
  );
}

