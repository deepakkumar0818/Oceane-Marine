import { Suspense } from "react";
import QhseSidebar from "../../../components/QhseSidebar";
import SideBarSkeleton from "../../../components/SideBarSkeleton";
import PoacCrossCompetencyListPage from "./PoacCrossCompetencyListPage";

export default function PoacCrossCompetencyListPageWrapper() {
  return (
    <div className="min-h-screen bg-transparent text-white flex">
      {/* Sidebar */}
      <Suspense fallback={<SideBarSkeleton />}>
        <QhseSidebar />
      </Suspense>

      {/* Main content */}
      <Suspense
        fallback={
          <div className="flex-1 ml-72 flex items-center justify-center">
            <p className="text-white/60">
              Loading POAC cross competency list page…
            </p>
          </div>
        }
      >
        <PoacCrossCompetencyListPage />
      </Suspense>
    </div>
  );
}
