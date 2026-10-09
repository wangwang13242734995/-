import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const [latestScore, scoreHistory, projects, growthRecords] = await Promise.all([
      prisma.abilityScore.findFirst({
        where: { userId },
        orderBy: { calculatedAt: "desc" },
      }),
      prisma.abilityScore.findMany({
        where: { userId },
        orderBy: { calculatedAt: "asc" },
        take: 30,
      }),
      prisma.project.findMany({
        where: { userId, status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.growthRecord.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const parsedProjects = projects.map((p) => ({
      ...p,
      techStack: JSON.parse(p.techStack || "[]"),
    }));

    const uniqueDays = new Set(growthRecords.map((r) => r.createdAt.toDateString())).size;

    let streakDays = 0;
    if (growthRecords.length > 0) {
      const sortedDates = [...new Set(growthRecords.map((r) => r.createdAt.toDateString()))]
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        streakDays = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const curr = new Date(sortedDates[i - 1]);
          const prev = new Date(sortedDates[i]);
          const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
          if (diffDays === 1) {
            streakDays++;
          } else {
            break;
          }
        }
      }
    }

    return NextResponse.json({
      latestScore,
      scoreHistory,
      projects: parsedProjects,
      growthRecords,
      stats: {
        projectCount: projects.length,
        recordCount: growthRecords.length,
        uniqueDays,
        streakDays,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}
