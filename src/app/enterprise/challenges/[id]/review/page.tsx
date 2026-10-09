"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Submission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  submission: string | null;
  links: string[];
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  feedback: string | null;
  rank: number | null;
}

const STATUS_STYLES: Record<string, string> = {
  IN_PROGRESS: "bg-[#e3e3e2] text-[#666666]",
  SUBMITTED: "bg-[#d4c7ff]/30 text-[#714cb6]",
  ACCEPTED: "bg-[#0c4243]/10 text-[#0c4243]",
  REJECTED: "bg-[#421d24]/10 text-[#421d24]",
};

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "进行中",
  SUBMITTED: "已提交",
  ACCEPTED: "已通过",
  REJECTED: "已拒绝",
};

export default function ChallengeReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [challenge, setChallenge] = useState<{ id: string; title: string; status: string } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [rankText, setRankText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/auth/login"); return; }
    if (authStatus === "authenticated") {
      fetch(`/api/enterprise/challenges/${id}/review`)
        .then(async (res) => {
          if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
          return res.json();
        })
        .then((data) => {
          setChallenge(data.challenge);
          setSubmissions(data.submissions || []);
          setLoading(false);
        })
        .catch((e) => { setMsg(e.message); setLoading(false); });
    }
  }, [authStatus, id, router]);

  const handleReview = async (participationId: string, action: "ACCEPT" | "REJECT" | "RANK") => {
    setReviewing(participationId);
    setMsg("");
    try {
      const payload: Record<string, unknown> = { participationId, action };
      if (feedbackText) payload.feedback = feedbackText;
      if (action === "RANK" && rankText) payload.rank = Number(rankText);

      const res = await fetch(`/api/enterprise/challenges/${id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error); return; }

      // Update local state
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === participationId
            ? { ...s, status: action === "REJECT" ? "REJECTED" : "ACCEPTED", feedback: feedbackText || s.feedback, rank: action === "RANK" ? Number(rankText) : s.rank, reviewedAt: new Date().toISOString() }
            : s
        )
      );
      setFeedbackText("");
      setRankText("");
      setExpandedId(null);
      setMsg("评审已提交");
    } catch {
      setMsg("操作失败");
    } finally {
      setReviewing(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#f2f0eb] flex items-center justify-center text-[#666666]">加载中...</div>;

  return (
    <div className="min-h-screen bg-[#f2f0eb]">
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#e3e3e2] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/enterprise/dashboard" className="link-violet text-sm">&larr; 返回</Link>
            <h1 className="text-[#292827]" style={{ fontSize: 20, fontWeight: 460 }}>
              {challenge?.title || "评审作品"}
            </h1>
          </div>
          <span className="text-sm text-[#666666]">{submissions.length} 份提交</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-4">
        {msg && (
          <div className={`p-3 rounded-xl text-sm ${msg.includes("失败") ? "bg-[#421d24]/10 text-[#421d24] border border-[#421d24]/20" : "bg-[#0c4243]/10 text-[#0c4243] border border-[#0c4243]/20"}`}>{msg}</div>
        )}

        {submissions.length === 0 ? (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-[#666666]">还没有学生提交作品</p>
          </div>
        ) : (
          submissions.map((sub) => (
            <div key={sub.id} className="bg-white border border-[#e3e3e2] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#d4c7ff] rounded-xl flex items-center justify-center text-sm text-[#421d24]" style={{ fontWeight: 540 }}>
                    {sub.userName?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-[#292827]" style={{ fontWeight: 540 }}>{sub.userName}</p>
                    <p className="text-xs text-[#666666]">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString("zh-CN") : "未提交"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sub.rank && <span className="text-xs px-2 py-0.5 bg-[#0c4243]/10 text-[#0c4243] rounded-full">第 {sub.rank} 名</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[sub.status] || ""}`}>
                    {STATUS_LABELS[sub.status] || sub.status}
                  </span>
                </div>
              </div>

              {sub.submission && (
                <div className="mb-3">
                  <p className={`text-sm text-[#292827] leading-relaxed ${expandedId === sub.id ? "" : "line-clamp-3"}`}>
                    {sub.submission}
                  </p>
                  {sub.submission.length > 150 && (
                    <button onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)} className="text-xs text-[#714cb6] mt-1">
                      {expandedId === sub.id ? "收起" : "展开全文"}
                    </button>
                  )}
                </div>
              )}

              {sub.links.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {sub.links.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-[#f2f0eb] text-[#714cb6] rounded-full border border-[#e3e3e2] hover:border-[#714cb6]">
                      {link.replace(/https?:\/\//, "").slice(0, 30)}
                    </a>
                  ))}
                </div>
              )}

              {sub.feedback && (
                <div className="mb-3 p-3 bg-[#f2f0eb] rounded-xl text-sm text-[#666666]">
                  <span className="text-xs text-[#292827]" style={{ fontWeight: 540 }}>评审反馈：</span>{sub.feedback}
                </div>
              )}

              {/* Review controls */}
              {sub.status === "SUBMITTED" && (
                <div className="pt-3 border-t border-[#e3e3e2]">
                  {expandedId === `review_${sub.id}` ? (
                    <div className="space-y-3">
                      <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                        className="input-field min-h-[60px]" placeholder="给出评审反馈（可选）..." />
                      <input type="number" value={rankText} onChange={(e) => setRankText(e.target.value)}
                        className="input-field" placeholder="排名（可选，用于 RANK 操作）" min={1} />
                      <div className="flex gap-2">
                        <button onClick={() => handleReview(sub.id, "ACCEPT")} disabled={reviewing === sub.id}
                          className="px-4 py-2 bg-[#0c4243] text-white rounded-xl text-sm hover:opacity-90 transition">通过</button>
                        <button onClick={() => handleReview(sub.id, "REJECT")} disabled={reviewing === sub.id}
                          className="px-4 py-2 bg-[#421d24] text-white rounded-xl text-sm hover:opacity-90 transition">拒绝</button>
                        {rankText && (
                          <button onClick={() => handleReview(sub.id, "RANK")} disabled={reviewing === sub.id}
                            className="px-4 py-2 bg-[#714cb6] text-white rounded-xl text-sm hover:opacity-90 transition">排名</button>
                        )}
                        <button onClick={() => setExpandedId(null)} className="px-4 py-2 bg-[#f2f0eb] text-[#292827] rounded-xl text-sm border border-[#e3e3e2]">取消</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setExpandedId(`review_${sub.id}`); setFeedbackText(""); setRankText(""); }}
                      className="text-sm text-[#714cb6] hover:underline">评审此作品</button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
