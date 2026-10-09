/**
 * 成就系统引擎
 * 检测能力分数突破里程碑 + 项目数量里程碑
 */

export interface Achievement {
  id: string;
  type: "SCORE_MILESTONE" | "PROJECT_MILESTONE" | "STREAK" | "FIRST";
  title: string;
  description: string;
  icon: string;
  threshold: number;
  achieved: boolean;
}

const SCORE_THRESHOLDS = [50, 70, 90];

const ABILITY_LABELS: Record<string, string> = {
  craft: "专业力",
  learn: "学习力",
  drive: "自驱力",
  team: "协作力",
  grit: "抗压力",
  express: "表达力",
};

export function checkScoreAchievements(scores: Record<string, number>): Achievement[] {
  const achievements: Achievement[] = [];

  for (const [key, label] of Object.entries(ABILITY_LABELS)) {
    const score = scores[key] || 0;
    for (const threshold of SCORE_THRESHOLDS) {
      const achieved = score >= threshold;
      achievements.push({
        id: `${key}_${threshold}`,
        type: "SCORE_MILESTONE",
        title: `${label}突破${threshold}分`,
        description: achieved
          ? `你的${label}已达到${Math.round(score)}分，超越了大部分同龄人。`
          : `距离${label}突破${threshold}分还差${Math.ceil(threshold - score)}分`,
        icon: threshold === 50 ? "🌱" : threshold === 70 ? "⭐" : "🏆",
        threshold,
        achieved,
      });
    }
  }

  return achievements;
}

export function checkProjectMilestones(projectCount: number): Achievement[] {
  const milestones = [1, 3, 5, 10, 20];
  return milestones.map((count) => ({
    id: `project_${count}`,
    type: "PROJECT_MILESTONE" as const,
    title: count === 1 ? "第一步" : `第${count}个项目`,
    description: count === 1
      ? "千里之行，始于足下。你迈出了最关键的第一步。"
      : `你已经记录了${count}个项目，在履程的故事越来越丰富了。`,
    icon: count === 1 ? "🚀" : count <= 3 ? "📝" : count <= 5 ? "📚" : count <= 10 ? "💎" : "👑",
    threshold: count,
    achieved: projectCount >= count,
  }));
}

export function checkStreakAchievements(streakDays: number): Achievement[] {
  const streaks = [3, 7, 14, 30];
  return streaks.map((days) => ({
    id: `streak_${days}`,
    type: "STREAK" as const,
    title: `连续记录${days}天`,
    description: days <= 7
      ? `坚持${days}天，习惯正在形成。`
      : `${days}天的连续记录，这已经是少数人才能做到的事了。`,
    icon: days <= 7 ? "🔥" : days <= 14 ? "⚡" : "🌟",
    threshold: days,
    achieved: streakDays >= days,
  }));
}

export function getAllAchievements(
  scores: Record<string, number>,
  projectCount: number,
  streakDays: number
): Achievement[] {
  return [
    ...checkScoreAchievements(scores),
    ...checkProjectMilestones(projectCount),
    ...checkStreakAchievements(streakDays),
  ];
}

export function getAchievementStats(
  scores: Record<string, number>,
  projectCount: number,
  streakDays: number
) {
  const all = getAllAchievements(scores, projectCount, streakDays);
  const unlocked = all.filter((a) => a.achieved);
  const recent = unlocked.slice(-3).reverse(); // 最近解锁的3个

  return {
    unlocked: unlocked.length,
    total: all.length,
    percentage: Math.round((unlocked.length / all.length) * 100),
    recent,
    all,
  };
}
