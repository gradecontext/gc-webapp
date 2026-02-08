import Link from "next/link";
import { primaryNav, secondaryNav } from "./navigation";
import { cn } from "@/lib/utils";

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "hidden h-full w-72 flex-col gap-10 border-r border-white/70 bg-white/70 p-8 backdrop-blur-xl lg:flex",
        className
      )}
    >
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-300">
          ContextGrade
        </div>
        <p className="text-lg font-semibold text-ink-900">Decision intelligence HQ</p>
      </div>

      <div className="space-y-6">
        <p className="section-title">Core</p>
        <nav className="space-y-3">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-3 transition hover:border-haze-200 hover:bg-haze-100"
            >
              <div className="mt-1 rounded-xl bg-haze-100 p-2 text-ink-700 group-hover:bg-white">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">{item.label}</p>
                <p className="text-xs text-ink-300">{item.description}</p>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      <div className="space-y-6">
        <p className="section-title">Operations</p>
        <nav className="space-y-3">
          {secondaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-3 transition hover:border-haze-200 hover:bg-haze-100"
            >
              <div className="mt-1 rounded-xl bg-haze-100 p-2 text-ink-700 group-hover:bg-white">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">{item.label}</p>
                <p className="text-xs text-ink-300">{item.description}</p>
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
