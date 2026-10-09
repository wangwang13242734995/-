import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateAbilityScores } from "@/services/ability-engine";

const recordSchema = z.object({
  type: z.enum(["MILESTONE", "PROBLEM_SOLVED", "NEW_SKILL", "COMPETITION", "DAILY"]),
  title: z.string().min(2, "标题至少 2 个字符").max(100),
  content: z.string().min(50, "内容至少 50 个字符，请详细记录你的经历"),
  abilitySignals: z.array(z.string()).min(1, "请至少关联一个能力维度"),
  projectId: z.string().optional(),
});

const ABILITY_DIMENSIONS = ["craft", "learn", "drive", "team", "grit", "express"];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const data = recordSchema.parse(body);

    // Validate ability signals
    const validSignals = data.abilitySignals.filter((s) => ABILITY_DIMENSIONS.includes(s));
    if (validSignals.length === 0) {
      return NextResponse.json({ error: "能力维度不合法" }, { status: 400 });
    }

    // Anti-spam: max 1 growth record per day (not counting auto-created from projects)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayManualCount = await prisma.growthRecord.count({
      where: {
        userId,
        createdAt: { gte: today },
        projectId: null, // Only manual records (project-linked ones are auto-created)
      },
    });
    if (todayManualCount >= 1) {
      return NextResponse.json(
        { error: "每天最多手动记录 1 条成长记录。把每一次记录都写得值得回味。" },
        { status: 429 }
      );
    }

    const record = await prisma.growthRecord.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        content: data.content,
        abilitySignals: JSON.stringify(validSignals),
        projectId: data.projectId || null,
      },
    });

    // Recalculate ability scores
    await calculateAbilityScores(userId);

    return NextResponse.json({ record, message: "成长记录已保存" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Growth record creation error:", error);
    return NextResponse.json({ error: "记录失败" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where: Record<string, unknown> = { userId };
    if (type) where.type = type;

    const records = await prisma.growthRecord.findMany({
      where,
      orderBy: { date: "desc" },
      take: 50,
    });

    const parsed = records.map((r) => ({
      ...r,
      abilitySignals: JSON.parse(r.abilitySignals || "[]"),
    }));

    return NextResponse.json({ records: parsed });
  } catch (error) {
    console.error("Growth records fetch error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少记录 ID" }, { status: 400 });
    }

    const record = await prisma.growthRecord.findUnique({ where: { id } });
    if (!record || record.userId !== userId) {
      return NextResponse.json({ error: "记录不存在或无权删除" }, { status: 404 });
    }

    // Don't allow deleting auto-generated project records
    if (record.projectId) {
      return NextResponse.json({ error: "项目关联记录不可单独删除" }, { status: 403 });
    }

    await prisma.growthRecord.delete({ where: { id } });
    await calculateAbilityScores(userId);

    return NextResponse.json({ message: "记录已删除" });
  } catch (error) {
    console.error("Growth record delete error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
