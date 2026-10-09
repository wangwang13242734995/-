import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        enterprise: { select: { companyName: true, logo: true, industry: true, description: true } },
        _count: { select: { participations: true } },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "挑战赛不存在" }, { status: 404 });
    }

    let myParticipation = null;
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const userId = (session.user as { id: string }).id;
      myParticipation = await prisma.challengeParticipation.findUnique({
        where: { userId_challengeId: { userId, challengeId: id } },
      });
    }

    return NextResponse.json({
      challenge: { ...challenge, myParticipation },
    });
  } catch (error) {
    console.error("Challenge detail error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
