import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateAbilityScores } from "@/services/ability-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (error) {
    console.error("Project fetch error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  type: z.enum(["COURSE", "COMPETITION", "INTERNSHIP", "PERSONAL", "CHALLENGE"]).optional(),
  role: z.string().min(1).optional(),
  teamSize: z.number().int().min(1).max(50).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  description: z.string().min(50).optional(),
  outcome: z.string().optional(),
  outcomeType: z.enum(["QUANTIFIED", "AWARD", "LAUNCHED", "OPEN_SOURCE", "NONE"]).optional(),
  outcomeData: z.string().optional(),
  difficultyEncountered: z.string().max(500).optional(),
  solution: z.string().max(500).optional(),
  githubLink: z.string().url().optional().or(z.literal("")),
  designLink: z.string().url().optional().or(z.literal("")),
  videoLink: z.string().url().optional().or(z.literal("")),
  liveLink: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    // Verify ownership
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: "无权操作此项目" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.teamSize !== undefined) updateData.teamSize = data.teamSize;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.techStack !== undefined) updateData.techStack = JSON.stringify(data.techStack);
    if (data.description !== undefined) updateData.description = data.description;
    if (data.outcome !== undefined) updateData.outcome = data.outcome;
    if (data.outcomeType !== undefined) updateData.outcomeType = data.outcomeType;
    if (data.outcomeData !== undefined) updateData.outcomeData = data.outcomeData;
    if (data.difficultyEncountered !== undefined) updateData.difficultyEncountered = data.difficultyEncountered;
    if (data.solution !== undefined) updateData.solution = data.solution;
    if (data.githubLink !== undefined) updateData.githubLink = data.githubLink || null;
    if (data.designLink !== undefined) updateData.designLink = data.designLink || null;
    if (data.videoLink !== undefined) updateData.videoLink = data.videoLink || null;
    if (data.liveLink !== undefined) updateData.liveLink = data.liveLink || null;
    if (data.status !== undefined) updateData.status = data.status;

    // Recalculate credibility
    const merged = { ...existing, ...updateData };
    updateData.credibilityScore = recalcCredibility(merged);

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    // Recalculate ability scores if description or key fields changed
    if (data.description || data.techStack || data.difficultyEncountered || data.solution || data.status) {
      await calculateAbilityScores(userId);
    }

    return NextResponse.json({ project, message: "项目已更新" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Project update error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { id } = await params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return NextResponse.json({ error: "无权操作此项目" }, { status: 403 });
    }

    // Delete associated growth records first
    await prisma.growthRecord.deleteMany({
      where: { projectId: id },
    });

    await prisma.project.delete({ where: { id } });

    // Recalculate ability scores after deletion
    await calculateAbilityScores(userId);

    return NextResponse.json({ message: "项目已删除" });
  } catch (error) {
    console.error("Project delete error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}

function recalcCredibility(p: {
  githubLink: string | null;
  liveLink: string | null;
  designLink: string | null;
  videoLink: string | null;
  outcomeType: string;
  outcomeData: string | null;
  difficultyEncountered: string | null;
  solution: string | null;
}): number {
  let score = 0;
  if (p.githubLink) score += 2;
  if (p.liveLink) score += 2;
  if (p.designLink) score += 1;
  if (p.videoLink) score += 1;
  if (p.outcomeType !== "NONE") score += 2;
  if (p.outcomeData) score += 1;
  if (p.difficultyEncountered && p.solution) score += 1;
  return Math.min(score, 10);
}
