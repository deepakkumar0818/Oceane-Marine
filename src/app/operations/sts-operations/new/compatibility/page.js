"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const sidebarTabs = [
  { key: "documentation", label: "Documentation", href: "/operations/sts-operations/new" },
  { key: "compatibility", label: "Compatibility", href: "/operations/sts-operations/new/compatibility" },
  { key: "hose-transfer", label: "Hose transfer record", href: "#" },
  { key: "forms", label: "Forms and checklist", href: "#" },
  { key: "ports", label: "Ports and Terminals", href: "#" },
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
  const sidebarRef = useRef(null);
  const pathname = usePathname();
  const panel = panels[active];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen]);

  const activeTab = sidebarTabs.find(tab => pathname === tab.href)?.key || "compatibility";

  return (
    <div className="min-h-screen bg-transparent text-white flex">
      {/* Left Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full bg-slate-900/98 border-r border-white/20 shadow-2xl backdrop-blur-md z-50 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "280px" }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">Navigation</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition"
              aria-label="Close sidebar"
            >
              <span className="text-white text-lg">×</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {sidebarTabs.map((tab) => (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                    activeTab === tab.key
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40"
                      : "text-white/90 hover:bg-white/10 hover:text-white border border-white/5"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition border border-white/10 shadow-lg"
          aria-label="Open sidebar"
        >
          <span className="text-white text-xl">☰</span>
        </button>
      )}

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"}`}>
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

