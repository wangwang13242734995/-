"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Ent {
  id: string;
  companyName: string;
  industry: string | null;
  companySize: string | null;
  creditCode: string | null;
  legalPerson: string | null;
  website: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  address: string | null;
  recruitingNeeds: string | null;
  description: string | null;
  status: string;
  verificationLevel: string;
  createdAt: string;
  _count: { challenges: number };
}

interface Overview {
  counts: { pendingStatus: number; pendingDeep: number; approved: number };
  pendingStatus: Ent[];
  pendingDeep: Ent[];
  approved: Ent[];
}

const VERIFY_BADGE: Record<string, { text: string; cls: string }> = {
  BASIC: { text: "基础认证", cls: "bg-[#e3e3e2] text-[#666666]" },
  PENDING_DEEP: { text: "深度核验中", cls: "bg-[#d4c7ff]/40 text-[#714cb6]" },
  DEEP: { text: "✓ 已核验", cls: "bg-[#0c4243]/10 text-[#0c4243]" },
};

export default function AdminPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"status" | "deep" | "approved">("status");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/overview")
      .then((res) => {
        if (res.status === 401 || res.status === 403) { router.replace("/auth/login"); return null; }
        return res.json();
      })
      .then((d) => { if (d) setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.replace("/auth/login");
    if (authStatus === "authenticated") load();
  }, [authStatus, router, load]);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const review = async (id: string, action: "approve" | "reject", scope: "status" | "deep") => {
    let reason: string | undefined;
    if (action === "reject") {
      const r = window.prompt("请填写拒绝理由（会展示给企业）：");
      if (r === null) return;
      if (!r.trim()) { flash("拒绝必须填写理由"); return; }
      reason = r.trim();
    }
    setBusy(id + scope + action);
    const res = await fetch(`/api/admin/enterprises/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, scope, reason }),
    });
    const d = await res.json();
    flash(res.ok ? d.message : (d.error || "操作失败"));
    setBusy(null);
    if (res.ok) load();
  };

  if (loading) return <div className="min-h-screen bg-[#f2f0eb] flex items-center justify-center text-[#666666]">加载中...</div>;

  const list = tab === "status" ? data?.pendingStatus : tab === "deep" ? data?.pendingDeep : data?.approved;
  const countFor = (t: string) => t === "status" ? (data?.counts.pendingStatus ?? 0) : t === "deep" ? (data?.counts.pendingDeep ?? 0) : (data?.counts.approved ?? 0);

  return (
    <div className="min-h-screen bg-[#f2f0eb]">
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#e3e3e2] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#421d24] rounded-lg flex items-center justify-center text-white text-sm" style={{ fontWeight: 600 }}>管</div>
            <div>
              <h1 className="text-[#292827]" style={{ fontSize: 18, fontWeight: 540 }}>企业审核后台</h1>
              <p className="text-xs text-[#666666]">身份核验 · 信任背书</p>
            </div>
          </div>
          <Link href="/dashboard" className="btn-secondary text-sm">返回前台</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          {([
            { t: "status", label: "待基础认证", accent: "#714cb6" },
            { t: "deep", label: "待深度核验", accent: "#0c4243" },
            { t: "approved", label: "已认证企业", accent: "#421d24" },
          ] as const).map((s) => (
            <button
              key={s.t}
              onClick={() => setTab(s.t)}
              className={`text-left bg-white border rounded-2xl p-5 transition-all ${tab === s.t ? "border-[#292827] shadow-sm" : "border-[#e3e3e2] hover:border-[#c9c7c2]"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ background: s.accent }}></span>
                <span className="text-xs text-[#666666]">{s.label}</span>
              </div>
              <div className="text-3xl" style={{ fontWeight: 540, color: s.accent }}>{countFor(s.t)}</div>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {list && list.length === 0 && (
            <div className="bg-white border border-[#e3e3e2] rounded-2xl p-10 text-center text-[#666666]">
              <div className="text-4xl mb-3">✓</div>
              当前没有{tab === "status" ? "待基础认证" : tab === "deep" ? "待深度核验" : "已认证"}的企业
            </div>
          )}

          {list?.map((e) => {
            const open = expanded === e.id;
            const vb = VERIFY_BADGE[e.verificationLevel] || VERIFY_BADGE.BASIC;
            return (
              <div key={e.id} className="bg-white border border-[#e3e3e2] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpanded(open ? null : e.id)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#faf9f6]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#292827]" style={{ fontWeight: 540 }}>{e.companyName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${vb.cls}`}>{vb.text}</span>
                    </div>
                    <p className="text-xs text-[#666666] mt-1">
                      {e.industry || "未填行业"} · {e.companySize || "规模未填"} · 发起 {e._count.challenges} 场挑战
                      {e.creditCode && <> · 信用码 {e.creditCode.slice(0, 4)}****</>}
                    </p>
                  </div>
                  <span className="text-[#666666] shrink-0">{open ? "▲" : "▼"}</span>
                </button>

                {open && (
                  <div className="px-5 pb-5 pt-1 border-t border-[#e3e3e2] space-y-4">
                    <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <Info k="统一社会信用代码" v={e.creditCode} />
                      <Info k="法定代表人" v={e.legalPerson} />
                      <Info k="联系人" v={e.contactPerson} />
                      <Info k="联系邮箱" v={e.contactEmail} />
                      <Info k="官网" v={e.website} />
                      <Info k="地址" v={e.address} />
                    </dl>
                    {e.description && (
                      <div>
                        <p className="text-xs text-[#666666] mb-1">企业简介</p>
                        <p className="text-sm text-[#292827] leading-relaxed whitespace-pre-wrap">{e.description}</p>
                      </div>
                    )}
                    {e.recruitingNeeds && (
                      <div>
                        <p className="text-xs text-[#666666] mb-1">招聘需求</p>
                        <p className="text-sm text-[#292827] leading-relaxed whitespace-pre-wrap">{e.recruitingNeeds}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      {tab === "status" && (
                        <>
                          <button
                            disabled={busy !== null}
                            onClick={() => review(e.id, "approve", "status")}
                            className="btn-primary text-sm"
                            style={{ background: "#0c4243" }}
                          >{busy === e.id + "statusapprove" ? "处理中..." : "通过基础认证"}</button>
                          <button
                            disabled={busy !== null}
                            onClick={() => review(e.id, "reject", "status")}
                            className="btn-secondary text-sm"
                            style={{ color: "#421d24" }}
                          >{busy === e.id + "statusreject" ? "处理中..." : "拒绝"}</button>
                        </>
                      )}
                      {tab === "deep" && (
                        <>
                          {e.status === "APPROVED" ? (
                            <>
                              <button
                                disabled={busy !== null}
                                onClick={() => review(e.id, "approve", "deep")}
                                className="btn-primary text-sm"
                                style={{ background: "#714cb6" }}
                              >{busy === e.id + "deepapprove" ? "处理中..." : "授予「已核验」徽章"}</button>
                              <button
                                disabled={busy !== null}
                                onClick={() => review(e.id, "reject", "deep")}
                                className="btn-secondary text-sm"
                              >{busy === e.id + "deepreject" ? "处理中..." : "退回"}</button>
                            </>
                          ) : (
                            <p className="text-sm text-[#421d24]">⚠ 该企业尚未通过基础认证，请先在「待基础认证」中处理。</p>
                          )}
                        </>
                      )}
                      {tab === "approved" && (
                        <p className="text-sm text-[#666666]">已认证企业 · 当前核验等级：{vb.text}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#292827] text-white px-5 py-2.5 rounded-full text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function Info({ k, v }: { k: string; v: string | null }) {
  return (
    <div>
      <dt className="text-xs text-[#666666]">{k}</dt>
      <dd className="text-[#292827]">{v || "—"}</dd>
    </div>
  );
}
