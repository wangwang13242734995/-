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
  topProjects: { id: string; title: string; type: string }[];
  projectCount: number;
}

const DIM_LABELS = ["专业", "学习", "自驱", "协作", "抗压", "表达"];

function RadarCard({ scores }: { scores: { craft: number; learn: number; drive: number; team: number; grit: number; express: number } }) {
  const dims = [scores.craft, scores.learn, scores.drive, scores.team, scores.grit, scores.express];
  const cx = 50, cy = 50, r = 40;
  const angle = (i: number) => (Math.PI * 2 * i) / 6 - Math.PI / 2;

  const dataPoints = dims.map((v, i) => {
    const ratio = Math.min(v, 100) / 100;
    return `${cx + r * ratio * Math.cos(angle(i))},${cy + r * ratio * Math.sin(angle(i))}`;
  }).join(" ");

  const outerPoints = Array.from({ length: 6 }, (_, i) =>
    `${cx + r * Math.cos(angle(i))},${cy + r * Math.sin(angle(i))}`
  ).join(" ");

  const midPoints = Array.from({ length: 6 }, (_, i) =>
    `${cx + r * 0.6 * Math.cos(angle(i))},${cy + r * 0.6 * Math.sin(angle(i))}`
  ).join(" ");

  const innerPoints = Array.from({ length: 6 }, (_, i) =>
    `${cx + r * 0.3 * Math.cos(angle(i))},${cy + r * 0.3 * Math.sin(angle(i))}`
  ).join(" ");

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="mx-auto">
      <polygon points={outerPoints} fill="none" stroke="#e3e3e2" strokeWidth="0.8" />
      <polygon points={midPoints} fill="none" stroke="#e3e3e2" strokeWidth="0.5" strokeDasharray="2,2" />
      <polygon points={innerPoints} fill="none" stroke="#e3e3e2" strokeWidth="0.5" strokeDasharray="2,2" />
      {/* Axes */}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={i} x1={cx} y1={cy}
          x2={cx + r * Math.cos(angle(i))} y2={cy + r * Math.sin(angle(i))}
          stroke="#e3e3e2" strokeWidth="0.5" />
      ))}
      {/* Data */}
      <polygon points={dataPoints} fill="#714cb6" fillOpacity="0.15" stroke="#714cb6" strokeWidth="2" strokeLinejoin="round" />
      {/* Data dots */}
      {dims.map((v, i) => {
        const ratio = Math.min(v, 100) / 100;
        return <circle key={i} cx={cx + r * ratio * Math.cos(angle(i))} cy={cy + r * ratio * Math.sin(angle(i))} r="2.5" fill="#714cb6" />;
      })}
      {/* Labels */}
      {DIM_LABELS.map((label, i) => {
        const lx = cx + (r + 12) * Math.cos(angle(i));
        const ly = cy + (r + 12) * Math.sin(angle(i));
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="text-[8px]" fill="#666666">{label}</text>;
      })}
    </svg>
  );
}

export default function TalentSearchPage() {
  const { status: authStatus } = useSession();
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
    <div className="min-h-screen bg-[#f2f0eb]">
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#e3e3e2] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/enterprise/dashboard" className="text-sm text-[#666666] hover:text-[#714cb6] transition">&larr; 企业面板</Link>
            <h1 className="text-[#292827]" style={{ fontSize: 20, fontWeight: 460 }}>人才搜索</h1>
          </div>
          {compareIds.length >= 2 && (
            <Link href={`/enterprise/compare?ids=${compareIds.join(",")}`} className="btn-primary text-sm">
              对比 ({compareIds.length})
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filter bar */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-5 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">技能方向</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                className="input-field" placeholder="React、Python、设计..." />
            </div>
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">排序维度</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field">
                <option value="totalScore">综合分</option>
                <option value="craft">专业力</option>
                <option value="learn">学习力</option>
                <option value="drive">自驱力</option>
                <option value="team">协作力</option>
                <option value="grit">抗压力</option>
                <option value="express">表达力</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">最低综合分</label>
              <input type="number" value={minScore} onChange={(e) => setMinScore(e.target.value)}
                className="input-field" min="0" max="100" />
            </div>
            <div className="flex items-end">
              <button onClick={() => { setCategory(""); setMinScore("0"); setSortBy("totalScore"); }}
                className="text-xs text-[#666666] hover:text-[#292827] underline underline-offset-2">
                重置筛选
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#666666]">搜索中...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl text-[#292827] mb-2" style={{ fontWeight: 460 }}>暂无匹配人才</h2>
            <p className="text-[#666666]">尝试调整筛选条件，或降低最低分数要求</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((s) => (
              <div key={s.id} className="bg-white border border-[#e3e3e2] rounded-2xl p-5 flex flex-col hover:border-[#714cb6] transition-colors">
                {/* Radar visual */}
                {s.scores ? (
                  <RadarCard scores={s.scores} />
                ) : (
                  <div className="w-[100px] h-[100px] mx-auto flex items-center justify-center text-xs text-[#666666] border border-dashed border-[#e3e3e2] rounded-full">
                    暂无数据
                  </div>
                )}

                {/* Name + score */}
                <div className="mt-3 text-center">
                  <Link href={`/enterprise/talents/${s.id}`} className="text-[#292827] hover:text-[#714cb6]" style={{ fontWeight: 540 }}>
                    {s.name}
                  </Link>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {s.scores && (
                      <span className="text-xs px-2 py-0.5 bg-[#d4c7ff]/30 text-[#714cb6] rounded-full" style={{ fontWeight: 540 }}>
                        {Math.round(s.scores.totalScore)} 分
                      </span>
                    )}
                    {s.graduationYear && <span className="text-xs text-[#666666]">{s.graduationYear}届</span>}
                  </div>
                </div>

                {/* Skills tags */}
                {s.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 justify-center">
                    {s.skills.slice(0, 3).map((sk) => (
                      <span key={sk} className="text-xs px-2 py-0.5 bg-[#f2f0eb] text-[#666666] rounded-full border border-[#e3e3e2]">{sk}</span>
                    ))}
                    {s.skills.length > 3 && <span className="text-xs text-[#666666]">+{s.skills.length - 3}</span>}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#e3e3e2]">
                  <span className="text-xs text-[#666666]">{s.projectCount} 项目</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleCompare(s.id)}
                      className={`text-xs px-2.5 py-1 rounded-full transition ${
                        compareIds.includes(s.id)
                          ? "bg-[#421d24] text-white"
                          : "bg-[#f2f0eb] text-[#666666] hover:bg-[#e3e3e2] border border-[#e3e3e2]"
                      }`}>
                      {compareIds.includes(s.id) ? "已选" : "对比"}
                    </button>
                    <Link href={`/enterprise/talents/${s.id}`} className="text-xs text-[#714cb6] hover:underline">详情</Link>
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
