import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { calculateAbilityScores } from "@/services/ability-engine";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const scores = await calculateAbilityScores(userId);

    return NextResponse.json({ scores });
  } catch (error) {
    console.error("Ability calculation error:", error);
    return NextResponse.json({ error: "计算失败" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { prisma } = await import("@/lib/prisma");

    const latestScore = await prisma.abilityScore.findFirst({
      where: { userId },
      orderBy: { calculatedAt: "desc" },
    });

    const scoreHistory = await prisma.abilityScore.findMany({
      where: { userId },
      orderBy: { calculatedAt: "asc" },
      take: 30,
    });

    return NextResponse.json({ latestScore, scoreHistory });
  } catch (error) {
    console.error("Ability fetch error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
