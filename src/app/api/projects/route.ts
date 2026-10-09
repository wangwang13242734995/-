import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateAbilityScores } from "@/services/ability-engine";
import { analyzeProblemSolving, analyzeWithLLM } from "@/services/problem-analyzer";

const projectSchema = z.object({
  title: z.string().min(2, "项目名称至少 2 个字符"),
  type: z.enum(["COURSE", "COMPETITION", "INTERNSHIP", "PERSONAL", "CHALLENGE"]),
  role: z.string().min(1, "请填写你的角色"),
  teamSize: z.number().int().min(1).max(50).default(1),
  startDate: z.string(),
  endDate: z.string().optional(),
  techStack: z.array(z.string()).default([]),
  description: z.string().min(50, "项目描述至少 50 个字符，请详细记录你的经历"),
  outcome: z.string().optional(),
  outcomeType: z.enum(["QUANTIFIED", "AWARD", "LAUNCHED", "OPEN_SOURCE", "NONE"]).default("NONE"),
  outcomeData: z.string().optional(),
  difficultyEncountered: z.string().min(50, "困难描述至少 50 个字符").max(500).optional(),
  solution: z.string().min(50, "解决方案至少 50 个字符").max(500).optional(),
  githubLink: z.string().url().optional().or(z.literal("")),
  designLink: z.string().url().optional().or(z.literal("")),
  videoLink: z.string().url().optional().or(z.literal("")),
  liveLink: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const data = projectSchema.parse(body);

    // 防刷机制：每日最多创建 1 个项目记录
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.project.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });
    if (todayCount >= 1) {
      return NextResponse.json(
        { error: "每天最多记录 1 个项目，请明天再来。把每一次记录都当作值得写的好故事。" },
        { status: 429 }
      );
    }

    const project = await prisma.project.create({
      data: {
        ...data,
        userId,
        techStack: JSON.stringify(data.techStack),
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        githubLink: data.githubLink || null,
        designLink: data.designLink || null,
        videoLink: data.videoLink || null,
        liveLink: data.liveLink || null,
        credibilityScore: calculateCredibility(data),
      },
    });

    const signals = extractAbilitySignals(data);

    await prisma.growthRecord.create({
      data: {
        userId,
        projectId: project.id,
        type: "MILESTONE",
        title: `完成项目：${data.title}`,
        content: data.description,
        abilitySignals: JSON.stringify(signals),
      },
    });

    if (data.difficultyEncountered && data.solution) {
      await prisma.growthRecord.create({
        data: {
          userId,
          projectId: project.id,
          type: "PROBLEM_SOLVED",
          title: `解决问题：${data.difficultyEncountered.slice(0, 30)}...`,
          content: `困难：${data.difficultyEncountered}\n\n解决方案：${data.solution}`,
          abilitySignals: JSON.stringify(["PROBLEM_SOLVING", "PERSISTENCE"]),
        },
      });

      // AI 深度分析：规则引擎 + InternLM LLM 增强
      const ruleAnalysis = analyzeProblemSolving(
        data.difficultyEncountered,
        data.solution,
        data.techStack
      );
      const analysis = await analyzeWithLLM(
        data.difficultyEncountered,
        data.solution,
        data.techStack,
        ruleAnalysis
      );
      await prisma.project.update({
        where: { id: project.id },
        data: { problemAnalysis: JSON.stringify(analysis) },
      });
      // 将分析结果附到返回体中
      (project as Record<string, unknown>)._analysis = analysis;
    }

    const beforeScores = await prisma.abilityScore.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    });

    const newScores = await calculateAbilityScores(userId);

    const changes = beforeScores ? {
      craft: +(newScores.craft - beforeScores.craft).toFixed(1),
      learn: +(newScores.learn - beforeScores.learn).toFixed(1),
      drive: +(newScores.drive - beforeScores.drive).toFixed(1),
      team: +(newScores.team - beforeScores.team).toFixed(1),
      grit: +(newScores.grit - beforeScores.grit).toFixed(1),
      express: +(newScores.express - beforeScores.express).toFixed(1),
      totalScore: +(newScores.totalScore - beforeScores.totalScore).toFixed(1),
    } : null;

    return NextResponse.json({
      project,
      abilityChanges: changes,
      analysis: (project as Record<string, unknown>)._analysis || null,
      message: "项目记录成功",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Project creation error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const parsed = projects.map((p) => ({
      ...p,
      techStack: JSON.parse(p.techStack || "[]"),
    }));

    return NextResponse.json({ projects: parsed });
  } catch (error) {
    console.error("Project fetch error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

function calculateCredibility(data: z.infer<typeof projectSchema>): number {
  let score = 0;
  if (data.githubLink) score += 2;
  if (data.liveLink) score += 2;
  if (data.designLink) score += 1;
  if (data.videoLink) score += 1;
  if (data.outcomeType !== "NONE") score += 2;
  if (data.outcomeData) score += 1;
  if (data.difficultyEncountered && data.solution) score += 1;
  return Math.min(score, 10);
}

function extractAbilitySignals(data: z.infer<typeof projectSchema>): string[] {
  const signals: string[] = [];

  if (data.type === "PERSONAL") signals.push("SELF_DRIVEN");
  if (data.teamSize > 1) signals.push("TEAMWORK");
  if (data.techStack.length > 3) signals.push("BROAD_SKILLS");
  if (data.difficultyEncountered && data.solution) signals.push("PROBLEM_SOLVING", "PERSISTENCE");
  if (data.outcomeType !== "NONE") signals.push("RESULT_ORIENTED");
  if (data.type === "COMPETITION") signals.push("COMPETITIVE");
  if (data.type === "INTERNSHIP") signals.push("PROFESSIONAL");

  return signals;
}
