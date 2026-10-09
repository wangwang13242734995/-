"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface GrowthRecord {
  id: string;
  type: string;
  title: string;
  content: string;
  abilitySignals: string[];
  date: string;
  projectId: string | null;
}

const TYPE_OPTIONS = [
  { value: "MILESTONE", label: "里程碑", icon: "🏅" },
  { value: "PROBLEM_SOLVED", label: "解决难题", icon: "🧩" },
  { value: "NEW_SKILL", label: "新技能", icon: "📖" },
  { value: "COMPETITION", label: "比赛/挑战", icon: "⚔️" },
  { value: "DAILY", label: "日常随记", icon: "✏️" },
];

const TYPE_COLORS: Record<string, string> = {
  MILESTONE: "bg-[#d4c7ff]/30 text-[#714cb6]",
  PROBLEM_SOLVED: "bg-[#421d24]/10 text-[#421d24]",
  NEW_SKILL: "bg-[#0c4243]/10 text-[#0c4243]",
  COMPETITION: "bg-[#d4c7ff]/40 text-[#421d24]",
  DAILY: "bg-[#e3e3e2] text-[#666666]",
};

const ABILITY_OPTIONS = [
  { value: "craft", label: "专业力" },
  { value: "learn", label: "学习力" },
  { value: "drive", label: "自驱力" },
  { value: "team", label: "协作力" },
  { value: "grit", label: "抗压力" },
  { value: "express", label: "表达力" },
];

export default function RecordsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    type: "DAILY",
    title: "",
    content: "",
    abilitySignals: [] as string[],
  });

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      fetch("/api/records")
        .then((res) => res.json())
        .then((data) => { setRecords(data.records || []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const toggleSignal = (sig: string) => {
    setForm((prev) => ({
      ...prev,
      abilitySignals: prev.abilitySignals.includes(sig)
        ? prev.abilitySignals.filter((s) => s !== sig)
        : [...prev.abilitySignals, sig],
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setSaving(false); return; }
      setSuccess("记录已保存！");
      setForm({ type: "DAILY", title: "", content: "", abilitySignals: [] });
      setShowForm(false);
      // Refresh list
      const refreshed = await fetch("/api/records").then((r) => r.json());
      setRecords(refreshed.records || []);
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这条记录吗？")) return;
    const res = await fetch(`/api/records?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  if (loading || status === "loading") {
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
            <h1 className="text-[#292827]" style={{ fontSize: 26, fontWeight: 460, lineHeight: 1.3 }}>成长记录</h1>
            <p className="text-sm text-[#666666] mt-1">记录每一个值得被记住的时刻</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm !py-2 !px-4">
            {showForm ? "收起" : "+ 快速记录"}
          </button>
        </div>

        {success && (
          <div className="p-3 rounded-xl bg-[#0c4243]/10 border border-[#0c4243]/20 text-[#0c4243] text-sm">{success}</div>
        )}

        {/* Quick Record Form */}
        {showForm && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827]" style={{ fontWeight: 540 }}>新记录</h2>

            {/* Type selector */}
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map(({ value, label, icon }) => (
                <button key={value} onClick={() => setForm((p) => ({ ...p, type: value }))}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${form.type === value ? "bg-[#421d24] text-white" : "bg-[#f2f0eb] text-[#292827] border border-[#e3e3e2] hover:border-[#714cb6]"}`}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Title */}
            <div>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="input-field" placeholder="给这条记录起个标题" maxLength={100} />
            </div>

            {/* Content */}
            <div>
              <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                className="input-field min-h-[120px]" placeholder="详细描述你经历了什么、学到了什么、是怎么做的...（至少 50 字）" />
              <p className="text-xs text-[#666666] mt-1">{form.content.length} / 50 字（最少）</p>
            </div>

            {/* Ability signals */}
            <div>
              <label className="text-sm text-[#292827] block mb-2" style={{ fontWeight: 540 }}>关联能力维度</label>
              <div className="flex flex-wrap gap-2">
                {ABILITY_OPTIONS.map(({ value, label }) => (
                  <button key={value} onClick={() => toggleSignal(value)}
                    className={`px-3 py-1 rounded-full text-sm transition ${form.abilitySignals.includes(value) ? "bg-[#714cb6] text-white" : "bg-[#f2f0eb] text-[#292827] border border-[#e3e3e2]"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="text-sm text-[#421d24]">{error}</div>}

            <button onClick={handleSubmit} disabled={saving || form.title.length < 2 || form.content.length < 50 || form.abilitySignals.length === 0}
              className="btn-primary w-full">
              {saving ? "保存中..." : "保存记录"}
            </button>
          </div>
        )}

        {/* Records List */}
        {records.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🌱</div>
            <h2 className="text-lg text-[#292827] mb-2" style={{ fontWeight: 460 }}>还没有成长记录</h2>
            <p className="text-[#666666] text-sm">每一个里程碑都值得被记录。试着写下第一条吧。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const typeInfo = TYPE_OPTIONS.find((t) => t.value === record.type);
              return (
                <div key={record.id} className="bg-white border border-[#e3e3e2] rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[record.type] || ""}`}>
                          {typeInfo?.icon} {typeInfo?.label || record.type}
                        </span>
                        <span className="text-xs text-[#666666] opacity-70">
                          {new Date(record.date).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                      <h3 className="text-[#292827]" style={{ fontWeight: 540 }}>{record.title}</h3>
                      <p className="text-sm text-[#666666] mt-1 line-clamp-3">{record.content}</p>
                      {record.abilitySignals.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {record.abilitySignals.map((sig) => (
                            <span key={sig} className="text-xs px-2 py-0.5 bg-[#d4c7ff]/20 text-[#714cb6] rounded-full">
                              {ABILITY_OPTIONS.find((a) => a.value === sig)?.label || sig}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {!record.projectId && (
                      <button onClick={() => handleDelete(record.id)}
                        className="text-xs text-[#666666] hover:text-[#421d24] ml-3 shrink-0">删除</button>
                    )}
                  </div>
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
