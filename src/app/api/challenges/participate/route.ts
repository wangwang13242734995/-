import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const participateSchema = z.object({
  challengeId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const { challengeId } = participateSchema.parse(body);

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge || challenge.status !== "OPEN") {
      return NextResponse.json({ error: "挑战赛不可参与" }, { status: 400 });
    }

    const existing = await prisma.challengeParticipation.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
    if (existing) {
      return NextResponse.json({ error: "你已经参与了该挑战赛" }, { status: 400 });
    }

    const participation = await prisma.challengeParticipation.create({
      data: { userId, challengeId },
    });

    await prisma.growthRecord.create({
      data: {
        userId,
        type: "COMPETITION",
        title: `参与挑战赛：${challenge.title}`,
        content: `开始参与企业挑战赛「${challenge.title}」`,
        abilitySignals: JSON.stringify(["COMPETITIVE", "SELF_DRIVEN"]),
      },
    });

    return NextResponse.json({ participation, message: "已加入挑战赛" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Participation error:", error);
    return NextResponse.json({ error: "参与失败" }, { status: 500 });
  }
}

const submitSchema = z.object({
  challengeId: z.string(),
  submission: z.string().min(20, "提交内容至少 20 个字符"),
  links: z.array(z.string()).default([]),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const data = submitSchema.parse(body);

    const participation = await prisma.challengeParticipation.update({
      where: { userId_challengeId: { userId, challengeId: data.challengeId } },
      data: {
        submission: data.submission,
        links: JSON.stringify(data.links),
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    const challenge = await prisma.challenge.findUnique({ where: { id: data.challengeId } });

    await prisma.growthRecord.create({
      data: {
        userId,
        type: "MILESTONE",
        title: `提交挑战赛作品：${challenge?.title || ""}`,
        content: data.submission,
        abilitySignals: JSON.stringify(["RESULT_ORIENTED", "PROBLEM_SOLVING"]),
      },
    });

    return NextResponse.json({ participation, message: "作品已提交" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Submission error:", error);
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
