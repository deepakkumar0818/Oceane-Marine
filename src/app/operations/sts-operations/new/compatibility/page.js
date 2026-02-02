"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const sidebarTabs = [
  { key: "documentation", label: "Documentation", href: "/operations/sts-operations/new" },
  { key: "compatibility", label: "Compatibility", href: "/operations/sts-operations/new/compatibility" },
  {
    key: "forms",
    label: "Forms and checklist",
    submodules: [
      {
        key: "sts-checklist",
        label: "STS Checklist",
        href: "/operations/sts-operations/new/form-checklist/sts-checklist/form",
      },
      {
        key: "jpo",
        label: "JPO",
        href: "/operations/sts-operations/new/form-checklist/jpo/form",
      },
      {
        key: "quotation",
        label: "Quotation",
        href: "/operations/sts-operations/new/form-checklist/quotations/form",
      },
      {
        key: "inspection-checklist",
        label: "Inspection Checklist",
        href: "/operations/sts-operations/new/form-checklist/inspection-checklist/form",
      },
      {
        key: "manual",
        label: "Manual",
        href: "/operations/sts-operations/new/form-checklist/manual/form",
      },
    ],
  },
  { key: "cargos", label: "Cargo types", href: "/operations/sts-operations/new/cargos" },
  { key: "locations", label: "Locations", href: "/operations/sts-operations/new/locations" },
  { key: "mooring", label: "Mooring masters", href: "/operations/sts-operations/new/mooringmaster" },
];

const panels = {
  hose: {
    title: "Hose Calculation",
    items: [
      "Hose type selection",
      "Diameter and pressure placeholders",
      "Environmental factors",
      "Connection checklist",
    ],
  },
  fender: {
    title: "Fender Calculation",
    items: [
      "Vessel particulars placeholder",
      "Energy absorption inputs",
      "Standoff distances",
      "Fender arrangement checklist",
    ],
  },
};

export default function CompatibilityPage() {
  const [active, setActive] = useState("hose");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("compatibility");
  const [expandedModules, setExpandedModules] = useState(new Set());
  const sidebarRef = useRef(null);
  const pathname = usePathname();
  const panel = panels[active];

  useEffect(() => {
    if (pathname === "/operations/sts-operations/new") {
      setActiveTab("documentation");
    } else if (pathname.startsWith("/operations/sts-operations/new/compatibility")) {
      setActiveTab("compatibility");
    } else if (pathname.startsWith("/operations/sts-operations/new/form-checklist")) {
      setActiveTab("forms");
      setExpandedModules((prev) => new Set([...prev, "forms"]));
    } else if (pathname.startsWith("/operations/sts-operations/new/locations")) {
      setActiveTab("locations");
    } else if (pathname.startsWith("/operations/sts-operations/new/cargos")) {
      setActiveTab("cargos");
    } else if (pathname.startsWith("/operations/sts-operations/new/mooringmaster")) {
      setActiveTab("mooring");
    }
  }, [pathname]);

  // Removed click-outside-to-close behavior - sidebar only closes on "x" button click


  return (
    <div className="min-h-screen bg-transparent text-white flex">
      {/* Left Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-white/20 shadow-2xl backdrop-blur-md z-50 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "300px" }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-orange-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                <span className="text-white text-xl">⚡</span>
              </div>
              <h2 className="text-lg font-bold text-white">Operations Modules</h2>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition hover:scale-110"
              aria-label="Close sidebar"
            >
              <span className="text-white text-lg">×</span>
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:rgba(255,255,255,0.2)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent transition-all duration-200">
            <div className="space-y-1.5">
              {sidebarTabs.map((tab) => (
                <div key={tab.key} className="space-y-1">
                  {tab.submodules ? (
                    <>
                      <button
                        onClick={() => {
                          setExpandedModules((prev) => {
                            const newSet = new Set(prev);
                            if (newSet.has(tab.key)) {
                              newSet.delete(tab.key);
                            } else {
                              newSet.add(tab.key);
                            }
                            return newSet;
                          });
                        }}
                        className={`group flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                          activeTab === tab.key
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40 scale-[1.02]"
                            : "text-white/90 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10 hover:scale-[1.01]"
                        }`}
                      >
                        <span className="flex-1">{tab.label}</span>
                        <span
                          className={`text-sm transition-transform ${
                            expandedModules.has(tab.key) ? "rotate-90" : ""
                          }`}
                        >
                          ▶
                        </span>
                        {activeTab === tab.key && (
                          <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                        )}
                      </button>
                      {expandedModules.has(tab.key) && (
                        <div className="ml-4 space-y-1 mt-1.5 pl-4 border-l-2 border-orange-500/30">
                          {tab.submodules.map((submodule) => {
                            const isActiveSub =
                              pathname.startsWith(submodule.href.split("/form")[0]) ||
                              pathname.startsWith(submodule.href.split("/list")[0]);
                            return (
                              <Link
                                key={submodule.key}
                                href={submodule.href}
                                className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
                                  isActiveSub
                                    ? "bg-white/20 text-white border-orange-400/50 shadow-md"
                                    : "text-white/80 hover:bg-white/10 hover:text-white border-white/5 hover:border-white/10"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="text-xs">▸</span>
                                  {submodule.label}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={tab.href}
                      className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                        activeTab === tab.key
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40 scale-[1.02]"
                          : "text-white/90 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10 hover:scale-[1.01]"
                      }`}
                    >
                      <span className="flex-1">{tab.label}</span>
                      {activeTab === tab.key && (
                        <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                      )}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-slate-800/50">
            <p className="text-[10px] text-slate-400 text-center">
              Operations Management System
            </p>
          </div>
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition border border-orange-400/30 shadow-lg shadow-orange-500/30 hover:scale-110"
          aria-label="Open sidebar"
        >
          <span className="text-white text-xl">☰</span>
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 ml-0 md:ml-72">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-sky-300">
                Compatibility
              </p>
              <h1 className="text-2xl font-bold">
                Hose & Fender Calculation (UI only)
              </h1>
            </div>
          </header>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-2xl">
          <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            {[
              { key: "hose", label: "Hose Calculation" },
              { key: "fender", label: "Fender Calculation" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active === tab.key
                    ? "bg-orange-500 text-white shadow shadow-orange-500/30"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{panel.title}</h2>
            <p className="text-sm text-slate-200">
              Placeholder UI for {panel.title.toLowerCase()}. Replace with real
              calculators when data is ready.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {panel.items.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/80"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

