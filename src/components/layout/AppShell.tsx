import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-haze-50">
      <div className="pointer-events-none absolute inset-0 bg-grid-lines opacity-40" />
      <div className="relative flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-6 pb-12 pt-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
