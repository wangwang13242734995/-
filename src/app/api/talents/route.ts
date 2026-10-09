import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const minScore = parseInt(searchParams.get("minScore") || "0");
    const sortBy = searchParams.get("sortBy") || "totalScore";
    const page = parseInt(searchParams.get("page") || "1");
    const take = 20;
    const skip = (page - 1) * take;

    const where: Record<string, unknown> = { role: "STUDENT" };

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        major: true,
        graduationYear: true,
        bio: true,
        skills: true,
        avatar: true,
        abilityScores: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
        },
        projects: {
          where: { status: "PUBLISHED" },
          select: { id: true, title: true, type: true, credibilityScore: true },
          take: 5,
        },
        _count: {
          select: { projects: true, growthRecords: true },
        },
      },
      skip,
      take,
    });

    const enriched = students.filter((s) => {
      if (category) {
        const skills: string[] = JSON.parse(s.skills as string || "[]");
        if (!skills.some((sk) => sk.toLowerCase().includes(category.toLowerCase()))) return false;
      }
      return true;
    }).map((s) => {
      const scores = s.abilityScores[0] || null;
      return {
        id: s.id,
        name: s.name,
        major: s.major,
        graduationYear: s.graduationYear,
        bio: s.bio,
        skills: JSON.parse(s.skills as string || "[]"),
        avatar: s.avatar,
        scores: scores ? {
          craft: scores.craft,
          learn: scores.learn,
          drive: scores.drive,
          team: scores.team,
          grit: scores.grit,
          express: scores.express,
          totalScore: scores.totalScore,
        } : null,
        topProjects: s.projects,
        projectCount: s._count.projects,
        recordCount: s._count.growthRecords,
      };
    }).filter((s) => !s.scores || s.scores.totalScore >= minScore);

    enriched.sort((a, b) => {
      const aScore = a.scores?.[sortBy as keyof typeof a.scores] ?? 0;
      const bScore = b.scores?.[sortBy as keyof typeof b.scores] ?? 0;
      return (bScore as number) - (aScore as number);
    });

    const total = await prisma.user.count({ where });

    return NextResponse.json({
      students: enriched,
      pagination: { page, take, total, totalPages: Math.ceil(total / take) },
    });
  } catch (error) {
    console.error("Talent search error:", error);
    return NextResponse.json({ error: "搜索失败" }, { status: 500 });
  }
}
