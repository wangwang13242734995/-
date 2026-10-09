"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface EnterpriseInfo {
  id: string;
  companyName: string;
  status: string;
  challenges: Array<{
    id: string;
    title: string;
    status: string;
    startDate: string;
    endDate: string;
    _count?: { participations: number };
  }>;
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  PENDING: { text: "审核中", color: "bg-[#d4c7ff]/30 text-[#714cb6]" },
  APPROVED: { text: "已通过", color: "bg-[#0c4243]/10 text-[#0c4243]" },
  REJECTED: { text: "已拒绝", color: "bg-[#421d24]/10 text-[#421d24]" },
};

const CHALLENGE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  OPEN: "进行中",
  CLOSED: "已关闭",
  COMPLETED: "已完成",
};

export default function EnterpriseDashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [enterprise, setEnterprise] = useState<EnterpriseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");

  const updateChallengeStatus = async (challengeId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { setStatusMsg(data.error); return; }
      setStatusMsg(`挑战赛状态已更新为 ${CHALLENGE_STATUS_LABELS[newStatus] || newStatus}`);
      setEnterprise((prev) => prev ? {
        ...prev,
        challenges: prev.challenges.map((c) => c.id === challengeId ? { ...c, status: newStatus } : c)
      } : prev);
    } catch { setStatusMsg("操作失败"); }
  };

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/auth/login"); return; }
    fetch("/api/enterprise")
      .then((res) => res.json())
      .then((data) => { setEnterprise(data.enterprise); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authStatus, router]);

  if (loading) return <div className="min-h-screen bg-[#f2f0eb] flex items-center justify-center text-[#666666]">加载中...</div>;

  if (!enterprise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb]">
        <div className="text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-xl text-[#292827] mb-2" style={{ fontWeight: 460 }}>你还未认证企业</h2>
          <p className="text-[#666666] mb-4">完成企业认证后即可发布挑战赛</p>
          <Link href="/enterprise/register" className="btn-primary">去认证</Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[enterprise.status] || { text: enterprise.status, color: "bg-[#e3e3e2] text-[#666666]" };

  return (
    <div className="min-h-screen bg-[#f2f0eb]">
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#e3e3e2] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-[#292827]" style={{ fontSize: 20, fontWeight: 460 }}>{enterprise.companyName}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
          </div>
          <div className="flex items-center gap-3">
            {enterprise.status === "APPROVED" && (
              <Link href="/enterprise/challenges/new" className="btn-primary text-sm">发布挑战赛</Link>
            )}
            {enterprise.status === "APPROVED" && (
              <Link href="/enterprise/talents" className="btn-secondary text-sm">人才搜索</Link>
            )}
            <Link href="/dashboard" className="btn-secondary text-sm">学生仪表盘</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {statusMsg && (
          <div className={`p-3 rounded-xl text-sm ${statusMsg.includes("失败") || statusMsg.includes("无权限") ? "bg-[#421d24]/10 text-[#421d24] border border-[#421d24]/20" : "bg-[#0c4243]/10 text-[#0c4243] border border-[#0c4243]/20"}`}>{statusMsg}</div>
        )}

        {enterprise.status === "PENDING" && (
          <div className="bg-white border border-[#d4c7ff] rounded-2xl p-4">
            <p className="text-[#714cb6]">你的企业认证正在审核中，审核通过后即可发布挑战赛。</p>
          </div>
        )}

        {enterprise.status === "REJECTED" && (
          <div className="bg-white border border-[#421d24]/20 rounded-2xl p-4">
            <p className="text-[#421d24]">企业认证未通过，请核实企业信息后重新提交。</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-[#292827]" style={{ fontSize: 18, fontWeight: 460 }}>我的挑战赛</h2>
          <span className="text-sm text-[#666666]">{enterprise.challenges.length} 个</span>
        </div>

        {enterprise.challenges.length === 0 ? (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 text-center py-12">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-[#666666] mb-4">还没有发布挑战赛</p>
            {enterprise.status === "APPROVED" && (
              <Link href="/enterprise/challenges/new" className="btn-primary">发布第一个挑战赛</Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {enterprise.challenges.map((c) => (
              <div key={c.id} className="bg-white border border-[#e3e3e2] rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h3 className="text-[#292827]" style={{ fontWeight: 540 }}>{c.title}</h3>
                  <p className="text-sm text-[#666666] mt-1">
                    {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {c.status === "DRAFT" && (
                    <button onClick={() => updateChallengeStatus(c.id, "OPEN")} className="text-xs px-2 py-1 bg-[#0c4243]/10 text-[#0c4243] border border-[#0c4243]/20 rounded-full hover:bg-[#0c4243]/20 transition">
                      发布
                    </button>
                  )}
                  {c.status === "OPEN" && (
                    <>
                      <Link href={`/enterprise/challenges/${c.id}/review`} className="text-sm px-3 py-1 bg-[#d4c7ff]/30 text-[#714cb6] border border-[#d4c7ff] rounded-full hover:bg-[#d4c7ff]/50 transition">
                        评审作品
                      </Link>
                      <button onClick={() => updateChallengeStatus(c.id, "CLOSED")} className="text-xs px-2 py-1 bg-[#f2f0eb] text-[#666666] border border-[#e3e3e2] rounded-full hover:border-[#421d24] hover:text-[#421d24] transition">
                        关闭
                      </button>
                    </>
                  )}
                  {c.status === "CLOSED" && (
                    <>
                      <button onClick={() => updateChallengeStatus(c.id, "OPEN")} className="text-xs px-2 py-1 bg-[#0c4243]/10 text-[#0c4243] border border-[#0c4243]/20 rounded-full hover:bg-[#0c4243]/20 transition">
                        重新开放
                      </button>
                      <button onClick={() => updateChallengeStatus(c.id, "COMPLETED")} className="text-xs px-2 py-1 bg-[#d4c7ff]/30 text-[#714cb6] border border-[#d4c7ff] rounded-full hover:bg-[#d4c7ff]/50 transition">
                        标记完成
                      </button>
                    </>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.status === "OPEN" ? "bg-[#0c4243]/10 text-[#0c4243]" :
                    c.status === "DRAFT" ? "bg-[#e3e3e2] text-[#666666]" :
                    c.status === "COMPLETED" ? "bg-[#d4c7ff]/30 text-[#714cb6]" :
                    "bg-[#f2f0eb] text-[#666666]" 
                  }`}>
                    {CHALLENGE_STATUS_LABELS[c.status] || c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
