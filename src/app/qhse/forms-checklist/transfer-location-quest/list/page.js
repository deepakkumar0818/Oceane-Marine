import { Suspense } from "react";
import QhseSidebar from "../../../components/QhseSidebar";
import SideBarSkeleton from "../../../components/SideBarSkeleton";
import TransferLocationQuestListPage from "./TransferLocationQuestListPage";

export default function TransferLocationQuestListPageWrapper() {
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
              Loading transfer location quest list page…
            </p>
          </div>
        }
      >
        <TransferLocationQuestListPage />
      </Suspense>
    </div>
  );
}
