import { useTranslation } from 'react-i18next';
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { AskAiButton } from "@/components/ui/AskAiButton";
import { Disclaimer } from "@/components/ui/Disclaimer";
import sectorsData from "@/data/sectors.json";

export function SectorDetail() {
  const { t } = useTranslation();
  const { key } = useParams();
  const sector = sectorsData.sectors.find((s) => s.key === key);

  if (!sector) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        {t('sectorDetail.notFound')}<Link to="/sectors" className="text-primary">{t('sectorDetail.backToSectors')}</Link>
      </div>
    );
  }

  const aiContext =
    `板块：${sector.label}\n定位：${sector.tagline}\n产业链环节：` +
    (sector.nodes.length ? sector.nodes.join("、") : "（环节梳理中）");

  return (
    <div>
      <Link to="/sectors" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t('sectorDetail.backToSectors')}
      </Link>

      <PageHeader
        title={sector.label}
        subtitle={sector.tagline}
        actions={
          <AskAiButton
            context={aiContext}
            label={t('sectorDetail.aiLabel')}
            suggestions={[
              t('sectorDetail.suggestions.framework'),
              t('sectorDetail.suggestions.valueChain'),
              t('sectorDetail.suggestions.bottleneck'),
              t('sectorDetail.suggestions.risks')
            ]}
          />
        }
      />

      {sector.verified ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{t('sectorDetail.coreSegments', { count: sector.nodes.length })}</h3>
          <div className="flex flex-wrap gap-2.5">
            {sector.nodes.map((n) => (
              <span key={n} className="rounded-full border border-primary/40 bg-primary/15 px-3.5 py-1.5 text-sm font-medium text-foreground shadow-glow transition-colors hover:bg-primary/25">
                {n}
              </span>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Plus className="h-3.5 w-3.5" /> {t('sectorDetail.addWatchHint')}
          </p>
        </div>
      ) : (
        <GlassCard>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Wrench className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('sectorDetail.underVerificationDetail') }} />
            <p className="max-w-md text-xs text-muted-foreground/70">
              {t('sectorDetail.useAiHint')}
            </p>
          </div>
        </GlassCard>
      )}

      <Disclaimer />
    </div>
  );
}