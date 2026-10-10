"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardData {
  enterprise: { id: string; companyName: string; status: string; industry: string | null; companySize: string | null; verificationLevel: string; creditCodeMasked: string | null; legalPerson: string | null };
  stats: { pendingReviews: number; totalParticipants: number; activeChallenges: number; totalChallenges: number };
  challenges: Array<{ id: string; title: string; status: string; startDate: string; endDate: string; participantCount: number }>;
  topTalents: Array<{ id: string; name: string; major: string | null; graduationYear: number | null; totalScore: number; scores: { craft: number; learn: number; drive: number; team: number; grit: number; express: number } | null; lastChallenge: string }>;
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  PENDING: { text: "审核中", color: "bg-[#d4c7ff]/30 text-[#714cb6]" },
  APPROVED: { text: "已认证", color: "bg-[#0c4243]/10 text-[#0c4243]" },
  REJECTED: { text: "未通过", color: "bg-[#421d24]/10 text-[#421d24]" },
};

function MiniRadar({ scores }: { scores: { craft: number; learn: number; drive: number; team: number; grit: number; express: number } }) {
  const dims = [scores.craft, scores.learn, scores.drive, scores.team, scores.grit, scores.express];
  const max = 100;
  const cx = 30, cy = 30, r = 24;
  const angle = (i: number) => (Math.PI * 2 * i) / 6 - Math.PI / 2;
  const points = dims.map((v, i) => {
    const ratio = v / max;
    return `${cx + r * ratio * Math.cos(angle(i))},${cy + r * ratio * Math.sin(angle(i))}`;
  }).join(" ");
  const hexPoints = Array.from({ length: 6 }, (_, i) =>
    `${cx + r * Math.cos(angle(i))},${cy + r * Math.sin(angle(i))}`
  ).join(" ");

  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="shrink-0">
      <polygon points={hexPoints} fill="none" stroke="#e3e3e2" strokeWidth="0.5" />
      <polygon points={points} fill="#714cb6" fillOpacity="0.2" stroke="#714cb6" strokeWidth="1.5" />
    </svg>
  );
}

