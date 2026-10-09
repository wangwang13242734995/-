"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";

interface Capsule {
  id: string;
  goal: string;
  writtenAt: string;
  openDates: string[];
  openedAt: string | null;
  nextOpenDate: string | null;
  isReadyToOpen: boolean;
}

export default function TimeCapsulePage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ goal: "", dates: [""] });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openedCapsule, setOpenedCapsule] = useState<{
    goal: string;
    currentScores: { craft: number; learn: number; drive: number; team: number; grit: number; express: number } | null;
    thenScores: { craft: number; learn: number; drive: number; team: number; grit: number; express: number } | null;
  } | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/auth/login"); return; }
    fetch("/api/time-capsule")
      .then((res) => res.json())
      .then((data) => { setCapsules(data.capsules || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authStatus, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/time-capsule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: form.goal, openDates: form.dates.filter(Boolean) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setShowForm(false);
      setForm({ goal: "", dates: [""] });
      window.location.reload();
    } catch { setError("创建失败"); }
    finally { setSubmitting(false); }
  };

  const handleOpen = async (capsuleId: string) => {
    try {
      const res = await fetch("/api/time-capsule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capsuleId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return; }
      setOpenedCapsule(data);
      window.location.reload();
    } catch { alert("开启失败"); }
  };

  if (loading) return <div className="min-h-screen bg-[#f2f0eb] flex items-center justify-center text-[#666666]">加载中...</div>;

  return (
    <div className="min-h-screen bg-[#f2f0eb] flex flex-col">
      <Header />

      <main className="flex-1 max-w-[800px] mx-auto w-full px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#292827]" style={{ fontSize: 26, fontWeight: 460, lineHeight: 1.3 }}>时光胶囊</h1>
            <p className="text-sm text-[#666666] mt-1">给未来的自己写一封信</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm !py-2 !px-4">
              {showForm ? "取消" : "+ 封存新胶囊"}
            </button>
          </div>
        </div>
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827]" style={{ fontSize: 19, fontWeight: 460 }}>写下你的目标</h2>
            {error && <div className="p-3 bg-[#421d24]/10 border border-[#421d24]/20 text-[#421d24] rounded-xl text-sm">{error}</div>}

            <textarea
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              className="input-field min-h-[100px]"
              placeholder="写下你想在未来实现的目标，比如「3个月内独立开发一个完整的电商网站」..."
              required
              minLength={10}
            />

            <div>
              <label className="block text-sm text-[#292827] mb-2" style={{ fontWeight: 540 }}>设定开启日期</label>
              {form.dates.map((d, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="date" value={d}
                    onChange={(e) => {
                      const newDates = [...form.dates];
                      newDates[i] = e.target.value;
                      setForm({ ...form, dates: newDates });
                    }}
                    className="input-field" min={new Date().toISOString().split("T")[0]} />
                  {form.dates.length > 1 && (
                    <button type="button" onClick={() => setForm({ ...form, dates: form.dates.filter((_, j) => j !== i) })}
                      className="text-red-400 hover:text-red-600">x</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setForm({ ...form, dates: [...form.dates, ""] })}
                className="link-violet text-sm">+ 添加更多开启日期</button>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "封存中..." : "封存时光胶囊"}
            </button>
          </form>
        )}

        {openedCapsule && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 border-l-4 border-l-[#714cb6]">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">📬</div>
              <h3 className="text-lg text-[#292827]" style={{ fontWeight: 460 }}>时光胶囊已开启</h3>
              <p className="text-[#666666] mt-2 italic">&ldquo;{openedCapsule.goal}&rdquo;</p>
            </div>
            {openedCapsule.thenScores && openedCapsule.currentScores && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "专业力", then: openedCapsule.thenScores.craft, now: openedCapsule.currentScores.craft },
                  { label: "学习力", then: openedCapsule.thenScores.learn, now: openedCapsule.currentScores.learn },
                  { label: "自驱力", then: openedCapsule.thenScores.drive, now: openedCapsule.currentScores.drive },
                  { label: "协作力", then: openedCapsule.thenScores.team, now: openedCapsule.currentScores.team },
                  { label: "抗压力", then: openedCapsule.thenScores.grit, now: openedCapsule.currentScores.grit },
                  { label: "表达力", then: openedCapsule.thenScores.express, now: openedCapsule.currentScores.express },
                ].map(({ label, then, now }) => (
                  <div key={label} className="text-center bg-[#f2f0eb] rounded-xl p-2 border border-[#e3e3e2]">
                    <div className="text-xs text-[#666666]">{label}</div>
                    <div className="text-sm text-[#666666] line-through">{Math.round(then)}</div>
                    <div className="text-lg text-[#714cb6]" style={{ fontWeight: 540 }}>{Math.round(now)}</div>
                    <div className={`text-xs ${now > then ? "text-[#0c4243]" : "text-[#666666]"}`} style={{ fontWeight: 540 }}>
                      {now > then ? `+${Math.round(now - then)}` : "0"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {capsules.length === 0 && !showForm ? (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">💊</div>
            <h2 className="text-xl text-[#292827] mb-2" style={{ fontWeight: 460 }}>还没有时光胶囊</h2>
            <p className="text-[#666666] mb-4">给未来的自己设定一个目标，到时候看看你走了多远</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">封存第一个胶囊</button>
          </div>
        ) : (
          <div className="space-y-3">
            {capsules.map((c) => {
              const daysToOpen = c.nextOpenDate
                ? Math.ceil((new Date(c.nextOpenDate).getTime() - Date.now()) / 86400000)
                : null;

              return (
                <div key={c.id} className="bg-white border border-[#e3e3e2] rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[#292827]" style={{ fontWeight: 540 }}>{c.goal}</p>
                      <p className="text-xs text-[#666666] mt-1">
                        封存于 {new Date(c.writtenAt).toLocaleDateString()}
                        {c.openDates.length > 0 && ` · ${c.openDates.length} 个开启日期`}
                      </p>
                    </div>
                    <div className="text-right">
                      {c.openedAt ? (
                        <span className="text-xs px-2 py-0.5 bg-[#0c4243]/10 text-[#0c4243] rounded-full">已开启</span>
                      ) : c.isReadyToOpen ? (
                        <button onClick={() => handleOpen(c.id)} className="text-xs px-3 py-1 bg-[#421d24] text-white rounded-full hover:bg-[#5a2830]">
                          立即开启
                        </button>
                      ) : daysToOpen !== null ? (
                        <span className="text-xs px-2 py-0.5 bg-[#d4c7ff]/30 text-[#714cb6] rounded-full">{daysToOpen} 天后开启</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-[#e3e3e2] text-[#666666] rounded-full">等待中</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
