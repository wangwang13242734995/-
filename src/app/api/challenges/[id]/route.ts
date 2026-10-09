import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

const statusSchema = z.object({
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "COMPLETED"]),
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
    const enterprise = await prisma.enterprise.findUnique({ where: { userId } });
    if (!enterprise || enterprise.status !== "APPROVED") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await params;
    const challenge = await prisma.challenge.findUnique({ where: { id } });
    if (!challenge || challenge.enterpriseId !== enterprise.id) {
      return NextResponse.json({ error: "挑战赛不存在" }, { status: 404 });
    }

    const body = await req.json();
    const { status } = statusSchema.parse(body);

    const updated = await prisma.challenge.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ challenge: updated, message: `挑战赛状态已更新为 ${status}` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Challenge status update error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
