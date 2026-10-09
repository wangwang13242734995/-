import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  COURSE: "课程作业", COMPETITION: "比赛项目", INTERNSHIP: "实习经历",
  PERSONAL: "个人项目", CHALLENGE: "挑战赛",
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { user: { select: { name: true, school: true, major: true } } },
  });

  if (!project) notFound();

  const techStack: string[] = JSON.parse(project.techStack as string || "[]");

  const credibility = project.credibilityScore;
  const credibilityLabel = credibility >= 7 ? "高可信" : credibility >= 4 ? "中可信" : "待验证";
  const credibilityColor = credibility >= 7 ? "text-green-600 bg-green-50" : credibility >= 4 ? "text-yellow-600 bg-yellow-50" : "text-slate-400 bg-slate-50";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/projects" className="text-slate-500 hover:text-slate-700 text-sm">
            &larr; 返回项目列表
          </Link>
          <span className={`text-xs px-2 py-0.5 rounded-full ${credibilityColor}`}>
            {credibilityLabel}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
              {TYPE_LABELS[project.type] || project.type}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
            <span>{project.role}</span>
            <span>{project.teamSize} 人团队</span>
            <span>{new Date(project.startDate).toLocaleDateString("zh-CN")}</span>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">项目描述</h2>
          <p className="text-slate-700 leading-relaxed whitespace-pre-line">{project.description}</p>
        </div>

        {techStack.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">技术栈</h2>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span key={tech} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {(project.difficultyEncountered || project.solution) && (
          <div className="card border-2 border-indigo-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">困难与解决</h2>
            {project.difficultyEncountered && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-red-600 mb-1">遇到的困难</h3>
                <p className="text-slate-700 whitespace-pre-line">{project.difficultyEncountered}</p>
              </div>
            )}
            {project.solution && (
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-1">解决方案</h3>
                <p className="text-slate-700 whitespace-pre-line">{project.solution}</p>
              </div>
            )}
          </div>
        )}

        {(() => {
          const analysis = JSON.parse((project.problemAnalysis as string) || "{}");
          if (!analysis.summary) return null;
          return (
            <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">🧠 AI 能力洞察</h2>
              <p className="text-sm text-slate-700 mb-4">{analysis.summary}</p>
              {analysis.thinking?.pattern && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {analysis.thinking.pattern.map((p: string) => (
                    <span key={p} className="text-xs px-2 py-1 bg-white rounded-full text-indigo-600 border border-indigo-100">{p}</span>
                  ))}
                </div>
              )}
              {analysis.insights && analysis.insights.length > 0 && (
                <div className="space-y-2">
                  {analysis.insights.map((ins: { dimension: string; signal: string; strength: string }, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ins.strength === "high" ? "bg-green-500" : "bg-amber-400"}`}></span>
                      <span className="text-slate-700">{ins.signal}</span>
                    </div>
                  ))}
                </div>
              )}
              {analysis.depth && (
                <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center gap-4 text-xs text-slate-500">
                  <span>解决深度: {analysis.depth.score}/100 ({analysis.depth.level})</span>
                  <span>创新性: {analysis.thinking?.creativity || 0}/100</span>
                  <span>结构化: {analysis.thinking?.structuredness || 0}/100</span>
                </div>
              )}
            </div>
          );
        })()}

        {(project.githubLink || project.designLink || project.videoLink || project.liveLink) && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">项目链接</h2>
            <div className="flex flex-wrap gap-3">
              {project.githubLink && (
                <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                  GitHub
                </a>
              )}
              {project.designLink && (
                <a href={project.designLink} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                  设计稿
                </a>
              )}
              {project.videoLink && (
                <a href={project.videoLink} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                  视频演示
                </a>
              )}
              {project.liveLink && (
                <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                  线上地址
                </a>
              )}
            </div>
          </div>
        )}

        {project.outcome && (
          <div className="card bg-indigo-50 border-indigo-100">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">项目成果</h2>
            <p className="text-indigo-700 font-medium">{project.outcome}</p>
          </div>
        )}
      </main>
    </div>
  );
}
