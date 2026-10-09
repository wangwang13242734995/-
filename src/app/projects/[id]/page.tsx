import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Header } from "@/components/Header";

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
  const credibilityColor = credibility >= 7 ? "text-[#0c4243] bg-[#0c4243]/10" : credibility >= 4 ? "text-[#714cb6] bg-[#d4c7ff]/40" : "text-[#666666] bg-[#e3e3e2]";

  return (
    <div className="min-h-screen bg-[#f2f0eb] flex flex-col">
      <Header />

      <main className="flex-1 max-w-[800px] mx-auto w-full px-6 py-10 space-y-6">
        {/* Back link */}
        <div className="flex items-center justify-between">
          <Link href="/projects" className="link-violet text-sm">
            &larr; 返回项目列表
          </Link>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full ${credibilityColor}`}>
              {credibilityLabel}
            </span>
            <Link href={`/projects/${project.id}/edit`} className="text-sm px-3 py-1 bg-[#d4c7ff]/30 text-[#714cb6] border border-[#d4c7ff] rounded-full hover:bg-[#d4c7ff]/50 transition">
              编辑
            </Link>
          </div>
        </div>

        {/* Title Card */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 bg-[#d4c7ff]/30 text-[#714cb6] rounded-full">
              {TYPE_LABELS[project.type] || project.type}
            </span>
          </div>
          <h1 className="text-[#292827]" style={{ fontSize: 28, fontWeight: 460, lineHeight: 1.14, letterSpacing: "-0.022em" }}>{project.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-[#666666]">
            <span>{project.role}</span>
            <span>{project.teamSize} 人团队</span>
            <span>{new Date(project.startDate).toLocaleDateString("zh-CN")}</span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
          <h2 className="text-[#292827] mb-3" style={{ fontSize: 19, fontWeight: 460 }}>项目描述</h2>
          <p className="text-[#292827] leading-relaxed whitespace-pre-line" style={{ fontWeight: 400 }}>{project.description}</p>
        </div>

        {/* Tech Stack */}
        {techStack.length > 0 && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
            <h2 className="text-[#292827] mb-3" style={{ fontSize: 19, fontWeight: 460 }}>技术栈</h2>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <span key={tech} className="px-3 py-1 bg-[#f2f0eb] text-[#292827] rounded-full text-sm border border-[#e3e3e2]">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty & Solution */}
        {(project.difficultyEncountered || project.solution) && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 border-l-4 border-l-[#421d24]">
            <h2 className="text-[#292827] mb-4" style={{ fontSize: 19, fontWeight: 460 }}>困难与解决</h2>
            {project.difficultyEncountered && (
              <div className="mb-4">
                <h3 className="text-sm text-[#421d24] mb-1" style={{ fontWeight: 540 }}>遇到的困难</h3>
                <p className="text-[#292827] whitespace-pre-line leading-relaxed">{project.difficultyEncountered}</p>
              </div>
            )}
            {project.solution && (
              <div>
                <h3 className="text-sm text-[#0c4243] mb-1" style={{ fontWeight: 540 }}>解决方案</h3>
                <p className="text-[#292827] whitespace-pre-line leading-relaxed">{project.solution}</p>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis */}
        {(() => {
          const analysis = JSON.parse((project.problemAnalysis as string) || "{}");
          if (!analysis.summary) return null;
          return (
            <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
              <h2 className="text-[#292827] mb-3" style={{ fontSize: 19, fontWeight: 460 }}>AI 能力洞察</h2>
              <p className="text-sm text-[#292827] mb-4 leading-relaxed">{analysis.summary}</p>
              {analysis.thinking?.pattern && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {analysis.thinking.pattern.map((p: string) => (
                    <span key={p} className="text-xs px-2 py-1 bg-[#d4c7ff]/30 text-[#714cb6] rounded-full border border-[#d4c7ff]">{p}</span>
                  ))}
                </div>
              )}
              {analysis.insights && analysis.insights.length > 0 && (
                <div className="space-y-2">
                  {analysis.insights.map((ins: { dimension: string; signal: string; strength: string }, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ins.strength === "high" ? "bg-[#0c4243]" : "bg-[#d4c7ff]"}`}></span>
                      <span className="text-[#292827]">{ins.signal}</span>
                    </div>
                  ))}
                </div>
              )}
              {analysis.depth && (
                <div className="mt-4 pt-3 border-t border-[#e3e3e2] flex items-center gap-4 text-xs text-[#666666]">
                  <span>解决深度: {analysis.depth.score}/100 ({analysis.depth.level})</span>
                  <span>创新性: {analysis.thinking?.creativity || 0}/100</span>
                  <span>结构化: {analysis.thinking?.structuredness || 0}/100</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Links */}
        {(project.githubLink || project.designLink || project.videoLink || project.liveLink) && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
            <h2 className="text-[#292827] mb-3" style={{ fontSize: 19, fontWeight: 460 }}>项目链接</h2>
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

        {/* Outcome */}
        {project.outcome && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 border-l-4 border-l-[#714cb6]">
            <h2 className="text-[#292827] mb-2" style={{ fontSize: 19, fontWeight: 460 }}>项目成果</h2>
            <p className="text-[#714cb6]" style={{ fontWeight: 540 }}>{project.outcome}</p>
          </div>
        )}
      </main>
    </div>
  );
}
