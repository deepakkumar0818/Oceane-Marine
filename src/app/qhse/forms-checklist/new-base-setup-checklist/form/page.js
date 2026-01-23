import { Suspense } from "react";
import QhseSidebar from "../../../components/QhseSidebar";
import SideBarSkeleton from "../../../components/SideBarSkeleton";
import NewBaseSetupChecklistFormPage from "./NewBaseSetupChecklistFormPage";

export default function NewBaseSetupChecklistFormPageWrapper() {
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
              Loading new base setup checklist form page…
            </p>
          </div>
        }
      >
        <NewBaseSetupChecklistFormPage />
      </Suspense>
    </div>
  );
}
