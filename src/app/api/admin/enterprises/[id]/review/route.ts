import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  scope: z.enum(["status", "deep"]),
  reason: z.string().max(200).optional(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "请先登录", status: 401 };
  if ((session.user as { role?: string }).role !== "ADMIN") return { error: "无管理员权限", status: 403 };
  return {};
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin();
    if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

    const { id } = await params;
    const body = await req.json();
    const { action, scope, reason } = schema.parse(body);

    const enterprise = await prisma.enterprise.findUnique({ where: { id } });
    if (!enterprise) return NextResponse.json({ error: "企业不存在" }, { status: 404 });

    let data: Record<string, unknown> = {};
    if (scope === "status") {
      if (action === "reject" && !reason) {
        return NextResponse.json({ error: "拒绝基础认证必须填写理由" }, { status: 400 });
      }
      data = action === "approve"
        ? { status: "APPROVED", verifiedAt: new Date(), rejectReason: null }
        : { status: "REJECTED", rejectReason: reason || null };
    } else {
      // deep
      if (enterprise.status !== "APPROVED") {
        return NextResponse.json({ error: "需先通过基础认证才能进行深度核验" }, { status: 400 });
      }
      data = action === "approve"
        ? { verificationLevel: "DEEP" }
        : { verificationLevel: "BASIC" };
    }

    const updated = await prisma.enterprise.update({ where: { id }, data });

    return NextResponse.json({
      enterprise: { id: updated.id, status: updated.status, verificationLevel: updated.verificationLevel },
      message: action === "approve"
        ? (scope === "status" ? "已通过基础认证" : "已通过深度核验，徽章已生效")
        : (scope === "status" ? "已拒绝企业认证" : "已退回深度核验"),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Admin review error:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
