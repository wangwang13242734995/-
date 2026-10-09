import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateWeeklyReview } from "@/services/weekly-review-engine";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const review = await generateWeeklyReview(userId);

    if (!review) {
      return NextResponse.json({ error: "无法生成周复盘" }, { status: 500 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Weekly review API error:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
