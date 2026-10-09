import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const enterpriseSchema = z.object({
  companyName: z.string().min(2, "企业名称至少 2 个字符"),
  industry: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const existing = await prisma.enterprise.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ error: "您已提交企业认证" }, { status: 400 });
    }

    const body = await req.json();
    const data = enterpriseSchema.parse(body);

    await prisma.user.update({
      where: { id: userId },
      data: { role: "ENTERPRISE" },
    });

    const enterprise = await prisma.enterprise.create({
      data: {
        userId,
        companyName: data.companyName,
        industry: data.industry,
        description: data.description,
        website: data.website || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ enterprise, message: "企业认证申请已提交" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Enterprise registration error:", error);
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const enterprise = await prisma.enterprise.findUnique({
      where: { userId },
      include: { challenges: true },
    });

    return NextResponse.json({ enterprise });
  } catch (error) {
    console.error("Enterprise fetch error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
