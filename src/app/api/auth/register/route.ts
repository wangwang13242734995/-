import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "昵称至少 2 个字符"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 个字符"),
  bio: z.string().max(100, "介绍最多 100 字").optional(),
  major: z.string().optional(),
  availableYear: z.number().int().min(2020).max(2035).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已注册" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "STUDENT",
        bio: data.bio || null,
        major: data.major,
        graduationYear: data.availableYear,
      },
    });

    await prisma.abilityScore.create({
      data: {
        userId: user.id,
        craft: 30,
        learn: 30,
        drive: 30,
        team: 30,
        grit: 30,
        express: 30,
        totalScore: 30,
      },
    });

    return NextResponse.json(
      { message: "注册成功", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
