import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const reports = await prisma.weeklyReport.findMany({
      where: { userId },
      orderBy: { weekStart: "desc" },
      take: 20,
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Weekly report fetch error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const existing = await prisma.weeklyReport.findFirst({
      where: { userId, weekStart, weekEnd },
    });

    if (existing) {
      return NextResponse.json({ report: existing, message: "本周报告已生成" });
    }

    const records = await prisma.growthRecord.findMany({
      where: { userId, createdAt: { gte: weekStart, lte: weekEnd } },
    });

    const projects = await prisma.project.findMany({
      where: { userId, createdAt: { gte: weekStart, lte: weekEnd } },
    });

    const currentScores = await prisma.abilityScore.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    });

    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const previousScore = await prisma.abilityScore.findFirst({
      where: { userId, calculatedAt: { lt: weekStart } },
      orderBy: { calculatedAt: "desc" },
    });

    const abilityChanges: Record<string, number> = {};
    if (currentScores) {
      const prev = previousScore || { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30, totalScore: 30 };
      abilityChanges.craft = Math.round((currentScores.craft - prev.craft) * 10) / 10;
      abilityChanges.learn = Math.round((currentScores.learn - prev.learn) * 10) / 10;
      abilityChanges.drive = Math.round((currentScores.drive - prev.drive) * 10) / 10;
      abilityChanges.team = Math.round((currentScores.team - prev.team) * 10) / 10;
      abilityChanges.grit = Math.round((currentScores.grit - prev.grit) * 10) / 10;
      abilityChanges.express = Math.round((currentScores.express - prev.express) * 10) / 10;
      abilityChanges.totalScore = Math.round((currentScores.totalScore - prev.totalScore) * 10) / 10;
      // Also store absolute values for reference
      abilityChanges._abs_craft = currentScores.craft;
      abilityChanges._abs_total = currentScores.totalScore;
    }

    const suggestions = generateSuggestions(records.length, projects.length, currentScores);

    const report = await prisma.weeklyReport.create({
      data: {
        userId,
        weekStart,
        weekEnd,
        recordCount: records.length,
        abilityChanges: JSON.stringify(abilityChanges),
        hoursInvested: 0,
        aiSuggestion: suggestions,
      },
    });

    return NextResponse.json({ report, message: "周报生成成功" }, { status: 201 });
  } catch (error) {
    console.error("Weekly report generation error:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}

function generateSuggestions(recordCount: number, projectCount: number, scores: { craft: number; learn: number; drive: number; team: number; grit: number; express: number } | null): string {
  if (!scores) return "开始记录你的第一个项目吧！系统会根据你的记录数据生成个性化的成长建议。";

  const suggestions: string[] = [];

  if (recordCount === 0) {
    suggestions.push("本周还没有记录，试试记录一个小项目或学到的新技能？坚持记录是成长的第一步。");
  } else if (recordCount < 3) {
    suggestions.push(`本周有 ${recordCount} 条记录，保持得不错！试着多记录一些细节，比如你遇到的困难和解决方式。`);
  } else {
    suggestions.push(`本周活跃！${recordCount} 条记录说明你一直在努力。`);
  }

  const dimensions = [
    { key: "craft", label: "专业力", score: scores.craft },
    { key: "learn", label: "学习力", score: scores.learn },
    { key: "drive", label: "自驱力", score: scores.drive },
    { key: "team", label: "协作力", score: scores.team },
    { key: "grit", label: "抗压力", score: scores.grit },
    { key: "express", label: "表达力", score: scores.express },
  ];

  const weakest = dimensions.reduce((min, d) => d.score < min.score ? d : min, dimensions[0]);
  suggestions.push(`你当前最需要提升的是「${weakest.label}」(${weakest.score}分)，试试多做项目并记录你的思考过程。`);

  const strongest = dimensions.reduce((max, d) => d.score > max.score ? d : max, dimensions[0]);
  if (strongest.key !== weakest.key) {
    suggestions.push(`你的「${strongest.label}」是你最强的能力维度(${strongest.score}分)，继续保持！`);
  }

  if (projectCount > 0) {
    suggestions.push(`本周新增了 ${projectCount} 个项目，太棒了！每个项目都是你能力的证明。`);
  }

  return suggestions.join("\n");
}
