import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { AbilityRadar } from "@/components/AbilityRadar";

const TYPE_LABELS: Record<string, string> = {
  COURSE: "课程作业", COMPETITION: "比赛项目", INTERNSHIP: "实习经历",
  PERSONAL: "个人项目", CHALLENGE: "挑战赛",
};

const DIM_META = [
  { key: "craft", label: "专业力" },
  { key: "learn", label: "学习力" },
  { key: "drive", label: "自驱力" },
  { key: "team", label: "协作力" },
  { key: "grit", label: "抗压力" },
  { key: "express", label: "表达力" },
] as const;

type Scores = { craft: number; learn: number; drive: number; team: number; grit: number; express: number };

/** 成长轨迹折线：综合能力分随时间快照的变化（纯 SVG，服务端渲染） */
function TrendLine({ points }: { points: { t: string; v: number }[] }) {
  if (points.length < 2) {
    return (
      <div className="h-[160px] flex flex-col items-center justify-center text-center border border-dashed border-[#e3e3e2] rounded-xl">
        <div className="text-3xl mb-2">📈</div>
        <p className="text-sm text-[#666666]">成长轨迹积累中</p>
        <p className="text-xs text-[#666666] opacity-70 mt-1">至少需要 2 次能力快照才能绘制趋势</p>
      </div>
    );
  }
  const W = 320, H = 160, padX = 16, padY = 20;
  const vals = points.map((p) => p.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i: number) => padX + (i * (W - padX * 2)) / (points.length - 1);
  const y = (v: number) => H - padY - ((v - min) / span) * (H - padY * 2);
  const line = points.map((p, i) => `${x(i)},${y(p.v)}`).join(" ");
  const area = `${padX},${H - padY} ${line} ${x(points.length - 1)},${H - padY}`;
  const rising = vals[vals.length - 1] >= vals[0];

  return (
    <div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="overflow-visible">
        <polygon points={area} fill="#714cb6" fillOpacity="0.08" />
        <polyline points={line} fill="none" stroke="#714cb6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.v)} r={i === points.length - 1 ? 4 : 2.5} fill={i === points.length - 1 ? "#421d24" : "#714cb6"} />
        ))}
      </svg>
      <div className="flex items-center justify-between mt-2 text-xs text-[#666666]">
        <span>{points[0].t} · {Math.round(points[0].v)} 分</span>
        <span className={rising ? "text-[#0c4243]" : "text-[#421d24]"} style={{ fontWeight: 540 }}>
          {rising ? "▲ 上升" : "▼ 回落"} {Math.round(Math.abs(vals[vals.length - 1] - vals[0]))} 分
        </span>
        <span>{points[points.length - 1].t} · {Math.round(points[points.length - 1].v)} 分</span>
      </div>
    </div>
  );
}

