"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface MyParticipation {
  id: string;
  challengeId: string;
  challenge: {
    id: string;
    title: string;
    category: string;
    status: string;
    endDate: string;
    rewardType: string;
    enterprise: { companyName: string };
  };
  submission: string | null;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  feedback: string | null;
  rank: number | null;
}

const PARTICIPATION_STATUS: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: "进行中", color: "bg-[#d4c7ff]/30 text-[#714cb6]" },
  SUBMITTED: { label: "待评审", color: "bg-[#0c4243]/10 text-[#0c4243]" },
  ACCEPTED: { label: "已通过", color: "bg-[#0c4243]/10 text-[#0c4243]" },
  REJECTED: { label: "未通过", color: "bg-[#421d24]/10 text-[#421d24]" },
};

export default function MyChallengesPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [participations, setParticipations] = useState<MyParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/auth/login"); return; }
    if (authStatus === "authenticated") {
      fetch("/api/my-challenges")
        .then((res) => res.json())
        .then((data) => { setParticipations(data.participations || []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [authStatus, router]);

  const filtered = filter === "ALL" 
    ? participations 
    : participations.filter((p) => p.status === filter);

  if (loading || authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb]">
        <div className="text-[#666666]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f0eb] flex flex-col">
      <Header />
      <main className="flex-1 max-w-[800px] mx-auto w-full px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#292827]" style={{ fontSize: 26, fontWeight: 460, lineHeight: 1.3 }}>我的挑战</h1>
            <p className="text-sm text-[#666666] mt-1">你参与的企业挑战赛及评审结果</p>
          </div>
          <Link href="/challenges" className="btn-secondary text-sm !py-2 !px-4">发现更多</Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { key: "ALL", label: "全部" },
            { key: "IN_PROGRESS", label: "进行中" },
            { key: "SUBMITTED", label: "待评审" },
            { key: "ACCEPTED", label: "已通过" },
            { key: "REJECTED", label: "未通过" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                filter === key ? "bg-[#421d24] text-white" : "bg-white text-[#292827] border border-[#e3e3e2] hover:border-[#714cb6]"
              }`}>
              {label}
              {key !== "ALL" && (
                <span className="ml-1 text-xs opacity-70">
                  ({participations.filter((p) => p.status === key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">⚔️</div>
            <h2 className="text-lg text-[#292827] mb-2" style={{ fontWeight: 460 }}>
              {participations.length === 0 ? "还没有参与挑战赛" : "该分类下暂无记录"}
            </h2>
            <p className="text-[#666666] text-sm mb-4">去挑战广场看看有什么有趣的企业任务吧</p>
            <Link href="/challenges" className="btn-primary">浏览挑战赛</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => {
              const st = PARTICIPATION_STATUS[p.status] || { label: p.status, color: "bg-[#e3e3e2] text-[#666666]" };
              return (
                <div key={p.id} className="bg-white border border-[#e3e3e2] rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Link href={`/challenges/${p.challengeId}`} className="text-[#292827] hover:text-[#714cb6] transition" style={{ fontWeight: 540 }}>
                        {p.challenge.title}
                      </Link>
                      <p className="text-xs text-[#666666] mt-1">
                        {p.challenge.enterprise.companyName} · {p.challenge.category}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  </div>

                  {p.submittedAt && (
                    <p className="text-xs text-[#666666]">
                      提交于 {new Date(p.submittedAt).toLocaleDateString("zh-CN")}
                    </p>
                  )}

                  {p.rank != null && (
                    <div className="mt-2 inline-flex items-center gap-1 text-sm text-[#714cb6]" style={{ fontWeight: 540 }}>
                      🏆 排名：第 {p.rank} 名
                    </div>
                  )}

                  {p.feedback && (
                    <div className="mt-3 p-3 bg-[#f2f0eb] rounded-xl text-sm text-[#666666]">
                      <span className="text-xs text-[#292827] block mb-1" style={{ fontWeight: 540 }}>企业反馈：</span>
                      {p.feedback}
                    </div>
                  )}

                  {p.status === "IN_PROGRESS" && (
                    <Link href={`/challenges/${p.challengeId}`} className="inline-block mt-3 text-sm text-[#714cb6] hover:underline">
                      继续完成 →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
