import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const challengeSchema = z.object({
  title: z.string().min(2, "挑战赛标题至少 2 个字符"),
  description: z.string().min(10, "描述至少 10 个字符"),
  category: z.string().min(1, "请选择品类"),
  requirements: z.string().optional(),
  maxParticipants: z.number().int().min(1).max(10000).default(100),
  duration: z.number().int().min(1).max(90).default(14),
  startDate: z.string(),
  rewardType: z.enum(["INTERVIEW_PASS", "GREEN_CHANNEL", "MENTORSHIP", "CASH", "CERTIFICATE"]).default("CERTIFICATE"),
  rewardDetail: z.string().optional(),
  publish: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const enterprise = await prisma.enterprise.findUnique({ where: { userId } });

    if (!enterprise || enterprise.status !== "APPROVED") {
      return NextResponse.json({ error: "企业认证未通过" }, { status: 403 });
    }

    const body = await req.json();
    const data = challengeSchema.parse(body);

    const startDate = new Date(data.startDate);
    const endDate = new Date(startDate.getTime() + data.duration * 86400000);

    const challenge = await prisma.challenge.create({
      data: {
        enterpriseId: enterprise.id,
        title: data.title,
        description: data.description,
        category: data.category,
        requirements: data.requirements,
        maxParticipants: data.maxParticipants,
        duration: data.duration,
        startDate,
        endDate,
        status: data.publish ? "OPEN" : "DRAFT",
        rewardType: data.rewardType,
        rewardDetail: data.rewardDetail,
      },
    });

    return NextResponse.json({ challenge, message: "挑战赛创建成功" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Challenge creation error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "OPEN";

    const where: Record<string, unknown> = { status };
    if (category) where.category = category;

    const challenges = await prisma.challenge.findMany({
      where,
      include: {
        enterprise: { select: { companyName: true, logo: true } },
        _count: { select: { participations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error("Challenge list error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
