import { Outlet } from "react-router-dom";
import Navigation from "@/components/Navigation";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[hsl(0_0%_98%)]">
      <Navigation />

      <main className="page-wrapper max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
