"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-slate-400 mt-4 text-sm">正在生成你的本周复盘...</p>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">加载失败，请刷新重试</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-600/20 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/10 rounded-full translate-y-8 -translate-x-8" />
        <div className="relative">
          <Link href="/dashboard" className="text-emerald-300 hover:text-white text-sm transition inline-flex items-center gap-1 mb-4">
            ← 返回仪表盘
          </Link>
          <h1 className="text-3xl font-bold mb-2">本周复盘</h1>
          <p className="text-emerald-200 text-sm">{review.weekLabel}</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 mb-8 relative overflow-hidden shadow-sm">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-amber-500" />
        <p className="text-lg text-slate-700 leading-relaxed pl-4">{review.summary}</p>

        {review.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6 pl-4">
            {review.highlights.map((h: string, i: number) => (
              <span key={i} className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-medium border border-emerald-100">
                {h}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Ability Changes */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 mb-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 text-sm">📈</span>
          能力变化
        </h2>

        {/* Total Score */}
        <div className="bg-gradient-to-r from-slate-50 to-emerald-50/30 p-6 rounded-xl mb-6 border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">综合得分</p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-slate-900">{Math.round(review.abilityChanges.current.totalScore)}</span>
                {review.abilityChanges.totalScoreChange !== 0 && (
                  <span className={`text-lg font-semibold ${review.abilityChanges.totalScoreChange > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {review.abilityChanges.totalScoreChange > 0 ? "↑" : "↓"}{Math.abs(review.abilityChanges.totalScoreChange)}
                  </span>
                )}
              </div>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-200">
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
              <div key={key} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-500">{ABILITY_LABELS[key]}</span>
                  {changeVal > 0 && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">+{changeVal}</span>
                  )}
                  {changeVal < 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">{changeVal}</span>
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-800 group-hover:text-emerald-700 transition">{currentVal}</p>
              </div>
            );
          })}
        </div>

        {/* Biggest Gain */}
        {review.abilityChanges.biggestGain.value > 0 && (
          <div className="mt-6 p-5 bg-gradient-to-r from-amber-50 to-amber-100/30 rounded-xl border border-amber-200/60">
            <p className="text-sm text-amber-800 font-medium">
              🌟 本周最大进步：<strong className="text-amber-900">{review.abilityChanges.biggestGain.label}</strong> 提升了 {review.abilityChanges.biggestGain.value} 分
            </p>
          </div>
        )}
      </div>

      {/* Projects This Week */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 mb-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-sm">🚀</span>
          本周项目 <span className="text-slate-400 font-normal text-base">({review.projects.count})</span>
        </h2>
        {review.projects.count > 0 ? (
          <div className="space-y-3">
            {review.projects.items.map((p: any) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block p-5 bg-slate-50 rounded-xl hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-200 transition group">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition">{p.title}</h3>
                  <span className="text-xs bg-slate-200/80 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                    {typeLabels[p.type] || p.type}
                  </span>
                  <span className="ml-auto text-slate-300 group-hover:text-emerald-500 transition">→</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm mb-3">这周还没有新项目</p>
            <Link href="/projects/new" className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm">
              记录第一个 →
            </Link>
          </div>
        )}
      </div>

      {/* Growth Records */}
      {review.growthRecords.count > 0 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 text-sm">✨</span>
            成长轨迹 <span className="text-slate-400 font-normal text-base">({review.growthRecords.count})</span>
          </h2>
          <div className="space-y-3">
            {review.growthRecords.items.map((r: any) => (
              <div key={r.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xl w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  {recordTypeIcons[r.type] || "📝"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{r.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(r.date).toLocaleDateString("zh-CN")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-8 text-center">
        <p className="text-emerald-200 text-sm mb-4">持续记录，让能力数据说话</p>
        <Link
          href="/projects/new"
          className="inline-block bg-white text-emerald-800 px-8 py-3 rounded-xl hover:bg-emerald-50 transition font-semibold"
        >
          继续记录项目 →
        </Link>
      </div>
    </div>
  );
}
