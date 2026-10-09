import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const radarSchema = z.object({
  minTotalScore: z.number().min(0).max(100).default(50),
  preferredDimension: z.enum(["craft", "learn", "drive", "team", "grit", "express"]).optional(),
  minDimensionScore: z.number().min(0).max(100).optional(),
  category: z.string().optional(),
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
    const criteria = radarSchema.parse(body);

    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        name: true,
        major: true,
        skills: true,
        abilityScores: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
        },
      },
    });

    const matches = students.filter((s) => {
      const scores = s.abilityScores[0];
      if (!scores) return false;
      if (scores.totalScore < criteria.minTotalScore) return false;
      if (criteria.preferredDimension && criteria.minDimensionScore) {
        const dimScore = scores[criteria.preferredDimension];
        if (dimScore < criteria.minDimensionScore) return false;
      }
      if (criteria.category) {
        const skills: string[] = JSON.parse((s.skills as string) || "[]");
        if (!skills.includes(criteria.category)) return false;
      }
      return true;
    });

    const results = matches.map((s) => {
      const scores = s.abilityScores[0];
      return {
        id: s.id,
        name: s.name,
        major: s.major,
        scores: scores ? {
          craft: scores.craft,
          learn: scores.learn,
          drive: scores.drive,
          team: scores.team,
          grit: scores.grit,
          express: scores.express,
          totalScore: scores.totalScore,
        } : null,
      };
    }).sort((a, b) => (b.scores?.totalScore || 0) - (a.scores?.totalScore || 0));

    return NextResponse.json({
      radar: { criteria, matchCount: results.length, matches: results.slice(0, 20) },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Talent radar error:", error);
    return NextResponse.json({ error: "搜索失败" }, { status: 500 });
  }
}
