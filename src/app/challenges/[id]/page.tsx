"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  myParticipation: { id: string; status: string; submission: string | null } | null;
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">加载中...</div>;
  if (!challenge) return <div className="min-h-screen flex items-center justify-center text-slate-400">挑战赛不存在</div>;

  const daysLeft = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / 86400000));
  const isParticipating = !!challenge.myParticipation;
  const hasSubmitted = challenge.myParticipation?.status === "SUBMITTED";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/challenges" className="text-sm text-slate-500 hover:text-slate-700">&larr; 返回挑战赛列表</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-lg font-bold text-indigo-600">
              {challenge.enterprise.companyName.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-slate-900">{challenge.enterprise.companyName}</p>
              <p className="text-xs text-slate-400">{challenge.enterprise.industry}</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-3">{challenge.title}</h1>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{challenge.category}</span>
            <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">{REWARD_LABELS[challenge.rewardType]}</span>
            <span className="text-xs text-slate-400">{challenge._count.participations}/{challenge.maxParticipants} 人参与</span>
            <span className={`text-xs font-medium ${daysLeft <= 3 ? "text-red-500" : "text-slate-500"}`}>
              {daysLeft > 0 ? `剩余 ${daysLeft} 天` : "已结束"}
            </span>
          </div>

          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line">
            {challenge.description}
          </div>
        </div>

        {challenge.requirements && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">参赛要求</h2>
            <p className="text-sm text-slate-600 whitespace-pre-line">{challenge.requirements}</p>
          </div>
        )}

        {challenge.rewardDetail && (
          <div className="card bg-amber-50 border-amber-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">奖励详情</h2>
            <p className="text-sm text-slate-700">{challenge.rewardDetail}</p>
          </div>
        )}

        {msg && (
          <div className={`p-3 rounded-lg text-sm ${msg.includes("失败") || msg.includes("错误") ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-600 border border-green-200"}`}>
            {msg}
          </div>
        )}

        {!isParticipating ? (
          <button onClick={handleJoin} disabled={joining || daysLeft === 0} className="btn-primary w-full text-lg py-3">
            {joining ? "加入中..." : daysLeft > 0 ? "参与挑战赛" : "已结束"}
          </button>
        ) : hasSubmitted ? (
          <div className="card bg-green-50 border-green-200 text-center">
            <p className="text-green-700 font-medium">作品已提交，等待企业评审</p>
          </div>
        ) : (
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">提交作品</h2>
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
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs">
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
