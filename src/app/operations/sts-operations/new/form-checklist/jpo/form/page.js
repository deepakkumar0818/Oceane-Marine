import { Suspense } from "react";
import QhseSidebar from "../../../../../../components/GoToDashBoardButton";
import SideBarSkeleton from "../../../../../../components/GoToDashBoardButton";
import JpoFormPage from "./JpoFormPage";

export default function JpoFormPageWrapper() {
  return (
    <div className="min-h-screen bg-transparent text-white flex">
      {/* Sidebar */}
      <Suspense fallback={<SideBarSkeleton />}>
        <QhseSidebar />
      </Suspense>

      {/* Main content - flex-1 min-w-0 so form occupies full space */}
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
          <JpoFormPage />
        </Suspense>
      </div>
    </div>
  );
}
