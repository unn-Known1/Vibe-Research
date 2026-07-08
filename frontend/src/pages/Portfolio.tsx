import { useState, useEffect, useCallback } from "react";
import { Plus, ShieldCheck, RefreshCw, Loader2, Trash2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { AskAiButton } from "@/components/ui/AskAiButton";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { api, ApiError, type PortfolioData } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const REFRESH_MS = 30 * 60 * 1000;
const pnlColor = (v: number) => (v > 0 ? "text-danger" : v < 0 ? "text-success" : "text-muted-foreground");
const fmt = (v: number) => v.toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 2 });

export function Portfolio() {
  const { t } = useTranslation();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [code, setCode] = useState("");
  const [shares, setShares] = useState("");
  const [cost, setCost] = useState("");
  const [adding, setAdding] = useState(false);
  const [cCode, setCCode] = useState("");
  const [cDate, setCDate] = useState("");
  const [cPrice, setCPrice] = useState("");
  const [cShares, setCShares] = useState("");
  const [cCost, setCCost] = useState("");
  const [closing, setClosing] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      setData(manual ? await api.refreshPortfolio() : await api.portfolio());
      setErr(null);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t('portfolio.errors.loadFailed'));
    } finally {
      if (manual) setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const add = async () => {
    if (!/^\d{6}$/.test(code.trim())) { setErr(t('portfolio.errors.invalidCode')); return; }
    const s = parseFloat(shares), c = parseFloat(cost);
    if (!(s > 0) || !Number.isFinite(c)) { setErr(t('portfolio.errors.invalidShares')); return; }
    setAdding(true); setErr(null);
    try {
      setData(await api.addHolding(code.trim(), s, c));
      setCode(""); setShares(""); setCost("");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t('portfolio.errors.addFailed'));
    } finally {
      setAdding(false);
    }
  };

  const remove = async (c: string) => {
    try { setData(await api.removeHolding(c)); } catch { /* ignore */ }
  };

  const addClose = async () => {
    if (!/^\d{6}$/.test(cCode.trim())) { setErr(t('portfolio.addClose.errors.invalidCode')); return; }
    const p = parseFloat(cPrice), s = parseFloat(cShares), c = parseFloat(cCost);
    if (!cDate) { setErr(t('portfolio.addClose.errors.selectDate')); return; }
    if (!(p > 0) || !(s > 0) || !Number.isFinite(c)) { setErr(t('portfolio.addClose.errors.invalidValues')); return; }
    setClosing(true); setErr(null);
    try {
      setData(await api.closePosition(cCode.trim(), cDate, p, s, c));
      setCCode(""); setCDate(""); setCPrice(""); setCShares(""); setCCost("");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t('portfolio.addClose.errors.addFailed'));
    } finally {
      setClosing(false);
    }
  };

  const removeClosed = async (i: number) => {
    try { setData(await api.removeClosed(i)); } catch { /* ignore */ }
  };

  const holdings = data?.holdings || [];
  const totals = data?.totals;
  const closed = data?.closed || [];

  const aiContext = totals
    ? `我的持仓（本地数据）：\n` + holdings.map((h) => `${h.name}(${h.code}) ${h.shares}股 成本${h.cost} 现价${h.price} 浮盈${h.pnl}(${h.pnl_pct}%)`).join("\n") +
      `\n汇总：市值${totals.market_value} 总浮盈${totals.pnl}(${totals.pnl_pct}%)`
    : "我的持仓：暂无记录。";

  return (
    <div>
      <PageHeader
        title={t('portfolio.title')}
        subtitle={t('portfolio.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            {holdings.length > 0 && (
              <AskAiButton context={aiContext} label={t('portfolio.askAiLabel')}
                suggestions={[t('portfolio.suggestions.concentration'), t('portfolio.suggestions.risks'), t('portfolio.suggestions.organize')]} />
            )}
            <button onClick={() => load(true)} disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {t('common.buttons.refresh')}
            </button>
          </div>
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-success/25 bg-success/5 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        <span dangerouslySetInnerHTML={{ __html: t('portfolio.securityNote') }} />
      </div>

      {/* 汇总 */}
      {totals && holdings.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: t('portfolio.summary.totalValue'), v: fmt(totals.market_value), c: "text-foreground" },
            { k: t('portfolio.summary.totalCost'), v: fmt(totals.cost), c: "text-foreground" },
            { k: t('portfolio.summary.floatingPnl'), v: (totals.pnl > 0 ? "+" : "") + fmt(totals.pnl), c: pnlColor(totals.pnl) },
            { k: t('portfolio.summary.pnlPct'), v: (totals.pnl_pct > 0 ? "+" : "") + totals.pnl_pct + "%", c: pnlColor(totals.pnl) },
          ].map((m) => (
            <GlassCard key={m.k} className="p-3">
              <p className="text-xs text-muted-foreground">{m.k}</p>
              <p className={cn("mt-1 font-mono text-lg font-bold", m.c)}>{m.v}</p>
            </GlassCard>
          ))}
        </div>
      )}

      {/* 录入 */}
      <GlassCard className="mb-4">
        <h3 className="mb-3 text-sm font-semibold">{t('portfolio.addHolding.title')}</h3>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{t('portfolio.addHolding.stockCode')}</label>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder={t('portfolio.addHolding.codePlaceholder')}
              className="w-28 rounded-lg border border-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{t('portfolio.addHolding.shares')}</label>
            <input value={shares} onChange={(e) => setShares(e.target.value.replace(/[^\d.]/g, ""))} placeholder={t('portfolio.addHolding.sharesPlaceholder')}
              className="w-28 rounded-lg border border-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{t('portfolio.addHolding.costPrice')}</label>
            <input value={cost} onChange={(e) => setCost(e.target.value.replace(/[^\d.-]/g, "").replace(/(?!^)-/g, ""))} placeholder={t('portfolio.addHolding.costPlaceholder')}
              className="w-28 rounded-lg border border-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-primary/50" />
          </div>
          <button onClick={add} disabled={adding}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-4 py-2 text-sm font-medium text-primary shadow-glow hover:bg-primary/25 disabled:opacity-50">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('portfolio.addHolding.add')}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground/60">{t('portfolio.addHolding.sameCodeHint')}</p>
      </GlassCard>

      {err && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {err}
        </div>
      )}

      {/* 持仓表 */}
      <GlassCard glow>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">{t('portfolio.detail.title')}</h3>
          {data?.updated && <span className="text-xs text-muted-foreground/60">{t('portfolio.detail.updatedAt', { time: data.updated })}</span>}
        </div>
        {holdings.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground/60">{t('portfolio.detail.emptyHint')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  {[t('portfolio.detail.name'), t('portfolio.detail.price'), t('portfolio.detail.shares'), t('portfolio.detail.cost'), t('portfolio.detail.value'), t('portfolio.detail.pnl'), t('portfolio.detail.pnlPct'), ""].map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.code} className="border-b border-border/30">
                    <td className="px-2 py-2.5">
                      <span className="font-medium">{h.name}</span>
                      <span className="ml-1.5 font-mono text-xs text-muted-foreground/60">{h.code}</span>
                    </td>
                    <td className="px-2 py-2.5 font-mono">{fmt(h.price)}</td>
                    <td className="px-2 py-2.5 font-mono text-muted-foreground">{fmt(h.shares)}</td>
                    <td className="px-2 py-2.5 font-mono text-muted-foreground">{fmt(h.cost)}</td>
                    <td className="px-2 py-2.5 font-mono">{fmt(h.market_value)}</td>
                    <td className={cn("px-2 py-2.5 font-mono", pnlColor(h.pnl))}>{h.pnl > 0 ? "+" : ""}{fmt(h.pnl)}</td>
                    <td className={cn("px-2 py-2.5 font-mono", pnlColor(h.pnl))}>{h.pnl_pct > 0 ? "+" : ""}{h.pnl_pct}%</td>
                    <td className="px-2 py-2.5">
                      <button onClick={() => remove(h.code)} className="text-muted-foreground/50 hover:text-destructive" title={t('portfolio.detail.delete')}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* 清仓录入 */}
      <GlassCard className="mb-4 mt-6">
        <h3 className="mb-3 text-sm font-semibold">{t('portfolio.addClose.title')}</h3>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{t('portfolio.addClose.stockCode')}</label>
            <input value={cCode} onChange={(e) => setCCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder={t('portfolio.addClose.codePlaceholder')}
              className="w-24 rounded-lg border border-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{t('portfolio.addClose.closeDate')}</label>
            <input type="date" value={cDate} onChange={(e) => setCDate(e.target.value)}
              className="rounded-lg border border-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{t('portfolio.addClose.closePrice')}</label>
            <input value={cPrice} onChange={(e) => setCPrice(e.target.value.replace(/[^\d.]/g, ""))} placeholder={t('portfolio.addClose.pricePlaceholder')}
              className="w-24 rounded-lg border border-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{t('portfolio.addClose.shares')}</label>
            <input value={cShares} onChange={(e) => setCShares(e.target.value.replace(/[^\d.]/g, ""))} placeholder={t('portfolio.addClose.sharesPlaceholder')}
              className="w-24 rounded-lg border border-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">{t('portfolio.addClose.buyCost')}</label>
            <input value={cCost} onChange={(e) => setCCost(e.target.value.replace(/[^\d.-]/g, "").replace(/(?!^)-/g, ""))} placeholder={t('portfolio.addClose.costPlaceholder')}
              className="w-24 rounded-lg border border-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-primary/50" />
          </div>
          <button onClick={addClose} disabled={closing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-4 py-2 text-sm font-medium text-primary shadow-glow hover:bg-primary/25 disabled:opacity-50">
            {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('portfolio.addClose.record')}
          </button>
        </div>
      </GlassCard>

      {/* 已清仓列表 */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">{t('portfolio.closed.title')}</h3>
        {closed.length > 0 && data && (
          <span className="text-sm">
            {t('portfolio.closed.realizedPnlTotal')} <b className={cn("font-mono", pnlColor(data.realized_pnl))}>{data.realized_pnl > 0 ? "+" : ""}{fmt(data.realized_pnl)}</b>
          </span>
        )}
      </div>
      <GlassCard>
        {closed.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground/60">{t('portfolio.closed.emptyHint')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  {[t('portfolio.closed.name'), t('portfolio.closed.closeDate'), t('portfolio.closed.closePrice'), t('portfolio.closed.shares'), t('portfolio.closed.cost'), t('portfolio.closed.realizedPnl'), t('portfolio.closed.pnlPct'), ""].map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {closed.map((c, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="px-2 py-2.5">
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-1.5 font-mono text-xs text-muted-foreground/60">{c.code}</span>
                    </td>
                    <td className="px-2 py-2.5 font-mono text-muted-foreground">{c.date}</td>
                    <td className="px-2 py-2.5 font-mono">{fmt(c.price)}</td>
                    <td className="px-2 py-2.5 font-mono text-muted-foreground">{fmt(c.shares)}</td>
                    <td className="px-2 py-2.5 font-mono text-muted-foreground">{fmt(c.cost)}</td>
                    <td className={cn("px-2 py-2.5 font-mono", pnlColor(c.pnl))}>{c.pnl > 0 ? "+" : ""}{fmt(c.pnl)}</td>
                    <td className={cn("px-2 py-2.5 font-mono", pnlColor(c.pnl))}>{c.pnl_pct > 0 ? "+" : ""}{c.pnl_pct}%</td>
                    <td className="px-2 py-2.5">
                      <button onClick={() => removeClosed(i)} className="text-muted-foreground/50 hover:text-destructive" title={t('portfolio.closed.delete')}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Disclaimer />
    </div>
  );
}
