import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  participationId: z.string(),
  action: z.enum(["ACCEPT", "REJECT", "RANK"]),
  feedback: z.string().max(500).optional(),
  rank: z.number().int().min(1).max(1000).optional(),
});

export async function GET(
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

    const { id: challengeId } = await params;
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId, enterpriseId: enterprise.id },
      include: {
        participations: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "挑战赛不存在" }, { status: 404 });
    }

    const submissions = challenge.participations.map((p) => ({
      id: p.id,
      userId: p.userId,
      userName: p.user.name,
      userEmail: p.user.email,
      userAvatar: p.user.avatar,
      submission: p.submission,
      links: JSON.parse(p.links || "[]"),
      status: p.status,
      submittedAt: p.submittedAt,
      reviewedAt: p.reviewedAt,
      feedback: p.feedback,
      rank: p.rank,
    }));

    return NextResponse.json({
      challenge: { id: challenge.id, title: challenge.title, status: challenge.status },
      submissions,
    });
  } catch (error) {
    console.error("Review fetch error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

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

    const { id: challengeId } = await params;
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId, enterpriseId: enterprise.id },
    });
    if (!challenge) {
      return NextResponse.json({ error: "挑战赛不存在" }, { status: 404 });
    }

    const body = await req.json();
    const data = reviewSchema.parse(body);

    // Verify the participation belongs to this challenge
    const participation = await prisma.challengeParticipation.findFirst({
      where: { id: data.participationId, challengeId },
    });
    if (!participation) {
      return NextResponse.json({ error: "提交记录不存在" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      reviewedAt: new Date(),
    };

    if (data.action === "ACCEPT") {
      updateData.status = "ACCEPTED";
      if (data.feedback) updateData.feedback = data.feedback;
    } else if (data.action === "REJECT") {
      updateData.status = "REJECTED";
      if (data.feedback) updateData.feedback = data.feedback;
    } else if (data.action === "RANK") {
      if (!data.rank) return NextResponse.json({ error: "请提供排名" }, { status: 400 });
      updateData.rank = data.rank;
      updateData.status = "ACCEPTED";
      if (data.feedback) updateData.feedback = data.feedback;
    }

    await prisma.challengeParticipation.update({
      where: { id: data.participationId },
      data: updateData,
    });

    return NextResponse.json({ message: "评审已完成" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Review action error:", error);
    return NextResponse.json({ error: "评审失败" }, { status: 500 });
  }
}
