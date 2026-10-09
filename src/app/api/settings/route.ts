import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const profileSchema = z.object({
  name: z.string().min(1, "昵称不能为空").max(30).optional(),
  bio: z.string().max(500).optional(),
  skills: z.array(z.string()).max(50).optional(),
  major: z.string().max(100).optional(),
  graduationYear: z.number().int().min(2020).max(2035).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "新密码至少 6 位"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        skills: true,
        major: true,
        graduationYear: true,
        avatar: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        skills: JSON.parse(user?.skills || "[]"),
      },
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();

    // Handle password change separately
    if (body.currentPassword && body.newPassword) {
      const data = passwordSchema.parse(body);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

      const isValid = await bcrypt.compare(data.currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "当前密码不正确" }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ message: "密码已修改" });
    }

    // Handle profile update
    const data = profileSchema.parse(body);
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.skills !== undefined) updateData.skills = JSON.stringify(data.skills);
    if (data.major !== undefined) updateData.major = data.major;
    if (data.graduationYear !== undefined) updateData.graduationYear = data.graduationYear;
    if (data.avatar !== undefined) updateData.avatar = data.avatar || null;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, bio: true, skills: true, major: true, graduationYear: true, avatar: true },
    });

    return NextResponse.json({ user: { ...updated, skills: JSON.parse(updated.skills || "[]") }, message: "设置已更新" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
