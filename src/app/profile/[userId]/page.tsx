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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-600">履程 能力名片</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">growthmap.cn/profile/{userId}</span>
            <ShareButton userId={userId} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* User Info */}
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                {user.major && <span>{user.major}</span>}
                {user.graduationYear && <span>预计 {user.graduationYear} 年入职</span>}
              </div>
              {user.bio && <p className="text-slate-600 mt-2">{user.bio}</p>}
              {userSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {userSkills.map((skill) => (
                    <span key={skill} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
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
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">可信度评估</h2>
              <span className={`text-sm font-bold ${avgCredibility >= 7 ? "text-green-600" : avgCredibility >= 4 ? "text-yellow-600" : "text-slate-400"}`}>
                {avgCredibility}/10
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all ${
                  avgCredibility >= 7 ? "bg-green-500" : avgCredibility >= 4 ? "bg-yellow-500" : "bg-slate-300"
                }`}
                style={{ width: `${avgCredibility * 10}%` }}
              />
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                高可信 {highCount} 个
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                中等 {midCount} 个
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-300 rounded-full"></span>
                待验证 {lowCount} 个
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">可信度基于外链验证、量化数据和描述完整性综合评定</p>
          </div>
        )}

        {/* Ability Radar + Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card flex flex-col items-center">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">能力雷达图</h2>
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
            <p className="text-sm text-slate-500 mt-2">
              综合能力：<span className="font-bold text-indigo-600">{scores.totalScore || Math.round((scores.craft + scores.learn + scores.drive + scores.team + scores.grit + scores.express) / 6)}</span> / 100
            </p>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">核心数据</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{user.projects.length}</div>
                <div className="text-xs text-slate-500 mt-1">完成项目</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{uniqueDays}</div>
                <div className="text-xs text-slate-500 mt-1">记录天数</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{spanDays}</div>
                <div className="text-xs text-slate-500 mt-1">持续天数</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">
                  {new Set(user.projects.flatMap((p) => JSON.parse(p.techStack as string || "[]") as string[])).size}
                </div>
                <div className="text-xs text-slate-500 mt-1">技术栈数</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">六维能力</h3>
              <div className="space-y-2">
                {[
                  { key: "craft", label: "专业力", value: scores.craft, color: "bg-blue-500" },
                  { key: "learn", label: "学习力", value: scores.learn, color: "bg-green-500" },
                  { key: "drive", label: "自驱力", value: scores.drive, color: "bg-purple-500" },
                  { key: "team", label: "协作力", value: scores.team, color: "bg-amber-500" },
                  { key: "grit", label: "抗压力", value: scores.grit, color: "bg-red-500" },
                  { key: "express", label: "表达力", value: scores.express, color: "bg-cyan-500" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-12">{label}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
                    </div>
                    <span className="text-xs text-slate-600 w-8 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Projects */}
        {user.projects.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">代表项目</h2>
            <div className="grid gap-4">
              {user.projects.map((project) => (
                <div key={project.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                      {TYPE_LABELS[project.type] || project.type}
                    </span>
                    {project.credibilityScore >= 7 && (
                      <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">高可信</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900">{project.title}</h3>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{project.description}</p>
                  {project.difficultyEncountered && (
                    <div className="mt-2 p-2 bg-white rounded border-l-2 border-indigo-300">
                      <p className="text-xs text-slate-500">
                        <span className="font-medium text-red-500">困难：</span>
                        {project.difficultyEncountered.slice(0, 80)}...
                      </p>
                      {project.solution && (
                        <p className="text-xs text-slate-500 mt-1">
                          <span className="font-medium text-green-500">解决：</span>
                          {project.solution.slice(0, 80)}...
                        </p>
                      )}
                    </div>
                  )}
                  {project.outcome && (
                    <p className="text-sm text-indigo-600 font-medium mt-2">{project.outcome}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Growth Timeline */}
        {user.growthRecords.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">成长时间线</h2>
            <div className="space-y-4">
              {user.growthRecords.slice(0, 10).map((record, i) => (
                <div key={record.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-indigo-400 rounded-full mt-1" />
                    {i < user.growthRecords.length - 1 && i < 9 && (
                      <div className="w-0.5 flex-1 bg-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 text-sm">{record.title}</p>
                      <span className="text-xs text-slate-400">
                        {new Date(record.date).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{record.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-slate-400">
            由 <span className="text-indigo-500 font-medium">履程 Growth Map</span> 生成
          </p>
          <p className="text-xs text-slate-300 mt-1">让每一步成长都被看见</p>
        </div>
      </main>
    </div>
  );
}
