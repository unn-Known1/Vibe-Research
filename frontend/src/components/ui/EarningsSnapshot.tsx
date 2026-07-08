// 财报速览：把最新财报 + 前向一致预期 + 估值分位，用「结论先行」的结构收拢成一张速览卡。
// 纯前端计算（数据都已在个股页 state 里）。合规：只客观机械分档陈述事实，不推荐、不预测、不评级。
// 「结论先行 + 信号标签」的排版纪律借鉴自 anthropics/financial-services 的 equity-research skill，
// 但剔除其评级/目标价，只保留 A 股客观指标。

import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import type { Valuation, Financials, ValPercentile } from "@/lib/api";

// 从含单位/符号的字符串里取数（"+15.2%" → 15.2；取不到 → null）。
const num = (s: string | number | null | undefined): number | null => {
  if (s == null) return null;
  const n = parseFloat(String(s).replace(/[^0-9.\-]/g, ""));
  return Number.isNaN(n) ? null : n;
};

// A股红涨绿跌：正=红 负=绿。
const yoyColor = (s: string | null | undefined) => {
  const n = num(s);
  return n == null ? "text-muted-foreground" : n > 0 ? "text-danger" : n < 0 ? "text-success" : "text-muted-foreground";
};

interface Props {
  val: Valuation;
  fin: Financials | null;
  pctl: ValPercentile | null;
}

export function EarningsSnapshot({ val, fin, pctl }: Props) {
  const { t } = useTranslation();
  if (!fin || (!fin.revenue && !fin.net_profit)) return null;

  const revYoy = num(fin.revenue_yoy);
  const npYoy = num(fin.net_profit_yoy);
  const roe = num(fin.roe);
  const pePctile = pctl?.metrics.pe_ttm?.percentile ?? null;

  // 信号标签（客观机械分档，不含买卖倾向）。
  const tags: string[] = [];
  if (revYoy != null) {
    const growthKey = revYoy >= 30
      ? t("components.earnings.revenueHighGrowth")
      : revYoy >= 0
        ? t("components.earnings.revenuePositiveGrowth")
        : t("components.earnings.revenueDecline");
    tags.push(growthKey);
  }
  if (revYoy != null && npYoy != null) {
    tags.push(npYoy >= revYoy
      ? t("components.earnings.profitFasterThanRevenue")
      : t("components.earnings.profitSlowerThanRevenue"));
  }
  if (roe != null) {
    const roeKey = roe >= 15
      ? t("components.earnings.highRoe", { value: roe })
      : roe >= 8
        ? t("components.earnings.midRoe", { value: roe })
        : t("components.earnings.lowRoe", { value: roe });
    tags.push(roeKey);
  }
  if (pePctile != null) {
    const peKey = pePctile < 30
      ? t("components.earnings.peLow", { value: Math.round(pePctile) })
      : pePctile <= 70
        ? t("components.earnings.peMid", { value: Math.round(pePctile) })
        : t("components.earnings.peHigh", { value: Math.round(pePctile) });
    tags.push(peKey);
  }
  if (val.peg != null) tags.push(`PEG ${val.peg}`);

  // 前向一致预期（有几项拼几项）。
  const fwd: string[] = [];
  if (val.eps_26e != null) fwd.push(`${t("stock.earningsSnapshot.title")} 26E EPS ${val.eps_26e}`);
  if (val.pe_26e != null) fwd.push(`${t("stock.valuation.forwardPe")} ${val.pe_26e}`);
  if (val.digest_years != null && val.digest_years > 0) fwd.push(`${t("stock.valuation.digestYears")} ${val.digest_years} years`);
  if (val.analyst_count > 0) fwd.push(`${t("stock.valuation.coveredBy", { count: val.analyst_count })}`);

  return (
    <GlassCard glow className="mb-4">
      <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
        <ClipboardList className="h-4 w-4 text-primary" /> {t("stock.earningsSnapshot.title")}
        {fin.period && <span className="text-xs font-normal text-muted-foreground/60">· {fin.period}</span>}
      </h3>
      <p className="mb-3 text-[11px] text-muted-foreground/60">
        {t("stock.earningsSnapshot.subtitle")}
      </p>

      {/* 结论先行：两大头条数字 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">{t("stock.earningsSnapshot.revenue")}</p>
          <p className="mt-0.5 font-mono text-lg font-bold">{fin.revenue ?? "—"}</p>
          {fin.revenue_yoy && <p className={cn("text-xs", yoyColor(fin.revenue_yoy))}>{t("stock.earningsSnapshot.yoyLabel")} {fin.revenue_yoy}</p>}
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">{t("stock.earningsSnapshot.netProfit")}</p>
          <p className="mt-0.5 font-mono text-lg font-bold">{fin.net_profit ?? "—"}</p>
          {fin.net_profit_yoy && <p className={cn("text-xs", yoyColor(fin.net_profit_yoy))}>{t("stock.earningsSnapshot.yoyLabel")} {fin.net_profit_yoy}</p>}
        </div>
      </div>

      {/* 信号标签（关键观察） */}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs text-primary">{tag}</span>
          ))}
        </div>
      )}

      {/* 前向一致预期 */}
      {fwd.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="text-muted-foreground/60">{t("stock.earningsSnapshot.forwardExpect")}</span>{fwd.join(" · ")}
        </p>
      )}
    </GlassCard>
  );
}
