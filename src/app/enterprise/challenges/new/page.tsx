"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewChallengePage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    requirements: "",
    maxParticipants: "100",
    duration: "14",
    startDate: "",
    rewardType: "CERTIFICATE",
    rewardDetail: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/auth/login" className="btn-primary">请先登录</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          maxParticipants: parseInt(form.maxParticipants),
          duration: parseInt(form.duration),
          publish,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "创建失败"); return; }
      router.push("/enterprise/dashboard");
    } catch {
      setError("创建失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/enterprise/dashboard" className="text-sm text-slate-500 hover:text-slate-700">&larr; 返回企业面板</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">发布挑战赛</h1>
          <p className="text-slate-500 mt-1">设计一个真实的业务场景任务，发现有能力的人才</p>
        </div>

        <form className="card space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">挑战赛标题 *</label>
            <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)}
              className="input-field" placeholder="如：用 React 重构我们的商品详情页" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">品类 *</label>
              <select value={form.category} onChange={(e) => update("category", e.target.value)} className="input-field" required>
                <option value="">请选择</option>
                {["前端开发", "后端开发", "设计", "数据分析", "产品", "运营", "AI/机器学习", "写作"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">持续时间（天）</label>
              <input type="number" value={form.duration} onChange={(e) => update("duration", e.target.value)}
                className="input-field" min="1" max="90" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">任务描述 *</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
              className="input-field min-h-[150px]" placeholder="描述任务背景、目标和期望产出..." required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">参赛要求</label>
            <textarea value={form.requirements} onChange={(e) => update("requirements", e.target.value)}
              className="input-field min-h-[80px]" placeholder="需要掌握的技能或提交物要求" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">最大参与人数</label>
              <input type="number" value={form.maxParticipants} onChange={(e) => update("maxParticipants", e.target.value)}
                className="input-field" min="1" max="10000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">开始日期 *</label>
              <input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)}
                className="input-field" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">奖励类型</label>
            <select value={form.rewardType} onChange={(e) => update("rewardType", e.target.value)} className="input-field">
              <option value="INTERVIEW_PASS">面试直通卡</option>
              <option value="GREEN_CHANNEL">面试绿色通道</option>
              <option value="MENTORSHIP">企业导师辅导</option>
              <option value="CASH">现金奖励</option>
              <option value="CERTIFICATE">完成证明</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">奖励详情</label>
            <input type="text" value={form.rewardDetail} onChange={(e) => update("rewardDetail", e.target.value)}
              className="input-field" placeholder="如：前三名获得终面资格，所有完成者获得电子证书" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={(e) => handleSubmit(e as unknown as React.FormEvent, false)}
              disabled={loading} className="btn-secondary flex-1">
              {loading ? "保存中..." : "保存为草稿"}
            </button>
            <button type="button" onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
              disabled={loading} className="btn-primary flex-1">
              {loading ? "发布中..." : "立即发布"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
