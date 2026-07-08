import { useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Plus, X, RefreshCw, Star } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { AskAiButton } from "@/components/ui/AskAiButton";
import { api, type Quote } from "@/lib/api";
import { loadWatch, saveWatch, addCodes } from "@/lib/watchlist";
import { cn } from "@/lib/utils";

// A 股红涨绿跌（与整个看板一致）。
const color = (v: number | undefined) =>
  v == null ? "text-muted-foreground" : v > 0 ? "text-danger" : v < 0 ? "text-success" : "text-muted-foreground";
const pct = (v: number | undefined) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v}%`);

export function Watchlist() {
  const { t } = useTranslation();
  const [codes, setCodes] = useState<string[]>(loadWatch);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const refresh = (cs: string[]) => {
    if (!cs.length) { setQuotes({}); return; }
    setLoading(true);
    api.quote(cs.join(",")).then(setQuotes).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { refresh(loadWatch()); }, []);

  const add = () => {
    const { next, added } = addCodes(codes, input);
    if (added === 0) {
      setHint(input.trim() ? t('watchlist.noNewCode') : null);
      setInput("");
      return;
    }
    setCodes(next); saveWatch(next); setInput(""); setHint(t('watchlist.addedCount', { count: added }));
    refresh(next);
  };
  const remove = (c: string) => {
    const next = codes.filter((x) => x !== c);
    setCodes(next); saveWatch(next); refresh(next);
  };

  const aiContext = useMemo(
    () =>
      codes.length
        ? "我的自选股（本地）：\n" +
          codes
            .map((c) => {
              const q = quotes[c];
              return q
                ? `${q.name}(${c}) 现价${q.price} ${pct(q.change_pct)} PE(TTM)${q.pe_ttm ?? "—"} 换手${q.turnover_pct ?? "—"}%`
                : `${c}（行情未取到）`;
            })
            .join("\n")
        : "还没有自选股。",
    [codes, quotes],
  );

  return (
    <div>
      <PageHeader
        title={t('watchlist.title')}
        subtitle={t('watchlist.subtitle')}
        actions={
          codes.length > 0 && (
            <AskAiButton
              context={aiContext}
              label={t('watchlist.askAiLabel')}
              suggestions={[t('watchlist.suggestions.valuation'), t('watchlist.suggestions.group'), t('watchlist.suggestions.risks')]}
            />
          )
        }
      />

      <GlassCard className="mb-4">
        <label className="mb-1.5 block text-xs text-muted-foreground">
          {t('watchlist.addHint')}
        </label>
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add();
            }}
            rows={2}
            placeholder={t('watchlist.addPlaceholder')}
            className="flex-1 resize-y rounded-lg border border-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
          <button
            onClick={add}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-lg bg-primary/15 px-4 text-sm font-medium text-primary shadow-glow hover:bg-primary/25"
          >
            <Plus className="h-4 w-4" /> {t('watchlist.add')}
          </button>
        </div>
        {hint && <p className="mt-2 text-xs text-muted-foreground/70">{hint}</p>}
      </GlassCard>

      <GlassCard glow>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 font-semibold">
            <Star className="h-4 w-4 text-primary" /> {t('watchlist.overview.title')}
            <span className="text-xs font-normal text-muted-foreground">（{codes.length}）</span>
          </h3>
          <button
            onClick={() => refresh(codes)}
            disabled={loading}
            className="text-muted-foreground hover:text-primary"
            title={t('common.buttons.refresh')}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>
        {codes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground/60">
            {t('watchlist.overview.emptyHint')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                  {[t('watchlist.overview.name'), t('watchlist.overview.code'), t('watchlist.overview.price'), t('watchlist.overview.changePct'), t('watchlist.overview.peTtm'), t('watchlist.overview.pb'), t('watchlist.overview.turnoverPct'), ""].map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => {
                  const q = quotes[c];
                  return (
                    <tr key={c} className="border-b border-border/30">
                      <td className="px-2 py-2.5 font-medium">{q?.name || "—"}</td>
                      <td className="px-2 py-2.5 font-mono text-xs text-muted-foreground">{c}</td>
                      <td className={cn("px-2 py-2.5 font-mono", color(q?.change_pct))}>{q ? q.price : "—"}</td>
                      <td className={cn("px-2 py-2.5 font-mono", color(q?.change_pct))}>{q ? pct(q.change_pct) : "—"}</td>
                      <td className="px-2 py-2.5 font-mono text-muted-foreground">{q?.pe_ttm ?? "—"}</td>
                      <td className="px-2 py-2.5 font-mono text-muted-foreground">{q?.pb ?? "—"}</td>
                      <td className="px-2 py-2.5 font-mono text-muted-foreground">{q?.turnover_pct ?? "—"}</td>
                      <td className="px-2 py-2.5">
                        <button
                          onClick={() => remove(c)}
                          className="text-muted-foreground/50 hover:text-destructive"
                          title={t('watchlist.overview.remove')}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Disclaimer />
    </div>
  );
}
