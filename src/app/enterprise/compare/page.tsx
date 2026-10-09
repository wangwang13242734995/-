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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">加载中...</div>}>
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">加载中...</div>;
  if (students.length < 2) return <div className="min-h-screen flex items-center justify-center text-slate-400">请选择至少 2 位候选人进行对比</div>;

  const dimensions = [
    { key: "craft", label: "专业力", emoji: "⚙️" },
    { key: "learn", label: "学习力", emoji: "📚" },
    { key: "drive", label: "自驱力", emoji: "🔥" },
    { key: "team", label: "协作力", emoji: "🤝" },
    { key: "grit", label: "抗压力", emoji: "💪" },
    { key: "express", label: "表达力", emoji: "💬" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">候选人对比</h1>
          <Link href="/enterprise/talents" className="btn-secondary text-sm">返回搜索</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-3 text-sm font-medium text-slate-500 w-24">维度</th>
                {students.map((s, i) => (
                  <th key={s.id} className={`text-center p-3 ${i === 0 ? "bg-indigo-50 rounded-t-lg" : ""}`}>
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-400 mt-1">{s.major}</div>
                    {s.graduationYear && <div className="text-xs text-slate-400">{s.graduationYear} 年</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="p-3 text-sm font-medium text-slate-700">综合分</td>
                {students.map((s, i) => {
                  const scores = students.map((st) => st.scores?.totalScore || 0);
                  const maxScore = Math.max(...scores);
                  const isMax = (s.scores?.totalScore || 0) === maxScore;
                  return (
                    <td key={s.id} className={`text-center p-3 ${i === 0 ? "bg-indigo-50" : ""}`}>
                      <span className={`text-2xl font-bold ${isMax ? "text-indigo-600" : "text-slate-600"}`}>
                        {s.scores ? Math.round(s.scores.totalScore) : "-"}
                      </span>
                      {isMax && <span className="text-xs text-indigo-600 ml-1">TOP</span>}
                    </td>
                  );
                })}
              </tr>

              {dimensions.map(({ key, label, emoji }) => (
                <tr key={key} className="border-t border-slate-100">
                  <td className="p-3 text-sm text-slate-600">{emoji} {label}</td>
                  {students.map((s, i) => {
                    const scores = students.map((st) => st.scores?.[key as keyof typeof st.scores] || 0);
                    const maxScore = Math.max(...scores);
                    const val = s.scores?.[key as keyof typeof s.scores] || 0;
                    const isMax = val === maxScore;
                    return (
                      <td key={s.id} className={`text-center p-3 ${i === 0 ? "bg-indigo-50" : ""}`}>
                        <div className={`text-lg font-semibold ${isMax ? "text-green-600" : "text-slate-600"}`}>
                          {Math.round(val)}
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${isMax ? "bg-green-500" : "bg-slate-300"}`}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr className="border-t border-slate-200">
                <td className="p-3 text-sm text-slate-600">项目数</td>
                {students.map((s, i) => (
                  <td key={s.id} className={`text-center p-3 font-medium text-slate-700 ${i === 0 ? "bg-indigo-50" : ""}`}>
                    {s.projectCount}
                  </td>
                ))}
              </tr>

              <tr className="border-t border-slate-100">
                <td className="p-3 text-sm text-slate-600">成长记录</td>
                {students.map((s, i) => (
                  <td key={s.id} className={`text-center p-3 font-medium text-slate-700 ${i === 0 ? "bg-indigo-50" : ""}`}>
                    {s.recordCount}
                  </td>
                ))}
              </tr>

              <tr className="border-t border-slate-200">
                <td className="p-3 text-sm text-slate-600">操作</td>
                {students.map((s, i) => (
                  <td key={s.id} className={`text-center p-3 ${i === 0 ? "bg-indigo-50 rounded-b-lg" : ""}`}>
                    <Link href={`/profile/${s.id}`} className="text-sm text-indigo-600 hover:underline">查看名片</Link>
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
