"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EnterpriseRegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    description: "",
    website: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">请先登录</p>
          <Link href="/auth/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/enterprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "提交失败"); return; }
      setSuccess(true);
    } catch {
      setError("提交失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 px-4">
        <div className="card max-w-md text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">认证申请已提交</h1>
          <p className="text-slate-500 mb-6">我们将在 1-3 个工作日内审核你的企业资质。审核通过后，你将可以发布挑战赛。</p>
          <Link href="/dashboard" className="btn-primary">返回仪表盘</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">企业入驻履程</h1>
          <p className="text-slate-500 mt-2">发布挑战赛，发现真正有能力的候选人</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">企业名称 *</label>
            <input type="text" value={form.companyName} onChange={(e) => update("companyName", e.target.value)}
              className="input-field" placeholder="公司全称" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">行业</label>
            <select value={form.industry} onChange={(e) => update("industry", e.target.value)} className="input-field">
              <option value="">请选择</option>
              {["互联网/科技", "金融", "教育", "电商", "游戏", "医疗健康", "制造业", "媒体/广告", "其他"].map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">企业官网</label>
            <input type="url" value={form.website} onChange={(e) => update("website", e.target.value)}
              className="input-field" placeholder="https://" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">企业简介</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
              className="input-field min-h-[80px]" placeholder="简要介绍你的企业和业务" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "提交中..." : "提交认证"}
          </button>
        </form>
      </div>
    </div>
  );
}
