import { Suspense } from "react";
import QhseSidebar from "../../../../../../components/GoToDashBoardButton";
import SideBarSkeleton from "../../../../../../components/GoToDashBoardButton";
import InspectionChecklist from "./InspectionChecklistFormPage";

export default function InspectionChecklistFormPageWrapper() {
  return (
    <div className="min-h-screen bg-transparent text-white flex">
      {/* Sidebar */}
      <Suspense fallback={<SideBarSkeleton />}>
        <QhseSidebar />
      </Suspense>

      {/* Main content - flex-1 min-w-0 so form occupies full space (same as other forms) */}
      <div className="flex-1 min-w-0 flex">
        <Suspense
          fallback={
            <div className="flex-1 ml-72 flex items-center justify-center">
              <p className="text-white/60">
                Loading audit inspection planner form page…
              </p>
            </div>
          }
        >
          <InspectionChecklist />
        </Suspense>
      </div>
    </div>
  );
}
