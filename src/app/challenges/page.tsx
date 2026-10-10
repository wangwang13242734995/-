"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

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
  enterprise: { companyName: string; logo: string | null; verificationLevel?: string };
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
  INTERVIEW_PASS: "bg-[#421d24]/10 text-[#421d24]",
  GREEN_CHANNEL: "bg-[#d4c7ff]/40 text-[#714cb6]",
  MENTORSHIP: "bg-[#0c4243]/10 text-[#0c4243]",
  CASH: "bg-[#d4c7ff]/30 text-[#421d24]",
  CERTIFICATE: "bg-[#e3e3e2] text-[#666666]",
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
    <div className="min-h-screen bg-[#f2f0eb] flex flex-col">
      <Header />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-[#292827]" style={{ fontSize: 26, fontWeight: 460, lineHeight: 1.3 }}>发现挑战赛</h1>
          <p className="text-sm text-[#666666] mt-1">参与企业实战任务，证明你的能力</p>
        </div>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                category === cat
                  ? "bg-[#421d24] text-white"
                  : "bg-white text-[#292827] border border-[#e3e3e2] hover:border-[#714cb6]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#666666]">加载中...</div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-xl text-[#292827] mb-2" style={{ fontWeight: 460 }}>暂无挑战赛</h2>
            <p className="text-[#666666]">企业正在准备挑战赛，敬请期待</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge) => {
              const daysLeft = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / 86400000));
              return (
                <Link
                  key={challenge.id}
                  href={`/challenges/${challenge.id}`}
                  className="block bg-white border border-[#e3e3e2] rounded-2xl p-5 hover:border-[#714cb6] transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#d4c7ff] rounded-lg flex items-center justify-center text-xs text-[#421d24]" style={{ fontWeight: 540 }}>
                      {challenge.enterprise.companyName.charAt(0)}
                    </div>
                    <span className="text-sm text-[#666666]">{challenge.enterprise.companyName}</span>
                    {challenge.enterprise.verificationLevel === "DEEP" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#0c4243] text-white rounded-full" style={{ fontWeight: 540 }}>已核验</span>
                    )}
                  </div>

                  <h3 className="text-[#292827] mb-2 line-clamp-2" style={{ fontWeight: 540 }}>{challenge.title}</h3>
                  <p className="text-sm text-[#666666] line-clamp-2 mb-4">{challenge.description}</p>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${REWARD_COLORS[challenge.rewardType] || ""}`}>
                      {REWARD_LABELS[challenge.rewardType] || challenge.rewardType}
                    </span>
                    <span className="text-xs text-[#666666]">
                      {challenge._count.participations}/{challenge.maxParticipants} 人
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#e3e3e2]">
                    <span className="text-xs text-[#666666]">{challenge.category}</span>
                    <span className={`text-xs ${daysLeft <= 3 ? "text-[#421d24]" : "text-[#666666]"}`} style={{ fontWeight: 540 }}>
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
