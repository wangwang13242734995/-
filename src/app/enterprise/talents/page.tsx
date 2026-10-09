"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  major: string | null;
  graduationYear: number | null;
  bio: string | null;
  skills: string[];
  scores: {
    craft: number; learn: number; drive: number;
    team: number; grit: number; express: number; totalScore: number;
  } | null;
  topProjects: { id: string; title: string; type: string; credibilityScore: number }[];
  projectCount: number;
  recordCount: number;
}

const SORT_OPTIONS = [
  { value: "totalScore", label: "综合分" },
  { value: "craft", label: "专业力" },
  { value: "learn", label: "学习力" },
  { value: "drive", label: "自驱力" },
  { value: "team", label: "协作力" },
  { value: "grit", label: "抗压力" },
  { value: "express", label: "表达力" },
];

export default function TalentSearchPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("totalScore");
  const [minScore, setMinScore] = useState("0");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/auth/login"); return; }
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("sortBy", sortBy);
    params.set("minScore", minScore);

    fetch(`/api/talents?${params}`)
      .then((res) => res.json())
      .then((data) => { setStudents(data.students || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category, sortBy, minScore, authStatus, router]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">人才搜索</h1>
            <p className="text-sm text-slate-500 mt-1">按能力维度发现优秀人才</p>
          </div>
          <div className="flex items-center gap-3">
            {compareIds.length >= 2 && (
              <Link href={`/enterprise/compare?ids=${compareIds.join(",")}`} className="btn-primary text-sm">
                对比 ({compareIds.length})
              </Link>
            )}
            <Link href="/enterprise/dashboard" className="btn-secondary text-sm">企业面板</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="card mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">技能方向</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                className="input-field" placeholder="如：React、Python、设计" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">排序维度</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">最低综合分</label>
              <input type="number" value={minScore} onChange={(e) => setMinScore(e.target.value)}
                className="input-field" min="0" max="100" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">搜索中...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">暂无匹配人才</h2>
            <p className="text-slate-500">尝试调整筛选条件</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((s) => (
              <div key={s.id} className="card">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${s.id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
                        {s.name}
                      </Link>
                      {s.major && <span className="text-xs text-slate-400">{s.major}</span>}
                      {s.graduationYear && <span className="text-xs text-slate-400">{s.graduationYear} 年入职</span>}
                      {s.scores && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                          {Math.round(s.scores.totalScore)} 分
                        </span>
                      )}
                    </div>
                    {s.bio && <p className="text-sm text-slate-500 mt-1">{s.bio}</p>}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-slate-400">{s.projectCount} 个项目</span>
                      <span className="text-xs text-slate-400">{s.recordCount} 条记录</span>
                      {s.scores && (
                        <div className="flex gap-2">
                          {[
                            { l: "专业", v: s.scores.craft },
                            { l: "学习", v: s.scores.learn },
                            { l: "自驱", v: s.scores.drive },
                            { l: "协作", v: s.scores.team },
                            { l: "抗压", v: s.scores.grit },
                            { l: "表达", v: s.scores.express },
                          ].map(({ l, v }) => (
                            <span key={l} className="text-xs text-slate-400">{l} <span className="font-medium text-slate-600">{Math.round(v)}</span></span>
                          ))}
                        </div>
                      )}
                    </div>
                    {s.topProjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {s.topProjects.slice(0, 3).map((p) => (
                          <span key={p.id} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{p.title}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => toggleCompare(s.id)}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        compareIds.includes(s.id)
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {compareIds.includes(s.id) ? "已选" : "加入对比"}
                    </button>
                    <Link href={`/profile/${s.id}`} className="text-xs text-indigo-600 hover:underline">查看详情</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
