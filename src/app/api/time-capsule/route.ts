import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const capsuleSchema = z.object({
  goal: z.string().min(10, "目标至少 10 个字符"),
  openDates: z.array(z.string()).min(1, "请选择至少一个开启日期"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const data = capsuleSchema.parse(body);

    const capsule = await prisma.timeCapsule.create({
      data: {
        userId,
        goal: data.goal,
        openDates: JSON.stringify(data.openDates),
      },
    });

    return NextResponse.json({ capsule, message: "时光胶囊已封存" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Time capsule error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const capsules = await prisma.timeCapsule.findMany({
      where: { userId },
      orderBy: { writtenAt: "desc" },
    });

    const now = new Date();
    const enriched = capsules.map((c) => {
      const dates: string[] = JSON.parse(c.openDates as string || "[]");
      return {
        ...c,
        openDates: dates,
        nextOpenDate: dates
          .filter((d) => new Date(d) > now)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] || null,
        isReadyToOpen: dates.some((d) => new Date(d) <= now && (!c.openedAt || new Date(d) > c.openedAt)),
      };
    });

    return NextResponse.json({ capsules: enriched });
  } catch (error) {
    console.error("Time capsule fetch error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { capsuleId } = await req.json();

    const capsule = await prisma.timeCapsule.findUnique({ where: { id: capsuleId } });
    if (!capsule || capsule.userId !== userId) {
      return NextResponse.json({ error: "胶囊不存在" }, { status: 404 });
    }

    const now = new Date();
    const openDates: string[] = JSON.parse(capsule.openDates as string || "[]");
    const isReady = openDates.some((d) => new Date(d) <= now && (!capsule.openedAt || new Date(d) > capsule.openedAt));

    if (!isReady) {
      return NextResponse.json({ error: "还不到开启时间" }, { status: 400 });
    }

    await prisma.timeCapsule.update({
      where: { id: capsuleId },
      data: { openedAt: now },
    });

    const currentScores = await prisma.abilityScore.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    });

    const capsuleScores = await prisma.abilityScore.findFirst({
      where: { userId, calculatedAt: { lte: capsule.writtenAt } },
      orderBy: { calculatedAt: "desc" },
    });

    return NextResponse.json({
      capsule,
      currentScores,
      thenScores: capsuleScores,
      message: "时光胶囊已开启！看看你的成长吧",
    });
  } catch (error) {
    console.error("Time capsule open error:", error);
    return NextResponse.json({ error: "开启失败" }, { status: 500 });
  }
}
