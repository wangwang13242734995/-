import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AbilityRadar } from "@/components/AbilityRadar";
import ShareButton from "@/components/ShareButton";

const TYPE_LABELS: Record<string, string> = {
  COURSE: "课程作业", COMPETITION: "比赛项目", INTERNSHIP: "实习经历",
  PERSONAL: "个人项目", CHALLENGE: "挑战赛",
};

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projects: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      abilityScores: {
        orderBy: { calculatedAt: "desc" },
        take: 1,
      },
      growthRecords: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) notFound();

  const userSkills: string[] = JSON.parse(user.skills as string || "[]");
  const scores = user.abilityScores[0] || { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30 };

  // Credibility overview from all published projects
  const allProjects = await prisma.project.findMany({
    where: { userId, status: "PUBLISHED" },
    select: { credibilityScore: true },
  });
  const avgCredibility = allProjects.length > 0
    ? Math.round(allProjects.reduce((sum, p) => sum + p.credibilityScore, 0) / allProjects.length)
    : 0;
  const highCount = allProjects.filter((p) => p.credibilityScore >= 7).length;
  const midCount = allProjects.filter((p) => p.credibilityScore >= 4 && p.credibilityScore < 7).length;
  const lowCount = allProjects.filter((p) => p.credibilityScore < 4).length;

  const firstRecord = user.growthRecords[0]?.createdAt;
  const lastRecord = user.growthRecords[user.growthRecords.length - 1]?.createdAt;
  const spanDays = firstRecord && lastRecord
    ? Math.round((lastRecord.getTime() - firstRecord.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const uniqueDays = new Set(user.growthRecords.map((r) => r.createdAt.toDateString())).size;

  return (
    <div className="min-h-screen bg-[#f2f0eb]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#e3e3e2] px-6 py-4">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <span className="text-sm text-[#421d24]" style={{ fontWeight: 540 }}>履程 能力名片</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#666666] hidden sm:inline">growthmap.cn/profile/{userId}</span>
            <ShareButton userId={userId} />
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 py-8 space-y-6">
        {/* User Info */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-[#421d24] rounded-2xl flex items-center justify-center text-2xl text-white" style={{ fontWeight: 460 }}>
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-[#292827]" style={{ fontSize: 26, fontWeight: 460 }}>{user.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-[#666666]">
                {user.major && <span>{user.major}</span>}
                {user.graduationYear && <span>预计 {user.graduationYear} 年入职</span>}
              </div>
              {user.bio && <p className="text-[#666666] mt-2">{user.bio}</p>}
              {userSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {userSkills.map((skill) => (
                    <span key={skill} className="text-xs px-2 py-0.5 bg-[#f2f0eb] text-[#292827] rounded-full border border-[#e3e3e2]">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Credibility Score Card */}
        {allProjects.length > 0 && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#292827]" style={{ fontSize: 19, fontWeight: 460 }}>可信度评估</h2>
              <span className={`text-sm ${avgCredibility >= 7 ? "text-[#0c4243]" : avgCredibility >= 4 ? "text-[#714cb6]" : "text-[#666666]"}`} style={{ fontWeight: 540 }}>
                {avgCredibility}/10
              </span>
            </div>
            <div className="h-3 bg-[#e3e3e2] rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all ${
                  avgCredibility >= 7 ? "bg-[#0c4243]" : avgCredibility >= 4 ? "bg-[#714cb6]" : "bg-[#e3e3e2]"
                }`}
                style={{ width: `${avgCredibility * 10}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-[#666666]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#0c4243] rounded-full"></span>
                高可信 {highCount} 个
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#714cb6] rounded-full"></span>
                中等 {midCount} 个
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#e3e3e2] rounded-full"></span>
                待验证 {lowCount} 个
              </span>
            </div>
            <p className="text-xs text-[#666666] opacity-60 mt-2">可信度基于外链验证、量化数据和描述完整性综合评定</p>
          </div>
        )}

        {/* Ability Radar + Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 flex flex-col items-center">
            <h2 className="text-[#292827] mb-2" style={{ fontSize: 19, fontWeight: 460 }}>能力雷达图</h2>
            <AbilityRadar
              data={{
                craft: scores.craft,
                learn: scores.learn,
                drive: scores.drive,
                team: scores.team,
                grit: scores.grit,
                express: scores.express,
              }}
            />
            <p className="text-sm text-[#666666] mt-2">
              综合能力：<span className="text-[#714cb6]" style={{ fontWeight: 540 }}>{scores.totalScore || Math.round((scores.craft + scores.learn + scores.drive + scores.team + scores.grit + scores.express) / 6)}</span> / 100
            </p>
          </div>

          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827]" style={{ fontSize: 19, fontWeight: 460 }}>核心数据</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-[#f2f0eb] rounded-xl border border-[#e3e3e2]">
                <div className="text-2xl text-[#421d24]" style={{ fontWeight: 540 }}>{user.projects.length}</div>
                <div className="text-xs text-[#666666] mt-1">完成项目</div>
              </div>
              <div className="text-center p-3 bg-[#f2f0eb] rounded-xl border border-[#e3e3e2]">
                <div className="text-2xl text-[#421d24]" style={{ fontWeight: 540 }}>{uniqueDays}</div>
                <div className="text-xs text-[#666666] mt-1">记录天数</div>
              </div>
              <div className="text-center p-3 bg-[#f2f0eb] rounded-xl border border-[#e3e3e2]">
                <div className="text-2xl text-[#421d24]" style={{ fontWeight: 540 }}>{spanDays}</div>
                <div className="text-xs text-[#666666] mt-1">持续天数</div>
              </div>
              <div className="text-center p-3 bg-[#f2f0eb] rounded-xl border border-[#e3e3e2]">
                <div className="text-2xl text-[#421d24]" style={{ fontWeight: 540 }}>
                  {new Set(user.projects.flatMap((p) => JSON.parse(p.techStack as string || "[]") as string[])).size}
                </div>
                <div className="text-xs text-[#666666] mt-1">技术栈数</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm text-[#292827] mb-2" style={{ fontWeight: 540 }}>六维能力</h3>
              <div className="space-y-2">
                {[
                  { key: "craft", label: "专业力", value: scores.craft, color: "bg-[#714cb6]" },
                  { key: "learn", label: "学习力", value: scores.learn, color: "bg-[#421d24]" },
                  { key: "drive", label: "自驱力", value: scores.drive, color: "bg-[#714cb6]" },
                  { key: "team", label: "协作力", value: scores.team, color: "bg-[#421d24]" },
                  { key: "grit", label: "抗压力", value: scores.grit, color: "bg-[#714cb6]" },
                  { key: "express", label: "表达力", value: scores.express, color: "bg-[#421d24]" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs text-[#666666] w-12">{label}</span>
                    <div className="flex-1 h-2 bg-[#e3e3e2] rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
                    </div>
                    <span className="text-xs text-[#666666] w-8 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Projects */}
        {user.projects.length > 0 && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
            <h2 className="text-[#292827] mb-4" style={{ fontSize: 19, fontWeight: 460 }}>代表项目</h2>
            <div className="grid gap-4">
              {user.projects.map((project) => (
                <div key={project.id} className="p-4 bg-[#f2f0eb] rounded-xl border border-[#e3e3e2] border-l-4 border-l-[#421d24]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-[#d4c7ff]/30 text-[#714cb6] rounded-full">
                      {TYPE_LABELS[project.type] || project.type}
                    </span>
                    {project.credibilityScore >= 7 && (
                      <span className="text-xs px-2 py-0.5 bg-[#0c4243]/10 text-[#0c4243] rounded-full">高可信</span>
                    )}
                  </div>
                  <h3 className="text-[#292827]" style={{ fontWeight: 540 }}>{project.title}</h3>
                  <p className="text-sm text-[#666666] mt-1 line-clamp-2">{project.description}</p>
                  {project.difficultyEncountered && (
                    <div className="mt-2 p-2 bg-white rounded-lg border-l-2 border-[#714cb6]">
                      <p className="text-xs text-[#666666]">
                        <span className="text-[#421d24]" style={{ fontWeight: 540 }}>困难：</span>
                        {project.difficultyEncountered.slice(0, 80)}...
                      </p>
                      {project.solution && (
                        <p className="text-xs text-[#666666] mt-1">
                          <span className="text-[#0c4243]" style={{ fontWeight: 540 }}>解决：</span>
                          {project.solution.slice(0, 80)}...
                        </p>
                      )}
                    </div>
                  )}
                  {project.outcome && (
                    <p className="text-sm text-[#714cb6] mt-2" style={{ fontWeight: 540 }}>{project.outcome}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Growth Timeline */}
        {user.growthRecords.length > 0 && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
            <h2 className="text-[#292827] mb-4" style={{ fontSize: 19, fontWeight: 460 }}>成长时间线</h2>
            <div className="space-y-4">
              {user.growthRecords.slice(0, 10).map((record, i) => (
                <div key={record.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-[#714cb6] rounded-full mt-1" />
                    {i < user.growthRecords.length - 1 && i < 9 && (
                      <div className="w-0.5 flex-1 bg-[#e3e3e2]" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-[#292827]" style={{ fontWeight: 540 }}>{record.title}</p>
                      <span className="text-xs text-[#666666]">
                        {new Date(record.date).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    <p className="text-sm text-[#666666] mt-1 line-clamp-2">{record.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-[#666666]">
            由 <span className="text-[#714cb6]" style={{ fontWeight: 540 }}>履程 Growth Map</span> 生成
          </p>
          <p className="text-xs text-[#666666] opacity-60 mt-1">让每一步成长都被看见</p>
        </div>
      </main>
    </div>
  );
}
