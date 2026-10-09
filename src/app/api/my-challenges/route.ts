import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const participations = await prisma.challengeParticipation.findMany({
      where: { userId },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            endDate: true,
            rewardType: true,
            enterprise: { select: { companyName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ participations });
  } catch (error) {
    console.error("My challenges fetch error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
