"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface AbilityData {
  craft: number;
  learn: number;
  drive: number;
  team: number;
  grit: number;
  express: number;
}

const LABELS: Record<string, string> = {
  craft: "专业力",
  learn: "学习力",
  drive: "自驱力",
  team: "协作力",
  grit: "抗压力",
  express: "表达力",
};

export function AbilityRadar({ data, size = 300 }: { data: AbilityData; size?: number }) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    subject: LABELS[key] || key,
    value,
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width={size} height={size}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "#475569", fontSize: 13 }}
        />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="能力值"
          dataKey="value"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