export default function EnterpriseDashboardPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVerify, setShowVerify] = useState(false);
  const [legalPerson, setLegalPerson] = useState("");
  const [blUrl, setBlUrl] = useState("");
  const [verifyMsg, setVerifyMsg] = useState("");
  const [verifying, setVerifying] = useState(false);

  const loadDashboard = () => {
    fetch("/api/enterprise/dashboard")
      .then((res) => res.json())
      .then((d) => setData(d.dashboard));
  };

  const submitVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyMsg("");
    const res = await fetch("/api/enterprise/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legalPerson, businessLicenseUrl: blUrl || undefined }),
    });
    const d = await res.json();
    setVerifyMsg(res.ok ? d.message : (d.error || "提交失败"));
    if (res.ok) { setLegalPerson(""); setBlUrl(""); loadDashboard(); }
    setVerifying(false);
  };

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/auth/login"); return; }
    fetch("/api/enterprise/dashboard")
      .then((res) => res.json())
      .then((d) => { setData(d.dashboard); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authStatus, router]);

  if (loading) return <div className="min-h-screen bg-[#f2f0eb] flex items-center justify-center text-[#666666]">加载中...</div>;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb]">
        <div className="text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="text-xl text-[#292827] mb-2" style={{ fontWeight: 460 }}>你还未认证企业</h2>
          <p className="text-[#666666] mb-4">完成企业认证后即可发布挑战赛、搜索人才</p>
          <Link href="/enterprise/register" className="btn-primary">提交企业认证</Link>
        </div>
      </div>
    );
  }

  const st = STATUS_LABELS[data.enterprise.status] || { text: data.enterprise.status, color: "bg-[#e3e3e2] text-[#666666]" };

  return (
    <div className="min-h-screen bg-[#f2f0eb]">
      {/* Top bar */}
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#e3e3e2] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#421d24] rounded-lg flex items-center justify-center text-white text-sm" style={{ fontWeight: 600 }}>
              {data.enterprise.companyName.charAt(0)}
            </div>
            <div>
              <h1 className="text-[#292827]" style={{ fontSize: 18, fontWeight: 540 }}>{data.enterprise.companyName}</h1>
              <p className="text-xs text-[#666666]">{data.enterprise.industry} · {data.enterprise.companySize}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.text}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-secondary text-sm">学生视角</Link>
            <Link href="/enterprise/talents" className="btn-secondary text-sm">人才搜索</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Action bar - what needs doing NOW */}
        <div className="grid md:grid-cols-3 gap-4">
          {data.enterprise.status === "APPROVED" ? (
            <>
              <div className="bg-white border border-[#e3e3e2] rounded-2xl p-5 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-[#421d24] rounded-full animate-pulse"></span>
                  <span className="text-xs text-[#666666]">待评审</span>
                </div>
                <p className="text-3xl text-[#292827]" style={{ fontWeight: 460 }}>{data.stats.pendingReviews}</p>
                <p className="text-sm text-[#666666] mt-1">份作品等待你的反馈</p>
                {data.stats.pendingReviews > 0 && (
                  <Link href={`/enterprise/challenges/${data.challenges.find(c => c.status === "OPEN")?.id || ""}/review`}
                    className="mt-3 text-sm text-[#714cb6] hover:underline" style={{ fontWeight: 540 }}>
                    立即评审 →
                  </Link>
                )}
              </div>

              <div className="bg-white border border-[#e3e3e2] rounded-2xl p-5 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-[#0c4243] rounded-full"></span>
                  <span className="text-xs text-[#666666]">进行中</span>
                </div>
                <p className="text-3xl text-[#292827]" style={{ fontWeight: 460 }}>{data.stats.activeChallenges}</p>
                <p className="text-sm text-[#666666] mt-1">个挑战赛 · {data.stats.totalParticipants} 人已参与</p>
                <Link href="/enterprise/challenges/new" className="mt-3 text-sm text-[#714cb6] hover:underline" style={{ fontWeight: 540 }}>
                  发布新挑战 →
                </Link>
              </div>

              <div className="bg-white border border-[#e3e3e2] rounded-2xl p-5 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-[#714cb6] rounded-full"></span>
                  <span className="text-xs text-[#666666]">人才池</span>
                </div>
                <p className="text-3xl text-[#292827]" style={{ fontWeight: 460 }}>{data.stats.totalParticipants}</p>
                <p className="text-sm text-[#666666] mt-1">参与过你的挑战赛的学生</p>
                <Link href="/enterprise/talents" className="mt-3 text-sm text-[#714cb6] hover:underline" style={{ fontWeight: 540 }}>
                  发现更多人才 →
                </Link>
              </div>
            </>
          ) : (
            <div className="md:col-span-3 bg-white border border-[#d4c7ff] rounded-2xl p-6 text-center">
              <p className="text-[#714cb6] mb-3" style={{ fontWeight: 460 }}>
                {data.enterprise.status === "PENDING" ? "企业认证正在审核中，通过后即可使用全部功能" : "企业认证未通过"}
              </p>
              <Link href="/enterprise/register" className="btn-primary text-sm">完善企业信息</Link>
            </div>
          )}
        </div>

        {/* 企业认证状态（信任徽章） */}
        <section className="bg-white border border-[#e3e3e2] rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {data.enterprise.verificationLevel === "DEEP" ? (
                <span className="text-xs px-2.5 py-1 bg-[#0c4243] text-white rounded-full" style={{ fontWeight: 540 }}>✅ 已核验企业</span>
              ) : data.enterprise.verificationLevel === "PENDING_DEEP" ? (
                <span className="text-xs px-2.5 py-1 bg-[#d4c7ff]/40 text-[#714cb6] rounded-full" style={{ fontWeight: 540 }}>深度认证审核中</span>
              ) : (
                <span className="text-xs px-2.5 py-1 bg-[#f2f0eb] text-[#666666] rounded-full border border-[#e3e3e2]" style={{ fontWeight: 540 }}>基础认证</span>
              )}
              {data.enterprise.creditCodeMasked && (
                <span className="text-xs text-[#666666] font-mono">信用代码 {data.enterprise.creditCodeMasked}</span>
              )}
            </div>
            {data.enterprise.verificationLevel === "BASIC" && (
              <button onClick={() => setShowVerify((v) => !v)} className="text-sm text-[#714cb6] hover:underline" style={{ fontWeight: 540 }}>
                申请「已核验」徽章 →
              </button>
            )}
          </div>
          <p className="text-xs text-[#666666] mt-2">
            {data.enterprise.verificationLevel === "DEEP"
              ? "企业资质已通过人工核验，学生端将展示「已核验企业」标记，提升挑战赛吸引力。"
              : data.enterprise.verificationLevel === "PENDING_DEEP"
              ? "已提交法人信息，平台将比对国家企业公示系统，1-3 个工作日内完成核验。"
              : "填写统一社会信用代码即完成基础认证。补充法人信息可申请深度核验徽章。"}
          </p>

          {showVerify && data.enterprise.verificationLevel === "BASIC" && (
            <form onSubmit={submitVerify} className="mt-4 pt-4 border-t border-[#e3e3e2] grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#666666] mb-1">法人姓名 *</label>
                <input type="text" value={legalPerson} onChange={(e) => setLegalPerson(e.target.value)} className="input-field" placeholder="营业执照法定代表人" required />
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">企业公示链接（选填）</label>
                <input type="url" value={blUrl} onChange={(e) => setBlUrl(e.target.value)} className="input-field" placeholder="https://www.gsxt.gov.cn/..." />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <button type="submit" disabled={verifying} className="btn-primary text-sm">{verifying ? "提交中..." : "提交深度认证"}</button>
                {verifyMsg && <span className="text-xs text-[#0c4243]">{verifyMsg}</span>}
              </div>
            </form>
          )}
        </section>

        {/* Recent talents from challenges */}
        {data.topTalents.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#292827]" style={{ fontSize: 18, fontWeight: 460 }}>近期参与者</h2>
              <Link href="/enterprise/talents" className="text-sm text-[#714cb6] hover:underline">查看全部 →</Link>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {data.topTalents.slice(0, 6).map((t) => (
                <Link key={t.id} href={`/profile/${t.id}`}
                  className="bg-white border border-[#e3e3e2] rounded-2xl p-4 flex items-center gap-4 hover:border-[#714cb6] transition-colors">
                  {t.scores && <MiniRadar scores={t.scores} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#292827]" style={{ fontWeight: 540 }}>{t.name}</p>
                    <p className="text-xs text-[#666666] mt-0.5 truncate">{t.lastChallenge}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-1.5 py-0.5 bg-[#d4c7ff]/30 text-[#714cb6] rounded" style={{ fontWeight: 540 }}>
                        {Math.round(t.totalScore)}分
                      </span>
                      {t.graduationYear && <span className="text-xs text-[#666666]">{t.graduationYear}年</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Challenge overview - compact */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#292827]" style={{ fontSize: 18, fontWeight: 460 }}>挑战赛管理</h2>
            {data.enterprise.status === "APPROVED" && (
              <Link href="/enterprise/challenges/new" className="btn-primary text-sm">+ 新挑战</Link>
            )}
          </div>
          {data.challenges.length === 0 ? (
            <div className="bg-white border border-[#e3e3e2] rounded-2xl p-8 text-center">
              <p className="text-[#666666]">还没有发布挑战赛</p>
            </div>
          ) : (
            <div className="bg-white border border-[#e3e3e2] rounded-2xl divide-y divide-[#e3e3e2]">
              {data.challenges.slice(0, 6).map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        c.status === "OPEN" ? "bg-[#0c4243]" : c.status === "DRAFT" ? "bg-[#e3e3e2]" : "bg-[#666666]"
                      }`} />
                      <span className="text-sm text-[#292827]" style={{ fontWeight: 460 }}>{c.title}</span>
                    </div>
                    <p className="text-xs text-[#666666] mt-1 ml-3.5">
                      {new Date(c.startDate).toLocaleDateString()} — {new Date(c.endDate).toLocaleDateString()} · {c.participantCount} 人参与
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.status === "OPEN" && (
                      <Link href={`/enterprise/challenges/${c.id}/review`}
                        className="text-xs px-2.5 py-1 bg-[#d4c7ff]/30 text-[#714cb6] rounded-full hover:bg-[#d4c7ff]/50 transition">
                        评审
                      </Link>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.status === "OPEN" ? "bg-[#0c4243]/10 text-[#0c4243]" :
                      c.status === "DRAFT" ? "bg-[#e3e3e2] text-[#666666]" :
                      c.status === "COMPLETED" ? "bg-[#d4c7ff]/30 text-[#714cb6]" :
                      "bg-[#f2f0eb] text-[#666666]"
                    }`}>
                      {{ DRAFT: "草稿", OPEN: "进行中", CLOSED: "已关闭", COMPLETED: "已完成" }[c.status] || c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
