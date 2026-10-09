"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";

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
  COURSE: "bg-[#d4c7ff]/30 text-[#714cb6]",
  COMPETITION: "bg-[#d4c7ff]/30 text-[#421d24]",
  INTERNSHIP: "bg-[#f2f0eb] text-[#0c4243]",
  PERSONAL: "bg-[#d4c7ff]/20 text-[#714cb6]",
  CHALLENGE: "bg-[#421d24]/10 text-[#421d24]",
};

function CredibilityBadge({ score }: { score: number }) {
  if (score >= 7) return <span className="text-xs px-2 py-0.5 bg-[#0c4243]/10 text-[#0c4243] rounded-full">高可信</span>;
  if (score >= 4) return <span className="text-xs px-2 py-0.5 bg-[#d4c7ff]/40 text-[#714cb6] rounded-full">中可信</span>;
  return <span className="text-xs px-2 py-0.5 bg-[#e3e3e2] text-[#666666] rounded-full">待验证</span>;
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date" | "credibility">("date");

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

  const filtered = projects
    .filter((p) => typeFilter === "ALL" || p.type === typeFilter)
    .sort((a, b) => {
      if (sortBy === "credibility") return b.credibilityScore - a.credibilityScore;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 py-10">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#292827]" style={{ fontSize: 26, fontWeight: 460, lineHeight: 1.3 }}>我的项目</h1>
            <p className="text-sm text-[#666666] mt-1">共 {projects.length} 个项目</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-secondary">仪表盘</Link>
            <Link href="/projects/new" className="btn-primary text-sm !py-2 !px-4">+ 记录新项目</Link>
          </div>
        </div>

        {/* Filter & Sort bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["ALL", "PERSONAL", "COURSE", "COMPETITION", "INTERNSHIP", "CHALLENGE"].map((type) => (
              <button key={type} onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                  typeFilter === type
                    ? "bg-[#421d24] text-white"
                    : "bg-white text-[#292827] border border-[#e3e3e2] hover:border-[#714cb6]"
                }`}>
                {type === "ALL" ? "全部" : TYPE_LABELS[type]}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "date" | "credibility")}
            className="text-sm px-3 py-1.5 bg-white border border-[#e3e3e2] rounded-full text-[#292827] outline-none">
            <option value="date">按时间排序</option>
            <option value="credibility">按可信度排序</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl text-[#292827] mb-2" style={{ fontWeight: 460 }}>还没有项目记录</h2>
            <p className="text-[#666666] mb-6">记录你的第一个项目，开始构建你的能力档案</p>
            <Link href="/projects/new" className="btn-primary">记录第一个项目</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-[#e3e3e2] rounded-2xl p-5 hover:border-[#714cb6] transition-all relative group"
              >
                <Link href={`/projects/${project.id}`} className="block">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[project.type] || "bg-[#e3e3e2] text-[#666666]"}`}>
                          {TYPE_LABELS[project.type] || project.type}
                        </span>
                        <CredibilityBadge score={project.credibilityScore} />
                      </div>
                      <h3 className="text-lg text-[#292827]" style={{ fontWeight: 540 }}>{project.title}</h3>
                      <p className="text-sm text-[#666666] mt-1 line-clamp-2">{project.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-[#666666] opacity-70">
                        <span>{project.role}</span>
                        <span>{project.teamSize} 人团队</span>
                        <span>{project.techStack.length} 项技术</span>
                        {project.difficultyEncountered && <span>有解题记录</span>}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      {project.outcome && (
                        <p className="text-sm text-[#714cb6]" style={{ fontWeight: 540 }}>{project.outcome}</p>
                      )}
                      <div className="flex gap-1 mt-2">
                        {project.githubLink && <span className="text-xs text-[#666666]">GitHub</span>}
                        {project.liveLink && <span className="text-xs text-[#666666]">Live</span>}
                      </div>
                    </div>
                  </div>
                </Link>
                {/* Quick edit button */}
                <Link
                  href={`/projects/${project.id}/edit`}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 bg-[#f2f0eb] border border-[#e3e3e2] rounded-lg text-xs text-[#666666] hover:text-[#714cb6] hover:border-[#714cb6]"
                >
                  编辑
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
