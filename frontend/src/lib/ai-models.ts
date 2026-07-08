// 接入 AI 的模型清单（移植自 SDesign-opensource / open-design，按 Vibe-Research 适配）。
// 两类：
//   订阅版（provider "cli-*"）= 调本机已登录的 CLI，用订阅额度、免 API key（仅本地自托管可用）。
//   API 版 = 填自己的 key，走 OpenAI 兼容 /chat/completions。
// key 一律只存本地浏览器、随请求发给你自己的后端；不上传、不进仓库。

export type ProviderId =
  | "deepseek"
  | "silicon"
  | "openai"
  | "minimax"
  | "openrouter"
  | "groq"
  | "together"
  | "mimo"
  | "openai-compatible"
  | "cli-claude"
  | "cli-qwen"
  | "cli-deepseek"
  | "cli-codex"
  | "cli-opencode"
  | "cli-cursor"
  | "cli-kimi";

export interface ModelConfig {
  id: string;        // 实际传给接口/CLI 的 model 名
  name: string;      // 下拉里显示的品牌名
  description: string;
  provider: ProviderId;
  comingSoon?: boolean; // true = 列出但暂不可选（开发中）
}

export const isCliProvider = (p: ProviderId): boolean => p.startsWith("cli-");

// 各 API provider 的默认接口地址（OpenAI 兼容）。选中即自动填 baseURL，用户只需填 key。
export const PROVIDER_BASE: Partial<Record<ProviderId, string>> = {
  deepseek: "https://api.deepseek.com",
  silicon: "https://api.siliconflow.cn/v1",
  openai: "https://api.openai.com/v1",
  minimax: "https://api.minimaxi.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  groq: "https://api.groq.com/openai/v1",
  together: "https://api.together.xyz/v1",
  mimo: "", // 私有网关，必须自填 baseURL
  "openai-compatible": "", // 任意兼容端点，自填
};

export const aiModels: ModelConfig[] = [
  // Subscription (use local CLI, no API key)
  { id: "claude-code", name: "Claude Code", description: "Use local Claude subscription", provider: "cli-claude" },
  { id: "qwen-code", name: "Qwen Code", description: "Qwen Code subscription", provider: "cli-qwen" },
  { id: "deepseek-cli", name: "DeepSeek CLI", description: "DeepSeek local CLI subscription", provider: "cli-deepseek" },
  { id: "codex", name: "Codex", description: "OpenAI Codex subscription (requires codex login)", provider: "cli-codex" },
  { id: "opencode", name: "OpenCode", description: "OpenCode subscription", provider: "cli-opencode", comingSoon: true },
  { id: "cursor-agent", name: "Cursor Agent", description: "Cursor Agent subscription", provider: "cli-cursor", comingSoon: true },
  { id: "kimi", name: "Kimi", description: "Kimi subscription", provider: "cli-kimi", comingSoon: true },
  // API (bring your own key)
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", description: "DeepSeek official, fast & affordable, thinking/non-thinking dual mode", provider: "deepseek" },
  { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", description: "DeepSeek official, flagship, strongest reasoning", provider: "deepseek" },
  { id: "deepseek-ai/DeepSeek-V3", name: "SiliconFlow · DeepSeek V3", description: "SiliconFlow", provider: "silicon" },
  { id: "gpt-4o", name: "OpenAI GPT-4o", description: "OpenAI", provider: "openai" },
  { id: "MiniMax-M2", name: "MiniMax M2", description: "MiniMax", provider: "minimax" },
  { id: "doubao-pro", name: "Doubao Pro", description: "Volcano Engine, fill inference endpoint ID (ep-...)", provider: "openai-compatible" },
  { id: "openai/gpt-4o", name: "OpenRouter · GPT-4o", description: "OpenRouter aggregator (any model ID)", provider: "openrouter" },
  { id: "llama-3.3-70b-versatile", name: "Groq · Llama 3.3 70B", description: "Groq ultra-fast inference", provider: "groq" },
  { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", name: "Together · Llama 3.3 70B", description: "Together AI", provider: "together" },
  { id: "mimo-v2.5-pro", name: "MiMo V2.5 Pro", description: "Xiaomi MiMo (requires custom gateway)", provider: "mimo" },
  { id: "custom", name: "Other OpenAI Compatible", description: "Any compatible endpoint, fill baseURL/model", provider: "openai-compatible" },
];

export const subscriptionModels = aiModels.filter((m) => isCliProvider(m.provider));
export const apiModels = aiModels.filter((m) => !isCliProvider(m.provider));
