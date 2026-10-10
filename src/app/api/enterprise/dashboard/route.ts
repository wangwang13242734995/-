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
    const enterprise = await prisma.enterprise.findUnique({
      where: { userId },
      include: {
        challenges: {
          include: {
            _count: { select: { participations: true } },
            participations: {
              where: { status: "SUBMITTED" },
              select: { id: true, user: { select: { id: true, name: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!enterprise) {
      return NextResponse.json({ error: "企业不存在" }, { status: 404 });
    }

    // Count SUBMITTED participations that need review
    const submittedCount = await prisma.challengeParticipation.count({
      where: {
        challenge: { enterpriseId: enterprise.id },
        status: "SUBMITTED",
      },
    });

    // Total participants across all challenges
    const totalParticipants = await prisma.challengeParticipation.count({
      where: { challenge: { enterpriseId: enterprise.id } },
    });

    // Active challenges (OPEN status)
    const activeChallenges = enterprise.challenges.filter((c) => c.status === "OPEN").length;

    // Top recent talents (students who participated in this enterprise's challenges with high scores)
    const recentParticipants = await prisma.challengeParticipation.findMany({
      where: { challenge: { enterpriseId: enterprise.id } },
      include: {
        user: {
          select: {
            id: true, name: true, major: true, graduationYear: true,
            abilityScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
          },
        },
        challenge: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    });

    const topTalents = recentParticipants.map((p) => ({
      id: p.user.id,
      name: p.user.name,
      major: p.user.major,
      graduationYear: p.user.graduationYear,
      totalScore: p.user.abilityScores[0]?.totalScore ?? 0,
      scores: p.user.abilityScores[0] ? {
        craft: p.user.abilityScores[0].craft,
        learn: p.user.abilityScores[0].learn,
        drive: p.user.abilityScores[0].drive,
        team: p.user.abilityScores[0].team,
        grit: p.user.abilityScores[0].grit,
        express: p.user.abilityScores[0].express,
      } : null,
      lastChallenge: p.challenge.title,
    }));

    return NextResponse.json({
      dashboard: {
        enterprise: {
          id: enterprise.id,
          companyName: enterprise.companyName,
          status: enterprise.status,
          industry: enterprise.industry,
          companySize: enterprise.companySize,
          verificationLevel: enterprise.verificationLevel,
          creditCodeMasked: enterprise.creditCode
            ? enterprise.creditCode.slice(0, 4) + "**********" + enterprise.creditCode.slice(-4)
            : null,
          legalPerson: enterprise.legalPerson,
        },
        stats: {
          pendingReviews: submittedCount,
          totalParticipants,
          activeChallenges,
          totalChallenges: enterprise.challenges.length,
        },
        challenges: enterprise.challenges.map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          startDate: c.startDate,
          endDate: c.endDate,
          participantCount: c._count.participations,
        })),
        topTalents,
      },
    });
  } catch (error) {
    console.error("Enterprise dashboard error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
