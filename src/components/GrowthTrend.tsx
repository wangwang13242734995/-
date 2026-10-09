"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ScoreEntry {
  date: string;
  craft: number;
  learn: number;
  drive: number;
  team: number;
  grit: number;
  express: number;
  totalScore: number;
}

const COLORS: Record<string, string> = {
  craft: "#6366f1",
  learn: "#06b6d4",
  drive: "#f59e0b",
  team: "#10b981",
  grit: "#ef4444",
  express: "#8b5cf6",
  totalScore: "#1e293b",
};

const LABELS: Record<string, string> = {
  craft: "专业力",
  learn: "学习力",
  drive: "自驱力",
  team: "协作力",
  grit: "抗压力",
  express: "表达力",
  totalScore: "综合分",
};

export default function GrowthTrend({ data }: { data: ScoreEntry[] }) {
  if (data.length < 2) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-slate-400">至少记录 2 次项目后解锁成长趋势图</p>
        <p className="text-xs text-slate-300 mt-1">持续记录，看到自己的成长曲线</p>
      </div>
    );
  }

  // Format dates for display
  const chartData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="card p-6">
      <h3 className="text-sm font-medium text-slate-500 mb-4">成长趋势</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
              formatter={(value, name) => [`${value ?? 0}`, LABELS[name as string] || name]}
            />
            <Legend
              formatter={(value) => <span style={{ fontSize: "11px", color: "#64748b" }}>{LABELS[value as string] || value}</span>}
            />
            <Line type="monotone" dataKey="totalScore" stroke={COLORS.totalScore} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="craft" stroke={COLORS.craft} strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="learn" stroke={COLORS.learn} strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="drive" stroke={COLORS.drive} strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="grit" stroke={COLORS.grit} strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
