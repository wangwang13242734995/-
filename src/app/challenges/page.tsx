"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  startDate: string;
  endDate: string;
  rewardType: string;
  rewardDetail: string | null;
  maxParticipants: number;
  enterprise: { companyName: string; logo: string | null };
  _count: { participations: number };
}

const REWARD_LABELS: Record<string, string> = {
  INTERVIEW_PASS: "面试直通卡",
  GREEN_CHANNEL: "面试绿色通道",
  MENTORSHIP: "企业导师辅导",
  CASH: "现金奖励",
  CERTIFICATE: "完成证明",
};

const REWARD_COLORS: Record<string, string> = {
  INTERVIEW_PASS: "bg-red-50 text-red-600",
  GREEN_CHANNEL: "bg-orange-50 text-orange-600",
  MENTORSHIP: "bg-blue-50 text-blue-600",
  CASH: "bg-green-50 text-green-600",
  CERTIFICATE: "bg-slate-50 text-slate-600",
};

const CATEGORIES = ["全部", "前端开发", "后端开发", "设计", "数据分析", "产品", "运营", "AI/机器学习", "写作"];

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("全部");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "全部") params.set("category", category);
    params.set("status", "OPEN");

    fetch(`/api/challenges?${params}`)
      .then((res) => res.json())
      .then((data) => { setChallenges(data.challenges || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">发现挑战赛</h1>
            <p className="text-sm text-slate-500 mt-1">参与企业实战任务，证明你的能力</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-secondary text-sm">仪表盘</Link>
            <Link href="/enterprise/register" className="btn-secondary text-sm">企业入驻</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                category === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">加载中...</div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">暂无挑战赛</h2>
            <p className="text-slate-500">企业正在准备挑战赛，敬请期待</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge) => {
              const daysLeft = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / 86400000));
              return (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className="card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-xs font-bold text-indigo-600">
                      {challenge.enterprise.companyName.charAt(0)}
                    </div>
                    <span className="text-sm text-slate-500">{challenge.enterprise.companyName}</span>
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{challenge.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{challenge.description}</p>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${REWARD_COLORS[challenge.rewardType] || ""}`}>
                      {REWARD_LABELS[challenge.rewardType] || challenge.rewardType}
                    </span>
                    <span className="text-xs text-slate-400">
                      {challenge._count.participations}/{challenge.maxParticipants} 人
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">{challenge.category}</span>
                    <span className={`text-xs font-medium ${daysLeft <= 3 ? "text-red-500" : "text-slate-500"}`}>
                      {daysLeft > 0 ? `剩余 ${daysLeft} 天` : "已结束"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
