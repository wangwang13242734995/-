import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "请先登录", status: 401 };
  if ((session.user as { role?: string }).role !== "ADMIN") return { error: "无管理员权限", status: 403 };
  return {};
}

export async function GET() {
  try {
    const guard = await requireAdmin();
    if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

    const select = {
      id: true, companyName: true, industry: true, companySize: true,
      creditCode: true, website: true, contactPerson: true, contactEmail: true,
      address: true, recruitingNeeds: true, description: true,
      status: true, verificationLevel: true, legalPerson: true,
      createdAt: true,
      _count: { select: { challenges: true } },
    } as const;

    const [pendingStatus, pendingDeep, approved] = await Promise.all([
      prisma.enterprise.findMany({ where: { status: "PENDING" }, select, orderBy: { createdAt: "asc" } }),
      prisma.enterprise.findMany({ where: { verificationLevel: "PENDING_DEEP" }, select, orderBy: { updatedAt: "asc" } }),
      prisma.enterprise.findMany({ where: { status: "APPROVED" }, select, orderBy: { verifiedAt: "desc" }, take: 50 }),
    ]);

    return NextResponse.json({
      counts: {
        pendingStatus: pendingStatus.length,
        pendingDeep: pendingDeep.length,
        approved: approved.length,
      },
      pendingStatus,
      pendingDeep,
      approved,
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
