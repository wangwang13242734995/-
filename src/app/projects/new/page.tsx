"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useToast } from "@/components/Toast";

const PROJECT_TYPES = [
  { value: "COURSE", label: "课程作业" },
  { value: "COMPETITION", label: "比赛项目" },
  { value: "INTERNSHIP", label: "实习经历" },
  { value: "PERSONAL", label: "个人项目" },
  { value: "CHALLENGE", label: "挑战赛" },
];

const OUTCOME_TYPES = [
  { value: "NONE", label: "暂不填写" },
  { value: "QUANTIFIED", label: "有量化数据" },
  { value: "AWARD", label: "获得奖项" },
  { value: "LAUNCHED", label: "已上线" },
  { value: "OPEN_SOURCE", label: "已开源" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [techInput, setTechInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [abilityChanges, setAbilityChanges] = useState<{
    craft: number; learn: number; drive: number; team: number; grit: number; express: number; totalScore: number;
  } | null>(null);
  const [analysis, setAnalysis] = useState<{
    depth: { score: number; level: string; indicators: string[] };
    thinking: { pattern: string[]; creativity: number; structuredness: number };
    insights: { dimension: string; signal: string; strength: string }[];
    summary: string;
  } | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "PERSONAL",
    role: "",
    teamSize: 1,
    startDate: "",
    endDate: "",
    techStack: [] as string[],
    description: "",
    outcome: "",
    outcomeType: "NONE",
    outcomeData: "",
    difficultyEncountered: "",
    solution: "",
    githubLink: "",
    designLink: "",
    videoLink: "",
    liveLink: "",
  });

  const update = (field: string, value: string | number | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addTech = () => {
    const tech = techInput.trim();
    if (tech && !form.techStack.includes(tech)) {
      update("techStack", [...form.techStack, tech]);
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    update("techStack", form.techStack.filter((t) => t !== tech));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          teamSize: Number(form.teamSize),
          startDate: form.startDate || new Date().toISOString(),
          endDate: form.endDate || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "创建失败");
        return;
      }

      // Toast notification for score changes
      if (data.abilityChanges) {
        const changes = data.abilityChanges;
        const gain = Object.entries(changes)
          .filter(([k]) => k !== "totalScore")
          .sort(([, a], [, b]) => (b as number) - (a as number))[0];
        if (gain && (gain[1] as number) > 0) {
          const labels: Record<string, string> = { craft: "专业力", learn: "学习力", drive: "自驱力", team: "协作力", grit: "抗压力", express: "表达力" };
          addToast(`项目已记录！${labels[gain[0]]} +${gain[1]}`);
        } else {
          addToast("项目记录成功，继续加油！");
        }
      } else {
        addToast("项目记录成功！");
      }

      setAbilityChanges(data.abilityChanges);
      if (data.analysis) setAnalysis(data.analysis);
      setSubmitted(true);
    } catch {
      setError("创建失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f0eb] flex flex-col">
      <Header />

      <main className="flex-1 max-w-[800px] mx-auto w-full px-6 py-10">
        {submitted ? (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl text-[#292827]" style={{ fontWeight: 460 }}>项目记录成功！</h2>
            <p className="text-[#666666]">你的努力已转化为能力数据</p>

            {abilityChanges && (
              <div className="bg-[#f2f0eb] rounded-2xl p-6">
                <h3 className="text-sm text-[#666666] mb-4" style={{ fontWeight: 540 }}>本次能力变化</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: "craft", label: "专业力", emoji: "⚙️" },
                    { key: "learn", label: "学习力", emoji: "📚" },
                    { key: "drive", label: "自驱力", emoji: "🔥" },
                    { key: "team", label: "协作力", emoji: "🤝" },
                    { key: "grit", label: "抗压力", emoji: "💪" },
                    { key: "express", label: "表达力", emoji: "💬" },
                  ].map(({ key, label, emoji }) => {
                    const change = abilityChanges[key as keyof typeof abilityChanges];
                    return (
                      <div key={key} className="text-center">
                        <div className="text-xl mb-1">{emoji}</div>
                        <div className="text-xs text-slate-500">{label}</div>
                        <div className={`text-lg mt-1 ${change > 0 ? "text-[#0c4243]" : change < 0 ? "text-[#421d24]" : "text-[#666666]"}`} style={{ fontWeight: 540 }}>
                          {change > 0 ? `+${change}` : change === 0 ? "0" : change}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-[#e3e3e2]">
                  <span className="text-sm text-[#666666]">综合分 </span>
                  <span className={`text-xl ${abilityChanges.totalScore > 0 ? "text-[#0c4243]" : "text-[#292827]"}`} style={{ fontWeight: 540 }}>
                    {abilityChanges.totalScore > 0 ? `+${abilityChanges.totalScore}` : abilityChanges.totalScore}
                  </span>
                </div>
              </div>
            )}

            {analysis && (
              <div className="bg-[#d4c7ff]/20 rounded-2xl p-6 text-left border border-[#d4c7ff]">
                <h3 className="text-sm text-[#714cb6] mb-3" style={{ fontWeight: 540 }}>AI 能力洞察</h3>
                <p className="text-sm text-[#292827] mb-4 leading-relaxed">{analysis.summary}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {analysis.thinking.pattern.map((p) => (
                    <span key={p} className="text-xs px-2 py-1 bg-white rounded-full text-[#714cb6] border border-[#d4c7ff]">{p}</span>
                  ))}
                </div>
                {analysis.insights.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {analysis.insights.map((ins, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full mt-1.5 ${ins.strength === "high" ? "bg-[#0c4243]" : "bg-[#d4c7ff]"}`}></span>
                        <span className="text-[#292827]">{ins.signal}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 text-xs text-[#666666]">
                  解决深度: {analysis.depth.score >= 80 ? "专家级 ⭐" : analysis.depth.score >= 55 ? "深度 🔵" : analysis.depth.score >= 35 ? "中等 🟡" : "初步 🟢"}
                  {" · 创新性 "}{analysis.thinking.creativity}/100
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Link href="/projects" className="btn-secondary">查看项目</Link>
              <Link href="/dashboard" className="btn-primary">返回仪表盘</Link>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-[#421d24]/10 border border-[#421d24]/20 text-[#421d24] rounded-xl">
              {error}
            </div>
          )}

          {/* 基本信息 */}
          <section className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827]" style={{ fontSize: 19, fontWeight: 460 }}>基本信息</h2>

            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>项目名称 *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="input-field"
                placeholder="给你的项目起个名字"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>项目类型 *</label>
                <select
                  value={form.type}
                  onChange={(e) => update("type", e.target.value)}
                  className="input-field"
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>你的角色 *</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                  className="input-field"
                  placeholder="如：前端开发、产品设计"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>团队规模</label>
                <input
                  type="number"
                  value={form.teamSize}
                  onChange={(e) => update("teamSize", parseInt(e.target.value) || 1)}
                  className="input-field"
                  min={1}
                  max={50}
                />
              </div>
              <div>
                <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>开始日期</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>结束日期</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => update("endDate", e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>技术栈 / 工具</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
                  className="input-field"
                  placeholder="输入后按回车添加"
                />
                <button type="button" onClick={addTech} className="btn-secondary whitespace-nowrap">
                  添加
                </button>
              </div>
              {form.techStack.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-[#d4c7ff]/30 text-[#714cb6] rounded-full text-sm border border-[#d4c7ff]"
                    >
                      {tech}
                      <button type="button" onClick={() => removeTech(tech)} className="hover:text-red-500">
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* 项目描述 */}
          <section className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827]" style={{ fontSize: 19, fontWeight: 460 }}>项目描述 *</h2>
            <p className="text-sm text-[#666666]">至少 50 字，描述越详细，能力评估越准确</p>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="input-field min-h-[120px]"
              placeholder="描述这个项目是做什么的，你负责了哪些部分，用了什么技术，达到了什么效果..."
              required
              minLength={50}
            />
            <p className={`text-xs ${form.description.length >= 50 ? "text-[#0c4243]" : "text-[#666666]"}`}>
              {form.description.length}/50 字（最少）
            </p>
          </section>

          {/* 困难与解决 - 核心差异化 */}
          <section className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4 border-l-4 border-l-[#421d24]">
            <div>
              <h2 className="text-[#292827]" style={{ fontSize: 19, fontWeight: 460 }}>遇到的困难与解决方案</h2>
              <p className="text-sm text-[#666666] mt-1">
                这是企业最看重的部分——展示你如何解决问题比展示成果更有说服力
              </p>
            </div>

            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>
                遇到的最大困难 *（50-500 字）
              </label>
              <textarea
                value={form.difficultyEncountered}
                onChange={(e) => update("difficultyEncountered", e.target.value)}
                className="input-field min-h-[100px]"
                placeholder="描述你在项目中遇到的最大困难，可以是技术问题、资源不足、沟通障碍等..."
                minLength={50}
                maxLength={500}
              />
              <p className="text-xs text-[#666666] mt-1">
                {form.difficultyEncountered.length}/500 字（最少 50 字）
              </p>
            </div>

            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>
                你是怎么解决的 *（50-500 字）
              </label>
              <textarea
                value={form.solution}
                onChange={(e) => update("solution", e.target.value)}
                className="input-field min-h-[100px]"
                placeholder="描述你的解决过程：查了什么资料、尝试了哪些方案、最终如何解决..."
                minLength={50}
                maxLength={500}
              />
              <p className="text-xs text-[#666666] mt-1">
                {form.solution.length}/500 字（最少 50 字）
              </p>
            </div>
          </section>

          {/* 项目成果 */}
          <section className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827]" style={{ fontSize: 19, fontWeight: 460 }}>项目成果</h2>

            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>成果类型</label>
              <select
                value={form.outcomeType}
                onChange={(e) => update("outcomeType", e.target.value)}
                className="input-field"
              >
                {OUTCOME_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {form.outcomeType !== "NONE" && (
              <div>
                <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>成果描述</label>
                <input
                  type="text"
                  value={form.outcome}
                  onChange={(e) => update("outcome", e.target.value)}
                  className="input-field"
                  placeholder={
                    form.outcomeType === "QUANTIFIED" ? "如：日活 300+、性能提升 40%" :
                    form.outcomeType === "AWARD" ? "如：校级创新赛二等奖" :
                    form.outcomeType === "LAUNCHED" ? "如：已上线运营 3 个月" :
                    "如：GitHub Star 200+"
                  }
                />
              </div>
            )}
          </section>

          {/* 外链 */}
          <section className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827]" style={{ fontSize: 19, fontWeight: 460 }}>项目链接（选填）</h2>
            <p className="text-sm text-[#666666]">添加外链可以提升记录的可信度</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>GitHub</label>
                <input type="url" value={form.githubLink} onChange={(e) => update("githubLink", e.target.value)} className="input-field" placeholder="https://github.com/..." />
              </div>
              <div>
                <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>设计稿</label>
                <input type="url" value={form.designLink} onChange={(e) => update("designLink", e.target.value)} className="input-field" placeholder="https://figma.com/..." />
              </div>
              <div>
                <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>视频演示</label>
                <input type="url" value={form.videoLink} onChange={(e) => update("videoLink", e.target.value)} className="input-field" placeholder="https://bilibili.com/..." />
              </div>
              <div>
                <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>线上地址</label>
                <input type="url" value={form.liveLink} onChange={(e) => update("liveLink", e.target.value)} className="input-field" placeholder="https://..." />
              </div>
            </div>
          </section>

          <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-3">
            {loading ? "提交中..." : "保存项目记录"}
          </button>
        </form>
        )}
      </main>
    </div>
  );
}
