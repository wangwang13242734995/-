"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";

const typeLabels: Record<string, string> = {
  COURSE: "课程作业",
  COMPETITION: "比赛",
  INTERNSHIP: "实习",
  PERSONAL: "个人项目",
  CHALLENGE: "挑战赛",
};

const recordTypeIcons: Record<string, string> = {
  MILESTONE: "🎯",
  PROBLEM_SOLVED: "💡",
  NEW_SKILL: "📚",
  REFLECTION: "🪞",
};

const ABILITY_LABELS: Record<string, string> = {
  craft: "专业力",
  learn: "学习力",
  drive: "自驱力",
  team: "协作力",
  grit: "抗压力",
  express: "表达力",
};

export default function WeeklyReviewPage() {
  const { status } = useSession();
  const router = useRouter();
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/weekly-review")
        .then((r) => {
          if (!r.ok) throw new Error("加载失败");
          return r.json();
        })
        .then(setReview)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#f2f0eb] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#e3e3e2] border-t-[#421d24] rounded-full animate-spin" />
          <p className="text-[#666666] mt-4 text-sm">正在生成你的本周复盘...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-[#f2f0eb] flex items-center justify-center">
        <p className="text-[#666666]">加载失败，请刷新重试</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f0eb] flex flex-col">
      <Header />

      <main className="flex-1 max-w-[900px] mx-auto w-full px-6 py-10 space-y-6">
        {/* Header Band — Deep Lagoon */}
        <div className="bg-[#0c4243] rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
          <div className="relative">
            <Link href="/dashboard" className="text-white/70 hover:text-white text-sm transition inline-flex items-center gap-1 mb-4">
              ← 返回仪表盘
            </Link>
            <h1 className="text-3xl" style={{ fontWeight: 460, letterSpacing: "-0.022em" }}>本周复盘</h1>
            <p className="text-white/60 text-sm mt-2">{review.weekLabel}</p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#421d24]" />
          <p className="text-lg text-[#292827] leading-relaxed pl-4" style={{ fontWeight: 400 }}>{review.summary}</p>

          {review.highlights.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6 pl-4">
              {review.highlights.map((h: string, i: number) => (
                <span key={i} className="bg-[#d4c7ff]/30 text-[#714cb6] px-4 py-1.5 rounded-full text-sm border border-[#d4c7ff]">
                  {h}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ability Changes */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-8">
          <h2 className="text-[#292827] mb-6 flex items-center gap-2" style={{ fontSize: 22, fontWeight: 460 }}>
            <span className="w-8 h-8 bg-[#d4c7ff]/30 rounded-lg flex items-center justify-center text-sm">📈</span>
            能力变化
          </h2>

          {/* Total Score */}
          <div className="bg-[#f2f0eb] p-6 rounded-xl mb-6 border border-[#e3e3e2]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#666666] mb-1">综合得分</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl text-[#292827]" style={{ fontWeight: 540 }}>{Math.round(review.abilityChanges.current.totalScore)}</span>
                  {review.abilityChanges.totalScoreChange !== 0 && (
                    <span className={`text-lg ${review.abilityChanges.totalScoreChange > 0 ? "text-[#714cb6]" : "text-[#421d24]"}`} style={{ fontWeight: 540 }}>
                      {review.abilityChanges.totalScoreChange > 0 ? "↑" : "↓"}{Math.abs(review.abilityChanges.totalScoreChange)}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-16 h-16 bg-[#421d24] rounded-2xl flex items-center justify-center text-white text-2xl" style={{ fontWeight: 540 }}>
                {Math.round(review.abilityChanges.current.totalScore)}
              </div>
            </div>
          </div>

          {/* 6-Dimension Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(review.abilityChanges.changes).map(([key, change]) => {
              const currentVal = Math.round((review.abilityChanges.current as any)[key] || 30);
              const changeVal = change as number;

              return (
                <div key={key} className="p-4 bg-[#f2f0eb] rounded-xl border border-[#e3e3e2] hover:border-[#714cb6] transition group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#666666]">{ABILITY_LABELS[key]}</span>
                    {changeVal > 0 && (
                      <span className="text-xs bg-[#d4c7ff]/40 text-[#714cb6] px-2 py-0.5 rounded-full" style={{ fontWeight: 540 }}>+{changeVal}</span>
                    )}
                    {changeVal < 0 && (
                      <span className="text-xs bg-[#421d24]/10 text-[#421d24] px-2 py-0.5 rounded-full" style={{ fontWeight: 540 }}>{changeVal}</span>
                    )}
                  </div>
                  <p className="text-2xl text-[#292827] group-hover:text-[#714cb6] transition" style={{ fontWeight: 540 }}>{currentVal}</p>
                </div>
              );
            })}
          </div>

          {/* Biggest Gain */}
          {review.abilityChanges.biggestGain.value > 0 && (
            <div className="mt-6 p-5 bg-[#d4c7ff]/20 rounded-xl border border-[#d4c7ff]">
              <p className="text-sm text-[#714cb6]" style={{ fontWeight: 540 }}>
                本周最大进步：<strong style={{ fontWeight: 600 }}>{review.abilityChanges.biggestGain.label}</strong> 提升了 {review.abilityChanges.biggestGain.value} 分
              </p>
            </div>
          )}
        </div>

        {/* Projects This Week */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-8">
          <h2 className="text-[#292827] mb-6 flex items-center gap-2" style={{ fontSize: 22, fontWeight: 460 }}>
            <span className="w-8 h-8 bg-[#d4c7ff]/30 rounded-lg flex items-center justify-center text-sm">🚀</span>
            本周项目 <span className="text-[#666666] text-base" style={{ fontWeight: 400 }}>({review.projects.count})</span>
          </h2>
          {review.projects.count > 0 ? (
            <div className="space-y-3">
              {review.projects.items.map((p: any) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="block p-5 bg-[#f2f0eb] rounded-xl hover:bg-white border border-[#e3e3e2] hover:border-[#714cb6] transition group">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[#292827] group-hover:text-[#714cb6] transition" style={{ fontWeight: 540 }}>{p.title}</h3>
                    <span className="text-xs bg-[#e3e3e2] text-[#666666] px-2.5 py-1 rounded-full">
                      {typeLabels[p.type] || p.type}
                    </span>
                    <span className="ml-auto text-[#666666] group-hover:text-[#714cb6] transition">→</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[#666666] text-sm mb-3">这周还没有新项目</p>
              <Link href="/projects/new" className="inline-flex items-center gap-1 text-[#714cb6] hover:underline font-medium text-sm">
                记录第一个 →
              </Link>
            </div>
          )}
        </div>

        {/* Growth Records */}
        {review.growthRecords.count > 0 && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-8">
            <h2 className="text-[#292827] mb-6 flex items-center gap-2" style={{ fontSize: 22, fontWeight: 460 }}>
              <span className="w-8 h-8 bg-[#d4c7ff]/30 rounded-lg flex items-center justify-center text-sm">✨</span>
              成长轨迹 <span className="text-[#666666] text-base" style={{ fontWeight: 400 }}>({review.growthRecords.count})</span>
            </h2>
            <div className="space-y-3">
              {review.growthRecords.items.map((r: any) => (
                <div key={r.id} className="flex items-center gap-4 p-4 bg-[#f2f0eb] rounded-xl border border-[#e3e3e2]">
                  <span className="text-xl w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-[#e3e3e2]">
                    {recordTypeIcons[r.type] || "📝"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-[#292827]" style={{ fontWeight: 540 }}>{r.title}</p>
                    <p className="text-xs text-[#666666] mt-0.5">{new Date(r.date).toLocaleDateString("zh-CN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-[#421d24] rounded-2xl p-8 text-center">
          <p className="text-white/60 text-sm mb-4">持续记录，让能力数据说话</p>
          <Link
            href="/projects/new"
            className="inline-block bg-white text-[#421d24] px-8 py-3 rounded-2xl hover:bg-[#f2f0eb] transition"
            style={{ fontWeight: 540 }}
          >
            继续记录项目 →
          </Link>
        </div>
      </main>
    </div>
  );
}
