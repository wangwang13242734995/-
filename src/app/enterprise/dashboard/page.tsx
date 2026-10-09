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
  }>;
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  PENDING: { text: "审核中", color: "bg-amber-50 text-amber-600" },
  APPROVED: { text: "已通过", color: "bg-green-50 text-green-600" },
  REJECTED: { text: "已拒绝", color: "bg-red-50 text-red-600" },
};

export default function EnterpriseDashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [enterprise, setEnterprise] = useState<EnterpriseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/auth/login"); return; }
    fetch("/api/enterprise")
      .then((res) => res.json())
      .then((data) => { setEnterprise(data.enterprise); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authStatus, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">加载中...</div>;

  if (!enterprise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">你还未认证企业</h2>
          <p className="text-slate-500 mb-4">完成企业认证后即可发布挑战赛</p>
          <Link href="/enterprise/register" className="btn-primary">去认证</Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[enterprise.status] || { text: enterprise.status, color: "bg-slate-100" };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{enterprise.companyName}</h1>
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
        {enterprise.status === "PENDING" && (
          <div className="card bg-amber-50 border-amber-200">
            <p className="text-amber-700">你的企业认证正在审核中，审核通过后即可发布挑战赛。</p>
          </div>
        )}

        {enterprise.status === "REJECTED" && (
          <div className="card bg-red-50 border-red-200">
            <p className="text-red-700">企业认证未通过，请核实企业信息后重新提交。</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">我的挑战赛</h2>
          <span className="text-sm text-slate-400">{enterprise.challenges.length} 个</span>
        </div>

        {enterprise.challenges.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-slate-500 mb-4">还没有发布挑战赛</p>
            {enterprise.status === "APPROVED" && (
              <Link href="/enterprise/challenges/new" className="btn-primary">发布第一个挑战赛</Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {enterprise.challenges.map((c) => (
              <div key={c.id} className="card flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900">{c.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  c.status === "OPEN" ? "bg-green-50 text-green-600" :
                  c.status === "DRAFT" ? "bg-slate-100 text-slate-500" :
                  "bg-indigo-50 text-indigo-600"
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
