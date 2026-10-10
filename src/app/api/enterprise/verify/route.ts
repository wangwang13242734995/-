import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 深度认证申请：企业补充法人姓名与营业执照官方链接，提交后进入 PENDING_DEEP，
// 由平台人工比对国家企业公示系统后升级为 DEEP（展示"已核验企业"徽章）。
const schema = z.object({
  legalPerson: z.string().min(2, "法人姓名至少 2 个字符"),
  businessLicenseUrl: z.string().url("请填写有效的链接（如国家企业公示系统页面）").optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const enterprise = await prisma.enterprise.findUnique({ where: { userId } });
    if (!enterprise) {
      return NextResponse.json({ error: "企业不存在" }, { status: 404 });
    }
    if (enterprise.verificationLevel === "DEEP" || enterprise.verificationLevel === "PENDING_DEEP") {
      return NextResponse.json({ error: "已提交深度认证申请" }, { status: 400 });
    }

    const body = await req.json();
    const data = schema.parse(body);

    const updated = await prisma.enterprise.update({
      where: { id: enterprise.id },
      data: {
        legalPerson: data.legalPerson,
        website: data.businessLicenseUrl || enterprise.website,
        verificationLevel: "PENDING_DEEP",
      },
    });

    return NextResponse.json(
      { verificationLevel: updated.verificationLevel, message: "深度认证申请已提交，审核通过后将获得「已核验企业」徽章" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Enterprise deep verify error:", error);
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
