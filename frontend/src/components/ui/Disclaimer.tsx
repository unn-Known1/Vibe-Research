import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";

// 中立免责条 —— 产品定调：只客观呈现公开数据/榜单，不推荐、不预测、无倾向；方向由用户自己的 AI 给出。
export function Disclaimer({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  if (compact) {
    return (
      <p className="text-[11px] leading-relaxed text-muted-foreground/70">
        {t("components.disclaimer.compact")}
      </p>
    );
  }
  return (
    <div className="mt-8 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        {t("components.disclaimer.full")}
      </span>
    </div>
  );
}
