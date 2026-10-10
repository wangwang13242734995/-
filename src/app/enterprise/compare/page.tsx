"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface CompareStudent {
  id: string;
  name: string;
  major: string | null;
  graduationYear: number | null;
  bio: string | null;
  scores: {
    craft: number; learn: number; drive: number;
    team: number; grit: number; express: number; totalScore: number;
  } | null;
  projectCount: number;
  recordCount: number;
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f2f0eb] flex items-center justify-center text-[#666666]">加载中...</div>}>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") || "").split(",").filter(Boolean);

  const [students, setStudents] = useState<CompareStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/auth/login"); return; }
    Promise.all(
      ids.map((id) =>
        fetch(`/api/talents?category=&sortBy=totalScore&minScore=0&page=1`)
          .then((res) => res.json())
          .then((data) => (data.students || []).find((s: { id: string }) => s.id === id))
      )
    )
      .then((results) => { setStudents(results.filter(Boolean)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [authStatus, router, ids]);

  if (loading) return <div className="min-h-screen bg-[#f2f0eb] flex items-center justify-center text-[#666666]">加载中...</div>;
  if (students.length < 2) return <div className="min-h-screen bg-[#f2f0eb] flex items-center justify-center text-[#666666]">请选择至少 2 位候选人进行对比</div>;

  const dimensions = [
    { key: "craft", label: "专业力", emoji: "⚙️" },
    { key: "learn", label: "学习力", emoji: "📚" },
    { key: "drive", label: "自驱力", emoji: "🔥" },
    { key: "team", label: "协作力", emoji: "🤝" },
    { key: "grit", label: "抗压力", emoji: "💪" },
    { key: "express", label: "表达力", emoji: "💬" },
  ];

  return (
    <div className="min-h-screen bg-[#f2f0eb]">
      <header className="bg-white/80 backdrop-blur-[12px] border-b border-[#e3e3e2] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-[#292827]" style={{ fontSize: 20, fontWeight: 460 }}>候选人对比</h1>
          <Link href="/enterprise/talents" className="btn-secondary text-sm">返回搜索</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-3 text-sm text-[#666666] w-24" style={{ fontWeight: 540 }}>维度</th>
                {students.map((s, i) => (
                  <th key={s.id} className={`text-center p-3 ${i === 0 ? "bg-[#d4c7ff]/10 rounded-t-2xl" : ""}`}>
                    <div className="text-[#292827]" style={{ fontWeight: 540 }}>{s.name}</div>
                    <div className="text-xs text-[#666666] mt-1">{s.major}</div>
                    {s.graduationYear && <div className="text-xs text-[#666666]">{s.graduationYear} 年</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#e3e3e2]">
                <td className="p-3 text-sm text-[#292827]" style={{ fontWeight: 540 }}>综合分</td>
                {students.map((s, i) => {
                  const scores = students.map((st) => st.scores?.totalScore || 0);
                  const maxScore = Math.max(...scores);
                  const isMax = (s.scores?.totalScore || 0) === maxScore;
                  return (
                    <td key={s.id} className={`text-center p-3 ${i === 0 ? "bg-[#d4c7ff]/10" : ""}`}>
                      <span className={`text-2xl ${isMax ? "text-[#714cb6]" : "text-[#666666]"}`} style={{ fontWeight: 540 }}>
                        {s.scores ? Math.round(s.scores.totalScore) : "-"}
                      </span>
                      {isMax && <span className="text-xs text-[#714cb6] ml-1">TOP</span>}
                    </td>
                  );
                })}
              </tr>

              {dimensions.map(({ key, label, emoji }) => (
                <tr key={key} className="border-t border-[#e3e3e2]">
                  <td className="p-3 text-sm text-[#666666]">{emoji} {label}</td>
                  {students.map((s, i) => {
                    const scores = students.map((st) => st.scores?.[key as keyof typeof st.scores] || 0);
                    const maxScore = Math.max(...scores);
                    const val = s.scores?.[key as keyof typeof s.scores] || 0;
                    const isMax = val === maxScore;
                    return (
                      <td key={s.id} className={`text-center p-3 ${i === 0 ? "bg-[#d4c7ff]/10" : ""}`}>
                        <div className={`text-lg ${isMax ? "text-[#0c4243]" : "text-[#666666]"}`} style={{ fontWeight: 540 }}>
                          {Math.round(val)}
                        </div>
                        <div className="w-full bg-[#e3e3e2] rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${isMax ? "bg-[#714cb6]" : "bg-[#e3e3e2]"}`}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr className="border-t border-[#e3e3e2]">
                <td className="p-3 text-sm text-[#666666]">项目数</td>
                {students.map((s, i) => (
                  <td key={s.id} className={`text-center p-3 text-[#292827] ${i === 0 ? "bg-[#d4c7ff]/10" : ""}`} style={{ fontWeight: 540 }}>
                    {s.projectCount}
                  </td>
                ))}
              </tr>

              <tr className="border-t border-[#e3e3e2]">
                <td className="p-3 text-sm text-[#666666]">成长记录</td>
                {students.map((s, i) => (
                  <td key={s.id} className={`text-center p-3 text-[#292827] ${i === 0 ? "bg-[#d4c7ff]/10" : ""}`} style={{ fontWeight: 540 }}>
                    {s.recordCount}
                  </td>
                ))}
              </tr>

              <tr className="border-t border-[#e3e3e2]">
                <td className="p-3 text-sm text-[#666666]">操作</td>
                {students.map((s, i) => (
                  <td key={s.id} className={`text-center p-3 ${i === 0 ? "bg-[#d4c7ff]/10 rounded-b-2xl" : ""}`}>
                    <Link href={`/enterprise/talents/${s.id}`} className="text-sm text-[#714cb6] hover:underline">查看名片</Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
