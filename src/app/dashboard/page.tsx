"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AbilityRadar } from "@/components/AbilityRadar";
import GrowthTrend from "@/components/GrowthTrend";

interface DashboardData {
  latestScore: {
    craft: number; learn: number; drive: number;
    team: number; grit: number; express: number; totalScore: number;
  } | null;
  scoreHistory: { calculatedAt: string; craft: number; learn: number; drive: number; team: number; grit: number; express: number; totalScore: number }[];
  projects: { id: string; title: string; type: string; createdAt: string }[];
  growthRecords: { id: string; title: string; type: string; date: string; content: string }[];
  stats: { projectCount: number; recordCount: number; uniqueDays: number; streakDays: number };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/dashboard")
        .then((res) => res.json())
        .then((d) => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  const scores = data?.latestScore || { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30 };
  const stats = data?.stats || { projectCount: 0, recordCount: 0, uniqueDays: 0, streakDays: 0 };

  const suggestions = [];
  if (scores.craft < 40) suggestions.push("多记录项目经历来提升专业力，尝试增加项目复杂度");
  if (scores.team < 40) suggestions.push("尝试参与团队项目，协作力是雇主非常看重的维度");
  if (scores.grit < 40) suggestions.push("记录你遇到的困难和解决过程，这是展示抗压力的最佳方式");
  if (scores.drive < 40) suggestions.push("尝试启动一个个人项目，展示你的自驱力");
  if (stats.recordCount < 3) suggestions.push("坚持记录成长事件，每周至少 1-2 条，保持活跃度");
  if (suggestions.length === 0) suggestions.push("你的能力画像已经比较完整，继续保持记录频率！");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              你好，{session?.user?.name || "同学"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">这是你的成长概览</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/projects" className="btn-secondary text-sm">我的项目</Link>
            <Link href="/projects/new" className="btn-primary text-sm">+ 记录新项目</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "完成项目", value: stats.projectCount, color: "text-blue-600" },
            { label: "成长记录", value: stats.recordCount, color: "text-green-600" },
            { label: "记录天数", value: stats.uniqueDays, color: "text-purple-600" },
            { label: "连续天数", value: stats.streakDays, color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center">
              <div className={`text-3xl font-bold ${color}`}>{value}</div>
              <div className="text-sm text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="card flex flex-col items-center">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">能力快照</h2>
            <AbilityRadar
              data={{
                craft: scores.craft,
                learn: scores.learn,
                drive: scores.drive,
                team: scores.team,
                grit: scores.grit,
                express: scores.express,
              }}
            />
            <div className="flex items-center gap-2 mt-2">
              <Link
                href={`/profile/${(session?.user as { id: string })?.id}`}
                className="text-sm text-indigo-600 hover:underline"
              >
                查看完整能力名片 &rarr;
              </Link>
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">成长建议</h2>
            <div className="space-y-3">
              {suggestions.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                  <span className="text-indigo-500 mt-0.5">💡</span>
                  <p className="text-sm text-slate-700">{s}</p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-700 mb-3">能力维度</h3>
              <div className="space-y-2">
                {[
                  { label: "专业力", value: scores.craft, desc: "技术深度与成果质量" },
                  { label: "学习力", value: scores.learn, desc: "成长速度与适应能力" },
                  { label: "自驱力", value: scores.drive, desc: "主动性与持续投入" },
                  { label: "协作力", value: scores.team, desc: "团队经验与沟通能力" },
                  { label: "抗压力", value: scores.grit, desc: "面对困难的韧性" },
                  { label: "表达力", value: scores.express, desc: "叙事清晰度与结构化" },
                ].map(({ label, value, desc }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-14">{label}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 w-6 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Growth Trend Chart */}
        <GrowthTrend
          data={(data?.scoreHistory || []).map((s) => ({
            date: s.calculatedAt,
            craft: s.craft,
            learn: s.learn,
            drive: s.drive,
            team: s.team,
            grit: s.grit,
            express: s.express,
            totalScore: s.totalScore,
          }))}
        />

        {/* Recent Records */}
        {data?.growthRecords && data.growthRecords.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">最近记录</h2>
            <div className="space-y-3">
              {data.growthRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{record.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{record.content}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(record.date).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">快速操作</h2>
          <div className="grid grid-cols-4 gap-4">
            <Link href="/projects/new" className="p-4 bg-indigo-50 rounded-lg text-center hover:bg-indigo-100 transition-colors">
              <div className="text-2xl mb-2">📝</div>
              <p className="text-sm font-medium text-slate-900">记录新项目</p>
            </Link>
            <Link href="/challenges" className="p-4 bg-red-50 rounded-lg text-center hover:bg-red-100 transition-colors">
              <div className="text-2xl mb-2">🏆</div>
              <p className="text-sm font-medium text-slate-900">发现挑战赛</p>
            </Link>
            <Link href={`/profile/${(session?.user as { id: string })?.id}`} className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors">
              <div className="text-2xl mb-2">🎯</div>
              <p className="text-sm font-medium text-slate-900">查看能力名片</p>
            </Link>
            <Link href="/projects" className="p-4 bg-amber-50 rounded-lg text-center hover:bg-amber-100 transition-colors">
              <div className="text-2xl mb-2">📋</div>
              <p className="text-sm font-medium text-slate-900">管理项目</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
