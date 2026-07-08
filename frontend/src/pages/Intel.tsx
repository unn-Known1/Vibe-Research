import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, FileText, Newspaper, Rss, RefreshCw, Loader2, ExternalLink, AlertCircle, Sparkles, Lightbulb, Star } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { SaveNoteButton } from "@/components/ui/SaveNoteButton";
import { api, ApiError, type RadarData, type Industry, type Announcement, type NewsItem } from "@/lib/api";
import { loadWatch } from "@/lib/watchlist";
import { hasLlm, chatStream } from "@/lib/llm";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "events", labelKey: "intel.tabs.events", icon: TrendingUp, integrated: false, descKey: "intel.tabs.eventsDesc" },
  { key: "filings", labelKey: "intel.tabs.filings", icon: FileText, integrated: false, descKey: "intel.tabs.filingsDesc" },
  { key: "news", labelKey: "intel.tabs.news", icon: Newspaper, integrated: false, descKey: "intel.tabs.newsDesc" },
  { key: "investment-news", labelKey: "intel.tabs.investmentNews", icon: Rss, integrated: true, descKey: "intel.tabs.investmentNewsDesc" },
];

interface Digest { loading?: boolean; text?: string; err?: string; needKey?: boolean }

function InvestmentNewsPanel() {
  const { t } = useTranslation();
  const [data, setData] = useState<RadarData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState("ai");
  const [refreshing, setRefreshing] = useState(false);
  const [digests, setDigests] = useState<Record<string, Digest>>({});
  const [bulk, setBulk] = useState<{ running: boolean; done: number; total: number }>({ running: false, done: 0, total: 0 });

  useEffect(() => {
    api.radar().then(setData).catch((e) => setErr(e instanceof ApiError ? e.message : t('intel.errors.loadFailed')));
  }, []);

  const refresh = async () => {
    setRefreshing(true); setErr(null);
    try { setData(await api.radarRefresh()); }
    catch (e) { setErr(e instanceof ApiError ? e.message : t('intel.errors.refreshFailed')); }
    finally { setRefreshing(false); }
  };

  const industries: Industry[] = data?.industries || [];
  const cur = industries.find((i) => i.key === active) || industries[0];
  const hasData = !!data?.generated_at;

  const genDigest = async (ind: Industry) => {
    if (!hasLlm()) { setDigests((d) => ({ ...d, [ind.key]: { needKey: true } })); return; }
    setDigests((d) => ({ ...d, [ind.key]: { loading: true } }));
    const ctx = ind.items.slice(0, 25).map((it) => `[${it.time}] ${it.source}｜${it.zh || it.title}`).join("\n");
    const prompt =
      `以下是「${ind.name}」赛道近期资讯。请提炼「今日要点」3-5 条：每条一句话（≤40 字），` +
      `只客观陈述重要事件 / 趋势，不推荐标的、不预测涨跌、不构成建议。直接用「- 」列点，不要多余前后缀。\n\n${ctx}`;
    try {
      let acc = "";
      await chatStream([{ role: "user", content: prompt }], `${ind.name}赛道资讯`, {
        onDelta: (t) => { acc += t; setDigests((d) => ({ ...d, [ind.key]: { text: acc } })); },
      });
    } catch (e) {
      setDigests((d) => ({ ...d, [ind.key]: { err: e instanceof ApiError ? e.message : t('intel.errors.generateFailed') } }));
    }
  };

  // 一键提炼全部赛道要点（串行，带进度；单赛道按需的按钮仍保留）
  const genAll = async () => {
    if (!hasLlm()) { if (cur) setDigests((d) => ({ ...d, [cur.key]: { needKey: true } })); return; }
    const targets = industries.filter((i) => i.items.length > 0);
    setBulk({ running: true, done: 0, total: targets.length });
    for (const ind of targets) {
      await genDigest(ind);
      setBulk((b) => ({ ...b, done: b.done + 1 }));
    }
    setBulk((b) => ({ ...b, running: false }));
  };

  const dg = cur ? digests[cur.key] : undefined;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {hasData ? t('intel.stats', { sources: data!.stats.total_sources, days: data!.recent_days, time: data!.generated_at }) : t('intel.statsFallback')}
        </span>
        <div className="flex items-center gap-2">
          {hasData && (
            <button onClick={genAll} disabled={bulk.running || refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-1.5 text-sm font-medium text-primary shadow-glow hover:bg-primary/25 disabled:opacity-50">
              {bulk.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {bulk.running ? t('intel.extracting', { done: bulk.done, total: bulk.total }) : t('intel.extractAll')}
            </button>
          )}
          <button onClick={refresh} disabled={refreshing || bulk.running}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {refreshing ? t('intel.fetching') : t('intel.refresh')}
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {err}
        </div>
      )}

      {!hasData && !err ? (
        <div className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground/70">
          <Trans i18nKey="intel.noNewsYet" components={{ b: <b className="text-foreground" /> }} />
        </div>
      ) : (
        <>
          {/* 赛道筛选 —— 暖橙边框 pill */}
          <div className="mb-4 flex flex-wrap gap-2">
            {industries.map((ind) => (
              <button key={ind.key} onClick={() => setActive(ind.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                  active === ind.key
                    ? "border-primary bg-primary/15 font-medium text-primary shadow-glow"
                    : "border-primary/25 text-muted-foreground hover:border-primary/60 hover:text-foreground",
                )}>
                <span className="h-2 w-2 rounded-full" style={{ background: ind.accent }} />
                {ind.name}<span className="text-muted-foreground/50">{ind.items.length}</span>
              </button>
            ))}
          </div>

          {cur && (
            <>
              {/* 今日要点总结框（暖橙框） */}
              <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                    <Lightbulb className="h-4 w-4" /> {t('intel.todayHighlights')} · {cur.name}
                  </span>
                  {(dg?.text || dg?.err || dg?.needKey) && (
                    <button onClick={() => genDigest(cur)} className="text-xs text-muted-foreground hover:text-primary">{t('intel.rerun')}</button>
                  )}
                </div>
                {dg?.loading ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('intel.aiReading')}</p>
                ) : dg?.text ? (
                  <>
                    <div className="prose prose-sm prose-invert max-w-none text-foreground"><ReactMarkdown remarkPlugins={[remarkGfm]}>{dg.text}</ReactMarkdown></div>
                    <div className="mt-2"><SaveNoteButton kind={t('intel.todayHighlights')} title={`${cur.name} ${t('intel.todayHighlights')}`} content={dg.text} /></div>
                  </>
                ) : dg?.needKey ? (
                  <p className="text-sm text-muted-foreground"><Trans i18nKey="intel.needKey" components={{ Link: <Link to="/settings" className="text-primary" /> }} /></p>
                ) : dg?.err ? (
                  <p className="text-sm text-destructive">{dg.err}</p>
                ) : (
                  <button onClick={() => genDigest(cur)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/25">
                    <Sparkles className="h-4 w-4" /> {t('intel.letAiExtract')}
                  </button>
                )}
              </div>

              {/* 资讯列表 */}
              <div className="space-y-2">
                {cur.items.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground/60">{t('intel.noRecentUpdates', { days: data!.recent_days })}</p>
                ) : (
                  cur.items.map((it, i) => (
                    <a key={`${it.source}-${it.time}-${i}`} href={it.url} target="_blank" rel="noreferrer"
                      className="group flex items-baseline gap-3 border-b border-border/30 pb-2 text-sm last:border-0">
                      <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground/70">{it.time}</span>
                      <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">{it.source}</span>
                      <span className="flex-1 group-hover:text-primary">{it.zh || it.title}</span>
                      <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/0 group-hover:text-primary/60" />
                    </a>
                  ))
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// 关注股公告 / 新闻聚合：从本地关注列表取代码，复用个股接口批量拉取、按时间倒序合并。
// 只做公开信息聚合，标的均为用户自己关注列表里的，不预置、不推荐。
interface FeedRow { code: string; name: string; when: string; title: string; meta?: string; url?: string }
const MAX_ROWS = 60;

function WatchlistFeed({ kind }: { kind: "filings" | "news" }) {
  const { t } = useTranslation();
  const [codes, setCodes] = useState<string[]>(loadWatch);
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [depNote, setDepNote] = useState<string | null>(null);

  const load = useCallback(async (cs: string[]) => {
    if (!cs.length) { setRows([]); return; }
    setLoading(true); setErr(null); setDepNote(null);
    try {
      // 股名（一次批量），失败则退回显示代码
      const nameOf: Record<string, string> = {};
      try {
        const quotes = await api.quote(cs.join(","));
        for (const c of cs) if (quotes[c]?.name) nameOf[c] = quotes[c].name;
      } catch { /* 忽略：无股名不影响公告/新闻 */ }

      const out: FeedRow[] = [];
      if (kind === "filings") {
        const res = await Promise.all(
          cs.map((c) => api.announcements(c).then((a) => ({ c, a })).catch(() => ({ c, a: [] as Announcement[] }))),
        );
        for (const { c, a } of res)
          for (const x of a)
            out.push({ code: c, name: nameOf[c] || c, when: x.date, title: x.title.replace(/^[^:：]*[:：]/, ""), meta: x.type, url: x.url });
      } else {
        let dep: string | null = null;
        const res = await Promise.all(
          cs.map((c) =>
            api.news(c).then((n) => ({ c, n })).catch((e) => {
              if (e instanceof ApiError && e.status === 501) dep = e.message;
              return { c, n: [] as NewsItem[] };
            }),
          ),
        );
        for (const { c, n } of res)
          for (const x of n)
            out.push({ code: c, name: nameOf[c] || c, when: x.发布时间 || "", title: x.新闻标题 || "", url: x.新闻链接 });
        if (dep && out.length === 0) setDepNote(dep);
      }
      // 按真实时间倒序：多新闻源的时间字符串格式不统一（有无秒/斜杠日期），字典序会排乱
      const ts = (s: string) => {
        const raw = (s || "").trim();
        let t = Date.parse(raw);
        if (Number.isNaN(t)) t = Date.parse(raw.replace(" ", "T"));
        return Number.isNaN(t) ? 0 : t;
      };
      out.sort((p, q) => ts(q.when) - ts(p.when));
      setRows(out.slice(0, MAX_ROWS));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t('intel.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => { const cs = loadWatch(); setCodes(cs); load(cs); }, [load]);

  const refresh = () => { const cs = loadWatch(); setCodes(cs); load(cs); };

  if (!codes.length) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground/70">
        <Trans i18nKey="intel.watchlistEmpty" components={{ Link: <Link to="/daily-review" className="text-primary" /> }} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 text-primary/70" /> {t('intel.watchlistFeed', { count: codes.length, total: rows.length, type: kind === "filings" ? "filings" : "news" })}
        </span>
        <button onClick={refresh} disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? t('intel.fetching') : t('intel.refresh')}
        </button>
      </div>

      {err && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {err}
        </div>
      )}

      {depNote ? (
        <p className="py-6 text-center text-xs text-warning">{depNote} {t('intel.needPlugin')}</p>
      ) : loading && rows.length === 0 ? (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {t('intel.fetchingFeed', { type: kind === "filings" ? "filings" : "news" })}</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground/60">{t('intel.noRecentFilings', { type: kind === "filings" ? "filings" : "news" })}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <a key={`${r.code}-${r.when}-${i}`} href={r.url || undefined} target={r.url ? "_blank" : undefined} rel="noreferrer"
              className={cn("group flex items-baseline gap-3 border-b border-border/30 pb-2 text-sm last:border-0", r.url && "cursor-pointer")}>
              <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground/70">{(r.when || "").slice(kind === "filings" ? 0 : 5, kind === "filings" ? 10 : 16)}</span>
              <span className="w-16 shrink-0 truncate text-xs text-primary/90" title={r.code}>{r.name}</span>
              {kind === "filings" && r.meta && <span className="hidden w-20 shrink-0 truncate text-xs text-muted-foreground sm:block">{r.meta}</span>}
              <span className="flex-1 group-hover:text-primary">{r.title}</span>
              {r.url && <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/0 group-hover:text-primary/60" />}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function Intel() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("investment-news");
  const cur = TABS.find((tabItem) => tabItem.key === tab)!;

  return (
    <div>
      <PageHeader title={t('intel.title')} subtitle={t('intel.subtitle')} />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(({ key, labelKey, icon: Icon, integrated }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
              tab === key ? "bg-primary/15 font-medium text-primary shadow-glow" : "text-muted-foreground hover:bg-muted/50")}>
            <Icon className="h-4 w-4" /> {t(labelKey)}
            {integrated && <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-medium text-primary">{t('intel.tabs.integrated')}</span>}
          </button>
        ))}
      </div>

      <GlassCard glow>
        <div className="mb-3 flex items-center gap-2">
          <cur.icon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{t(cur.labelKey)}</h3>
          {cur.integrated && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">investment-news</span>}
        </div>
        {cur.key === "investment-news" ? (
          <InvestmentNewsPanel />
        ) : cur.key === "filings" ? (
          <WatchlistFeed kind="filings" />
        ) : cur.key === "news" ? (
          <WatchlistFeed kind="news" />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{t(cur.descKey)}</p>
            <div className="mt-4 rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground/70">{t('intel.dataSourceComingSoon')}</div>
          </>
        )}
      </GlassCard>

      <p className="mt-3 text-[11px] text-muted-foreground/60">
        {t('intel.disclaimer')}
      </p>
      <Disclaimer />
    </div>
  );
}