export default async function EnterpriseTalentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user) redirect("/auth/login");
  if (role !== "ENTERPRISE") redirect("/enterprise/dashboard");

  const ent = await prisma.enterprise.findUnique({ where: { userId: (session.user as { id: string }).id } });
  if (!ent || ent.status !== "APPROVED") redirect("/enterprise/dashboard");

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, major: true, graduationYear: true, bio: true,
      skills: true, avatar: true, school: true, role: true,
      abilityScores: { orderBy: { calculatedAt: "asc" } },
      projects: {
        where: { status: "PUBLISHED" },
        orderBy: { credibilityScore: "desc" },
        take: 4,
      },
      growthRecords: { orderBy: { createdAt: "desc" }, take: 5 },
      _count: { select: { projects: true, growthRecords: true } },
    },
  });

  if (!user || user.role !== "STUDENT") notFound();

  const skills: string[] = JSON.parse(user.skills || "[]");
  const latest = user.abilityScores[user.abilityScores.length - 1] || null;
  const scores: Scores = latest
    ? { craft: latest.craft, learn: latest.learn, drive: latest.drive, team: latest.team, grit: latest.grit, express: latest.express }
    : { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30 };
  const totalScore = latest?.totalScore ?? Math.round((Object.values(scores) as number[]).reduce((a, b) => a + b, 0) / 6);

  // 最强维度
  const strongest = DIM_META.reduce((best, d) => (scores[d.key] > scores[best.key] ? d : best), DIM_META[0]);

  // 可信度（全部已发布项目）
  const allCred = await prisma.project.findMany({ where: { userId: id, status: "PUBLISHED" }, select: { credibilityScore: true } });
  const avgCred = allCred.length ? Math.round((allCred.reduce((s, p) => s + p.credibilityScore, 0) / allCred.length) * 10) / 10 : 0;
  const highCount = allCred.filter((p) => p.credibilityScore >= 7).length;

  // 持续记录天数
  const recDates = new Set(user.growthRecords.map((r) => r.createdAt.toDateString()));
  const uniqueDays = recDates.size;

  const trend = user.abilityScores.map((a) => ({
    t: a.calculatedAt.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" }),
    v: a.totalScore,
  }));

  return (
    <div className="min-h-screen bg-[#f2f0eb]">
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#e3e3e2] px-6 py-4">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/enterprise/talents" className="text-sm text-[#666666] hover:text-[#714cb6] transition">&larr; 人才搜索</Link>
            <h1 className="text-[#292827]" style={{ fontSize: 18, fontWeight: 540 }}>能力名片</h1>
          </div>
          <Link href={`/profile/${id}`} className="btn-secondary text-sm" target="_blank">查看完整公开名片 ↗</Link>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-8 space-y-6">
        {/* Hero + 30秒速览 */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-[#421d24] rounded-2xl flex items-center justify-center text-2xl text-white shrink-0" style={{ fontWeight: 460 }}>
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[#292827]" style={{ fontSize: 24, fontWeight: 460 }}>{user.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-[#666666] flex-wrap">
                {user.major && <span>{user.major}</span>}
                {user.school && <span>· {user.school}</span>}
                {user.graduationYear && <span>· 预计 {user.graduationYear} 年入职</span>}
              </div>
              {user.bio && <p className="text-[#666666] mt-2 line-clamp-2">{user.bio}</p>}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {skills.slice(0, 8).map((sk) => (
                    <span key={sk} className="text-xs px-2 py-0.5 bg-[#f2f0eb] text-[#292827] rounded-full border border-[#e3e3e2]">{sk}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 30秒速览条 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Stat label="综合能力" value={`${Math.round(totalScore)}`} unit="/100" accent="#714cb6" />
            <Stat label="最强维度" value={strongest.label} unit={`${Math.round(scores[strongest.key])}分`} accent="#421d24" />
            <Stat label="代表项目" value={`${user._count.projects}`} unit={`高可信${highCount}`} accent="#0c4243" />
            <Stat label="平均可信度" value={`${avgCred}`} unit="/10" accent="#0c4243" />
          </div>
        </div>

        {/* 60% 视觉区：雷达 + 轨迹 */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 flex flex-col items-center">
            <h3 className="text-[#292827] self-start mb-1" style={{ fontSize: 17, fontWeight: 460 }}>能力雷达</h3>
            <AbilityRadar data={scores} size={280} />
          </div>
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
            <h3 className="text-[#292827] mb-4" style={{ fontSize: 17, fontWeight: 460 }}>成长轨迹</h3>
            <TrendLine points={trend} />
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
              {DIM_META.map((d) => (
                <div key={d.key} className="flex items-center gap-2">
                  <span className="text-xs text-[#666666] w-12">{d.label}</span>
                  <div className="flex-1 h-1.5 bg-[#e3e3e2] rounded-full overflow-hidden">
                    <div className="h-full bg-[#714cb6] rounded-full" style={{ width: `${scores[d.key]}%` }} />
                  </div>
                  <span className="text-xs text-[#666666] w-6 text-right">{Math.round(scores[d.key])}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 40% 文字区：代表项目 */}
        {user.projects.length > 0 && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
            <h3 className="text-[#292827] mb-4" style={{ fontSize: 17, fontWeight: 460 }}>代表项目</h3>
            <div className="grid gap-3">
              {user.projects.map((p) => {
                const links = [p.githubLink, p.designLink, p.videoLink, p.liveLink].filter(Boolean) as string[];
                return (
                  <div key={p.id} className="p-4 bg-[#f2f0eb] rounded-xl border border-[#e3e3e2] border-l-4 border-l-[#421d24]">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-[#d4c7ff]/30 text-[#714cb6] rounded-full">{TYPE_LABELS[p.type] || p.type}</span>
                      {p.credibilityScore >= 7 && <span className="text-xs px-2 py-0.5 bg-[#0c4243]/10 text-[#0c4243] rounded-full">高可信 {p.credibilityScore}/10</span>}
                      {links.length > 0 && <span className="text-xs text-[#666666]">🔗 {links.length} 个作品链接</span>}
                    </div>
                    <h4 className="text-[#292827]" style={{ fontWeight: 540 }}>{p.title}</h4>
                    <p className="text-sm text-[#666666] mt-1 line-clamp-2">{p.description}</p>
                    {p.outcome && <p className="text-sm text-[#714cb6] mt-2" style={{ fontWeight: 540 }}>成果：{p.outcome}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 近期成长记录 */}
        {user.growthRecords.length > 0 && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#292827]" style={{ fontSize: 17, fontWeight: 460 }}>近期成长记录</h3>
              <span className="text-xs text-[#666666]">持续 {uniqueDays} 天 · 共 {user._count.growthRecords} 条</span>
            </div>
            <div className="space-y-3">
              {user.growthRecords.map((r) => (
                <div key={r.id} className="flex gap-3">
                  <div className="w-2 h-2 bg-[#714cb6] rounded-full mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-[#292827]" style={{ fontWeight: 540 }}>{r.title}</p>
                      <span className="text-xs text-[#666666]">{new Date(r.date).toLocaleDateString("zh-CN")}</span>
                    </div>
                    <p className="text-sm text-[#666666] line-clamp-1">{r.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-[#666666] opacity-70 pt-2">
          数据来自该同学在履程的真实项目与成长记录 · 让每一步成长都被看见
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value, unit, accent }: { label: string; value: string; unit: string; accent: string }) {
  return (
    <div className="bg-[#f2f0eb] border border-[#e3e3e2] rounded-xl p-3">
      <p className="text-xs text-[#666666]">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span style={{ color: accent, fontWeight: 540, fontSize: 22 }}>{value}</span>
        <span className="text-xs text-[#666666]">{unit}</span>
      </p>
    </div>
  );
}
