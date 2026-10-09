"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";

interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  requirements: string | null;
  duration: number;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  rewardType: string;
  rewardDetail: string | null;
  status: string;
  enterprise: { companyName: string; logo: string | null; industry: string | null; description: string | null };
  _count: { participations: number };
  myParticipation: { id: string; status: string; submission: string | null; feedback: string | null; rank: number | null } | null;
}

const REWARD_LABELS: Record<string, string> = {
  INTERVIEW_PASS: "面试直通卡", GREEN_CHANNEL: "面试绿色通道",
  MENTORSHIP: "企业导师辅导", CASH: "现金奖励", CERTIFICATE: "完成证明",
};

export default function ChallengeDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/challenges/${params.id}`)
      .then((res) => res.json())
      .then((data) => { setChallenge(data.challenge); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleJoin = async () => {
    if (!session) { router.push("/auth/login"); return; }
    setJoining(true);
    setMsg("");
    try {
      const res = await fetch("/api/challenges/participate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge?.id }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error); return; }
      setMsg("已加入挑战赛！");
      router.refresh();
      window.location.reload();
    } catch { setMsg("操作失败"); }
    finally { setJoining(false); }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMsg("");
    try {
      const res = await fetch("/api/challenges/participate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge?.id, submission, links }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error); return; }
      setMsg("作品已提交！你的成长记录已更新。");
      window.location.reload();
    } catch { setMsg("提交失败"); }
    finally { setSubmitting(false); }
  };

  const addLink = () => {
    if (linkInput.trim()) { setLinks([...links, linkInput.trim()]); setLinkInput(""); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb] text-[#666666]">加载中...</div>;
  if (!challenge) return <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb] text-[#666666]">挑战赛不存在</div>;

  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / 86400000));
  const isParticipating = !!challenge.myParticipation;
  const hasSubmitted = challenge.myParticipation?.status === "SUBMITTED" || challenge.myParticipation?.status === "ACCEPTED" || challenge.myParticipation?.status === "REJECTED";

  return (
    <div className="min-h-screen bg-[#f2f0eb] flex flex-col">
      <Header />

      <main className="flex-1 max-w-[800px] mx-auto w-full px-6 py-10 space-y-6">
        <Link href="/challenges" className="link-violet text-sm">&larr; 返回挑战赛列表</Link>

        {/* Status banner */}
        {(challenge.status === "CLOSED" || challenge.status === "COMPLETED") && (
          <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            challenge.status === "CLOSED" ? "bg-[#421d24]/5 text-[#421d24] border border-[#421d24]/20" : "bg-[#d4c7ff]/20 text-[#714cb6] border border-[#d4c7ff]"
          }`}>
            <span>{challenge.status === "CLOSED" ? "⚠️" : "✅"}</span>
            {challenge.status === "CLOSED" ? "该挑战赛已关闭，不再接受新参与和提交" : "该挑战赛已完成，结果已公布"}
          </div>
        )}

        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#d4c7ff] rounded-2xl flex items-center justify-center text-lg text-[#421d24]" style={{ fontWeight: 540 }}>
              {challenge.enterprise.companyName.charAt(0)}
            </div>
            <div>
              <p className="text-[#292827]" style={{ fontWeight: 540 }}>{challenge.enterprise.companyName}</p>
              <p className="text-xs text-[#666666]">{challenge.enterprise.industry}</p>
            </div>
          </div>

          <h1 className="text-[#292827] mb-3" style={{ fontSize: 28, fontWeight: 460, lineHeight: 1.14, letterSpacing: "-0.022em" }}>{challenge.title}</h1>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-2 py-0.5 bg-[#d4c7ff]/30 text-[#714cb6] rounded-full">{challenge.category}</span>
            <span className="text-xs px-2 py-0.5 bg-[#d4c7ff]/40 text-[#421d24] rounded-full">{REWARD_LABELS[challenge.rewardType]}</span>
            <span className="text-xs text-[#666666]">{challenge._count.participations}/{challenge.maxParticipants} 人参与</span>
            <span className={`text-xs ${daysLeft <= 3 ? "text-[#421d24]" : "text-[#666666]"}`} style={{ fontWeight: 540 }}>
              {daysLeft > 0 ? `剩余 ${daysLeft} 天` : "已结束"}
            </span>
          </div>

          <div className="prose prose-sm max-w-none text-[#292827] whitespace-pre-line leading-relaxed">
            {challenge.description}
          </div>
        </div>

        {challenge.requirements && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
            <h2 className="text-[#292827] mb-2" style={{ fontSize: 19, fontWeight: 460 }}>参赛要求</h2>
            <p className="text-sm text-[#666666] whitespace-pre-line">{challenge.requirements}</p>
          </div>
        )}

        {challenge.rewardDetail && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 border-l-4 border-l-[#714cb6]">
            <h2 className="text-[#292827] mb-2" style={{ fontSize: 19, fontWeight: 460 }}>奖励详情</h2>
            <p className="text-sm text-[#292827]">{challenge.rewardDetail}</p>
          </div>
        )}

        {msg && (
          <div className={`p-4 rounded-xl text-sm ${msg.includes("失败") || msg.includes("错误") ? "bg-[#421d24]/10 text-[#421d24] border border-[#421d24]/20" : "bg-[#0c4243]/10 text-[#0c4243] border border-[#0c4243]/20"}`}>
            {msg}
          </div>
        )}

        {!isParticipating ? (
          <button onClick={handleJoin} disabled={joining || daysLeft === 0 || challenge.status !== "OPEN"} className="btn-primary w-full text-lg py-3">
            {challenge.status !== "OPEN" ? "不可参与" : joining ? "加入中..." : daysLeft > 0 ? "参与挑战赛" : "已结束"}
          </button>
        ) : hasSubmitted ? (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 border-l-4 border-l-[#0c4243] text-center">
            {challenge.myParticipation?.status === "ACCEPTED" ? (
              <div>
                <p className="text-[#0c4243] mb-1" style={{ fontWeight: 540 }}>🎉 作品已通过评审</p>
                {challenge.myParticipation?.rank && <p className="text-sm text-[#714cb6]">排名：第 {challenge.myParticipation.rank} 名</p>}
                {challenge.myParticipation?.feedback && <p className="text-sm text-[#666666] mt-2">{challenge.myParticipation.feedback}</p>}
              </div>
            ) : challenge.myParticipation?.status === "REJECTED" ? (
              <div>
                <p className="text-[#421d24] mb-1" style={{ fontWeight: 540 }}>作品未通过评审</p>
                {challenge.myParticipation?.feedback && <p className="text-sm text-[#666666] mt-2">{challenge.myParticipation.feedback}</p>}
              </div>
            ) : (
              <p className="text-[#0c4243]" style={{ fontWeight: 540 }}>作品已提交，等待企业评审</p>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827]" style={{ fontSize: 19, fontWeight: 460 }}>提交作品</h2>
            <textarea
              value={submission}
              onChange={(e) => setSubmission(e.target.value)}
              className="input-field min-h-[120px]"
              placeholder="描述你的作品、方案或解决过程..."
              minLength={20}
            />
            <div>
              <div className="flex gap-2">
                <input type="url" value={linkInput} onChange={(e) => setLinkInput(e.target.value)}
                  className="input-field" placeholder="添加链接（GitHub、设计稿等）" />
                <button type="button" onClick={addLink} className="btn-secondary whitespace-nowrap">添加</button>
              </div>
              {links.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {links.map((l, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-[#f2f0eb] rounded-full text-xs border border-[#e3e3e2]">
                      {l}
                      <button onClick={() => setLinks(links.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">x</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleSubmit} disabled={submitting || submission.length < 20} className="btn-primary w-full">
              {submitting ? "提交中..." : "提交作品"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
