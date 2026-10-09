/**
 * 周复盘引擎
 * 自动生成用户本周成长总结：能力变化、项目进展、成长轨迹
 */

import { prisma } from "@/lib/prisma";

export interface WeeklyReview {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  projects: {
    count: number;
    items: Array<{
      id: string;
      title: string;
      type: string;
      createdAt: Date;
    }>;
  };
  growthRecords: {
    count: number;
    items: Array<{
      id: string;
      title: string;
      type: string;
      date: Date;
    }>;
  };
  abilityChanges: {
    current: Record<string, number>;
    previous: Record<string, number>;
    changes: Record<string, number>;
    biggestGain: { key: string; label: string; value: number };
    totalScoreChange: number;
  };
  summary: string;
  highlights: string[];
}

const ABILITY_LABELS: Record<string, string> = {
  craft: "专业力",
  learn: "学习力",
  drive: "自驱力",
  team: "协作力",
  grit: "抗压力",
  express: "表达力",
};

const DEFAULT_SCORES = { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30, totalScore: 30 };

function getWeekRange(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const month = start.getMonth() + 1;
  const day = start.getDate();
  const label = `${month}月${day}日 — ${end.getMonth() + 1}月${end.getDate()}日`;

  return { start, end, label };
}

export async function generateWeeklyReview(userId: string): Promise<WeeklyReview | null> {
  const { start, end, label } = getWeekRange();

  const [projects, growthRecords, currentScore, previousScore] = await Promise.all([
    prisma.project.findMany({
      where: { userId, createdAt: { gte: start, lte: end } },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, type: true, createdAt: true },
    }),
    prisma.growthRecord.findMany({
      where: { userId, date: { gte: start, lte: end } },
      orderBy: { date: "desc" },
      select: { id: true, title: true, type: true, date: true },
    }),
    prisma.abilityScore.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    }),
    prisma.abilityScore.findFirst({
      where: { userId, calculatedAt: { lt: start } },
      orderBy: { calculatedAt: "desc" },
    }),
  ]);

  const current = currentScore
    ? { craft: currentScore.craft, learn: currentScore.learn, drive: currentScore.drive, team: currentScore.team, grit: currentScore.grit, express: currentScore.express, totalScore: currentScore.totalScore }
    : DEFAULT_SCORES;

  const previous = previousScore
    ? { craft: previousScore.craft, learn: previousScore.learn, drive: previousScore.drive, team: previousScore.team, grit: previousScore.grit, express: previousScore.express, totalScore: previousScore.totalScore }
    : DEFAULT_SCORES;

  const changes: Record<string, number> = {};
  let biggestGainKey = "";
  let biggestGainValue = 0;

  for (const key of Object.keys(ABILITY_LABELS)) {
    const change = Math.round(((current as any)[key] - (previous as any)[key]) * 10) / 10;
    changes[key] = change;
    if (change > biggestGainValue) {
      biggestGainValue = change;
      biggestGainKey = key;
    }
  }

  const totalScoreChange = Math.round((current.totalScore - previous.totalScore) * 10) / 10;

  // Generate highlights
  const highlights: string[] = [];
  if (projects.length > 0) highlights.push(`完成了 ${projects.length} 个项目`);
  if (biggestGainValue > 0) highlights.push(`${ABILITY_LABELS[biggestGainKey]}提升了 ${biggestGainValue} 分`);
  if (growthRecords.length > 0) highlights.push(`记录了 ${growthRecords.length} 条成长轨迹`);
  if (totalScoreChange > 0) highlights.push(`综合得分上涨 ${totalScoreChange} 分`);

  // Generate summary with poetic touch
  let summary = "";
  if (projects.length === 0 && growthRecords.length === 0) {
    summary = "这周像一张白纸，等待你的第一笔。下周试着记录一个项目，让能力数据开始生长。";
  } else if (projects.length > 0 && totalScoreChange > 0) {
    summary = `这周你种下了 ${projects.length} 颗种子，综合得分悄然上涨了 ${totalScoreChange} 分。每一次记录都是在给未来的自己写推荐信。`;
  } else if (projects.length > 0) {
    summary = `这周你记录了 ${projects.length} 个项目。分数还没动，但积累已经在路上了——竹子前四年只长三厘米，第五年开始每天三十厘米。`;
  } else {
    summary = `这周你留下了 ${growthRecords.length} 条成长轨迹。不是所有的努力都立刻变现，但所有的记录都在沉淀复利。`;
  }

  return {
    weekStart: start,
    weekEnd: end,
    weekLabel: label,
    projects: { count: projects.length, items: projects },
    growthRecords: { count: growthRecords.length, items: growthRecords },
    abilityChanges: {
      current,
      previous,
      changes,
      biggestGain: { key: biggestGainKey, label: ABILITY_LABELS[biggestGainKey] || "", value: biggestGainValue },
      totalScoreChange,
    },
    summary,
    highlights,
  };
}
