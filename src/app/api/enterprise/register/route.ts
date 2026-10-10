import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 企业独立注册：一次采集「管理员账号 + 企业信息」，直接创建 ENTERPRISE 账号并提交认证。
// 与求职者(/auth/register)完全分离，不采集任何专业/入职年份等学生字段。
const schema = z.object({
  // 管理员账号
  adminName: z.string().min(2, "联系人姓名至少 2 个字符"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 个字符"),
  contactPosition: z.string().optional(),
  // 企业信息
  companyName: z.string().min(2, "企业名称至少 2 个字符"),
  creditCode: z
    .string()
    .length(18, "统一社会信用代码为 18 位")
    .regex(/^[0-9A-HJ-NPQRTUWXY]{18}$/, "统一社会信用代码格式不正确（仅含数字与大写字母，不含 I/O/S/V/Z）"),
  industry: z.string().min(1, "请选择所属行业"),
  companySize: z.string().min(1, "请选择公司规模"),
  description: z.string().min(20, "企业简介至少 20 个字符"),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  recruitingNeeds: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.adminName,
          email: data.email,
          password: hashed,
          role: "ENTERPRISE",
        },
      });
      const enterprise = await tx.enterprise.create({
        data: {
          userId: user.id,
          companyName: data.companyName,
          creditCode: data.creditCode,
          industry: data.industry,
          companySize: data.companySize,
          verificationLevel: "BASIC",
          description: data.description,
          website: data.website || null,
          contactPerson: data.adminName,
          contactPosition: data.contactPosition || null,
          contactEmail: data.email,
          address: data.address || null,
          recruitingNeeds: data.recruitingNeeds || null,
          status: "PENDING",
        },
      });
      return { user, enterprise };
    });

    return NextResponse.json(
      { message: "企业注册成功，认证审核中", enterpriseId: result.enterprise.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Enterprise self-registration error:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
