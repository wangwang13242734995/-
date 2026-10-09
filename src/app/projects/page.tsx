"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  title: string;
  type: string;
  role: string;
  teamSize: number;
  techStack: string[];
  description: string;
  outcomeType: string;
  outcome: string | null;
  credibilityScore: number;
  difficultyEncountered: string | null;
  solution: string | null;
  githubLink: string | null;
  liveLink: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  COURSE: "课程作业",
  COMPETITION: "比赛项目",
  INTERNSHIP: "实习经历",
  PERSONAL: "个人项目",
  CHALLENGE: "挑战赛",
};

const TYPE_COLORS: Record<string, string> = {
  COURSE: "bg-blue-50 text-blue-700",
  COMPETITION: "bg-amber-50 text-amber-700",
  INTERNSHIP: "bg-green-50 text-green-700",
  PERSONAL: "bg-purple-50 text-purple-700",
  CHALLENGE: "bg-red-50 text-red-700",
};

function CredibilityBadge({ score }: { score: number }) {
  if (score >= 7) return <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">高可信</span>;
  if (score >= 4) return <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full">中可信</span>;
  return <span className="text-xs px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full">待验证</span>;
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/projects")
        .then((res) => res.json())
        .then((data) => {
          setProjects(data.projects || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">我的项目</h1>
            <p className="text-sm text-slate-500 mt-1">共 {projects.length} 个项目</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-secondary text-sm">仪表盘</Link>
            <Link href="/projects/new" className="btn-primary text-sm">+ 记录新项目</Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">还没有项目记录</h2>
            <p className="text-slate-500 mb-6">记录你的第一个项目，开始构建你的能力档案</p>
            <Link href="/projects/new" className="btn-primary">记录第一个项目</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[project.type] || "bg-slate-50"}`}>
                        {TYPE_LABELS[project.type] || project.type}
                      </span>
                      <CredibilityBadge score={project.credibilityScore} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{project.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{project.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span>{project.role}</span>
                      <span>{project.teamSize} 人团队</span>
                      <span>{project.techStack.length} 项技术</span>
                      {project.difficultyEncountered && <span>有解题记录</span>}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    {project.outcome && (
                      <p className="text-sm font-medium text-indigo-600">{project.outcome}</p>
                    )}
                    <div className="flex gap-1 mt-2">
                      {project.githubLink && <span className="text-xs text-slate-400">GitHub</span>}
                      {project.liveLink && <span className="text-xs text-slate-400">Live</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
