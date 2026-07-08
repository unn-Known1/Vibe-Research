import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Activity, Radar, LayoutGrid, Wallet, Settings, Search, NotebookPen,
  Moon, Sun, ChevronsLeft, ChevronsRight, LineChart, Github, UserRound,
  Cog, Cpu, Database, Cable, Rocket, FlaskConical, Star, FileText,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useDarkMode } from "@/hooks/useDarkMode";
import { setLanguage } from "@/i18n";

const APP_VERSION = "v0.1.1";
const REPO_URL = "https://github.com/simonlin1212/Vibe-Research";
const SITE_URL = "https://www.simonlin.net";

const NAV_KEYS = [
  { to: "/daily-review", icon: Activity, key: "dailyReview" },
  { to: "/intel", icon: Radar, key: "intel" },
  { to: "/sectors", icon: LayoutGrid, key: "sectors" },
  { to: "/stock-data", icon: Search, key: "stockData" },
  { to: "/watchlist", icon: Star, key: "watchlist" },
  { to: "/portfolio", icon: Wallet, key: "portfolio" },
  { to: "/my-reports", icon: FileText, key: "myReports" },
  { to: "/notes", icon: NotebookPen, key: "notes" },
  { to: "/settings", icon: Settings, key: "settings" },
];

const SECTOR_KEYS = [
  { to: "/sectors/humanoid", icon: Cog, key: "humanoid" },
  { to: "/sectors/ai-computing", icon: Cpu, key: "aiComputing" },
  { to: "/sectors/hbm", icon: Database, key: "hbm" },
  { to: "/sectors/cpo", icon: Cable, key: "cpo" },
  { to: "/sectors/business-space", icon: Rocket, key: "businessSpace" },
  { to: "/sectors/ai-pharma", icon: FlaskConical, key: "aiPharma" },
];

export function Layout() {
  const { pathname } = useLocation();
  const { dark, toggle } = useDarkMode();
  const { t, i18n } = useTranslation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("vr-sidebar") === "collapsed");

  const isZh = i18n.language === "zh";
  const toggleLang = () => setLanguage(isZh ? "en" : "zh");

  useEffect(() => {
    localStorage.setItem("vr-sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className={cn(
        "glass z-10 m-2 flex shrink-0 flex-col rounded-2xl transition-all duration-200",
        collapsed ? "w-14" : "w-60",
      )}>
        {/* Brand */}
        <div className={cn("border-b border-border/50", collapsed ? "flex justify-center p-3" : "p-4")}>
          <Link to="/daily-review" className={cn("flex items-center", collapsed ? "justify-center" : "gap-2")}>
            <LineChart className="h-6 w-6 shrink-0 text-primary text-glow" />
            {!collapsed && (
              <span className="text-lg font-extrabold tracking-tight">
                Vibe-<span className="text-primary">Research</span>
              </span>
            )}
          </Link>
          {!collapsed && <p className="mt-1 text-[11px] text-muted-foreground">{t("sidebar.tagline")}</p>}
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 space-y-1 overflow-auto", collapsed ? "p-1.5" : "p-2.5")}>
          {NAV_KEYS.map(({ to, icon: Icon, key }) => {
            const active = pathname === to;
            const label = t(`sidebar.nav.${key}`);
            return (
              <div key={to}>
                <Link
                  to={to}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center rounded-lg text-sm transition-colors",
                    collapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2.5",
                    active
                      ? "bg-primary/15 font-medium text-primary shadow-glow"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && label}
                </Link>

                {to === "/sectors" && (
                  <div className={cn("mt-1 space-y-0.5", !collapsed && "ml-4 border-l border-border/40 pl-1.5")}>
                    {SECTOR_KEYS.map(({ to: st, icon: SIcon, key: skey }) => {
                      const sactive = pathname === st;
                      const slabel = t(`sidebar.sectors.${skey}`);
                      return (
                        <Link
                          key={st}
                          to={st}
                          title={collapsed ? slabel : undefined}
                          className={cn(
                            "flex items-center rounded-lg transition-colors",
                            collapsed ? "justify-center p-2" : "gap-2 px-2.5 py-1.5 text-[13px]",
                            sactive
                              ? "bg-primary/10 font-medium text-primary"
                              : "text-muted-foreground/80 hover:bg-muted/40 hover:text-foreground",
                          )}
                        >
                          <SIcon className="h-3.5 w-3.5 shrink-0" />
                          {!collapsed && slabel}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={cn("border-t border-border/50", collapsed ? "flex flex-col items-center gap-2 p-2" : "space-y-2 p-3")}>
          {collapsed ? (
            <>
              <button onClick={toggle} className="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground" title={dark ? t("sidebar.theme.light") : t("sidebar.theme.dark")}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button onClick={toggleLang} className="rounded p-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground" title={t("sidebar.lang.toggle")}>
                {isZh ? "EN" : "中"}
              </button>
              <a href={SITE_URL} target="_blank" rel="noreferrer" className="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground" title={t("sidebar.contact")}>
                <UserRound className="h-4 w-4" />
              </a>
              <button onClick={() => setCollapsed(false)} className="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground" title={t("sidebar.expand")}>
                <ChevronsRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <button onClick={toggle} className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                  {dark ? t("sidebar.theme.light") : t("sidebar.theme.dark")}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={toggleLang} className="rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground" title={t("sidebar.lang.toggle")}>
                    {isZh ? "EN" : "中文"}
                  </button>
                  <a href={SITE_URL} target="_blank" rel="noreferrer" className="text-muted-foreground transition-colors hover:text-foreground" title={t("sidebar.contact")}>
                    <UserRound className="h-3.5 w-3.5" />
                  </a>
                  <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-muted-foreground transition-colors hover:text-foreground" title="GitHub">
                    <Github className="h-3.5 w-3.5" />
                  </a>
                  <button onClick={() => setCollapsed(true)} className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground" title={t("sidebar.collapse")}>
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <a href={SITE_URL} target="_blank" rel="noreferrer" className="block text-[11px] text-primary/80 transition-colors hover:text-primary">
                {t("sidebar.contact")} · simonlin.net
              </a>
              <p className="text-[11px] leading-relaxed text-muted-foreground/60">
                {APP_VERSION} · {t("sidebar.disclaimer")}
              </p>
            </>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
