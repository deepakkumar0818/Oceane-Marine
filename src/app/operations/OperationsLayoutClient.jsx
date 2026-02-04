"use client";

import { OperationsLoadingProvider, useOperationsLoading } from "./OperationsLoadingContext";
import GoToDashBoardButton from "../components/GoToDashBoardButton";

function DashboardButtonWrapper({ offsetLeftPx }) {
  const { pageLoading } = useOperationsLoading();
  if (pageLoading) return null;
  return <GoToDashBoardButton offsetLeftPx={offsetLeftPx} />;
}

export default function OperationsLayoutClient({ children }) {
  return (
    <OperationsLoadingProvider>
      <div className="relative min-h-screen bg-transparent text-white pt-6">
        <DashboardButtonWrapper offsetLeftPx={316} />
        {children}
      </div>
    </OperationsLoadingProvider>
  );
}
