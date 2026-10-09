import { prisma } from "@/lib/prisma";

interface AbilityResult {
  craft: number;
  learn: number;
  drive: number;
  team: number;
  grit: number;
  express: number;
  totalScore: number;
}

export async function calculateAbilityScores(userId: string): Promise<AbilityResult> {
  const projects = await prisma.project.findMany({
    where: { userId, status: "PUBLISHED" },
  });

  const growthRecords = await prisma.growthRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (projects.length === 0) {
    return { craft: 30, learn: 30, drive: 30, team: 30, grit: 30, express: 30, totalScore: 30 };
  }

  const craft = calculateCraft(projects, growthRecords);
  const learn = calculateLearn(projects, growthRecords);
  const drive = calculateDrive(projects, growthRecords);
  const team = calculateTeam(projects);
  const grit = calculateGrit(projects, growthRecords);
  const express = calculateExpress(projects, growthRecords);

  const totalScore = Math.round((craft + learn + drive + team + grit + express) / 6);

  const result = { craft, learn, drive, team, grit, express, totalScore };

  await prisma.abilityScore.create({
    data: { userId, ...result },
  });

  return result;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, value)));
}

function calculateCraft(
  projects: { type: string; techStack: string; outcomeType: string; outcomeData: string | null; difficulty: string | null }[],
  _records: unknown[]
): number {
  let score = 30;

  score += Math.min(projects.length * 5, 25);

  const avgTechStack = projects.reduce((sum, p) => {
    const ts = JSON.parse(p.techStack || "[]") as string[];
    return sum + ts.length;
  }, 0) / projects.length;
  score += Math.min(avgTechStack * 3, 15);

  const withOutcome = projects.filter((p) => p.outcomeType !== "NONE").length;
  score += Math.min(withOutcome * 5, 15);

  const withOutcomeData = projects.filter((p) => p.outcomeData).length;
  score += withOutcomeData * 3;

  const complexTypes = ["INTERNSHIP", "CHALLENGE"];
  const complexProjects = projects.filter((p) => complexTypes.includes(p.type)).length;
  score += complexProjects * 4;

  return clamp(score);
}

function calculateLearn(
  projects: { type: string; techStack: string; startDate: Date; endDate: Date | null }[],
  records: { type: string; abilitySignals: string }[]
): number {
  let score = 30;

  const allTech = new Set<string>();
  projects.forEach((p) => {
    const ts = JSON.parse(p.techStack || "[]") as string[];
    ts.forEach((t) => allTech.add(t.toLowerCase()));
  });
  score += Math.min(allTech.size * 3, 20);

  const types = new Set(projects.map((p) => p.type));
  score += Math.min((types.size - 1) * 5, 15);

  const newSkillRecords = records.filter((r) => r.type === "NEW_SKILL").length;
  score += Math.min(newSkillRecords * 4, 15);

  const completedProjects = projects.filter((p) => p.endDate).length;
  if (completedProjects > 0) {
    const avgDuration = projects
      .filter((p) => p.endDate)
      .reduce((sum, p) => {
        const days = (p.endDate!.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / completedProjects;

    if (avgDuration < 30) score += 10;
    else if (avgDuration < 60) score += 5;
  }

  return clamp(score);
}

function calculateDrive(
  projects: { type: string; createdAt: Date }[],
  records: { createdAt: Date }[]
): number {
  let score = 30;

  const personalProjects = projects.filter((p) => p.type === "PERSONAL").length;
  score += Math.min(personalProjects * 8, 24);

  if (records.length > 0) {
    const firstRecord = records[0].createdAt;
    const lastRecord = records[records.length - 1].createdAt;
    const spanDays = (lastRecord.getTime() - firstRecord.getTime()) / (1000 * 60 * 60 * 24);
    const uniqueDays = new Set(records.map((r) => r.createdAt.toDateString())).size;
    const consistency = spanDays > 0 ? uniqueDays / spanDays : 0;
    score += Math.round(consistency * 20);
  }

  score += Math.min(records.length * 2, 15);

  return clamp(score);
}

function calculateTeam(projects: { teamSize: number; role: string }[]): number {
  let score = 30;

  const teamProjects = projects.filter((p) => p.teamSize > 1);
  score += Math.min(teamProjects.length * 8, 32);

  const roles = new Set(teamProjects.map((p) => p.role.toLowerCase()));
  score += Math.min((roles.size - 1) * 5, 15);

  const largeTeams = projects.filter((p) => p.teamSize >= 4).length;
  score += Math.min(largeTeams * 5, 10);

  return clamp(score);
}

function calculateGrit(
  projects: { difficultyEncountered: string | null; solution: string | null; endDate: Date | null; startDate: Date }[],
  records: { type: string }[]
): number {
  let score = 30;

  const withDifficulty = projects.filter((p) => p.difficultyEncountered && p.solution).length;
  score += Math.min(withDifficulty * 8, 24);

  const problemSolvedRecords = records.filter((r) => r.type === "PROBLEM_SOLVED").length;
  score += Math.min(problemSolvedRecords * 5, 15);

  const longProjects = projects.filter((p) => {
    const days = p.endDate
      ? (p.endDate.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    return days > 60;
  });
  const completedLong = longProjects.filter((p) => p.endDate).length;
  if (longProjects.length > 0) {
    score += Math.round((completedLong / longProjects.length) * 15);
  }

  return clamp(score);
}

function calculateExpress(
  projects: { description: string; difficultyEncountered: string | null; solution: string | null }[],
  records: { content: string }[]
): number {
  let score = 30;

  const avgDescLength = projects.reduce((sum, p) => sum + p.description.length, 0) / projects.length;
  if (avgDescLength > 200) score += 10;
  else if (avgDescLength > 100) score += 5;

  const structuredProjects = projects.filter((p) => p.difficultyEncountered && p.solution).length;
  score += Math.min(structuredProjects * 6, 18);

  if (records.length > 0) {
    const avgContentLength = records.reduce((sum, r) => sum + r.content.length, 0) / records.length;
    if (avgContentLength > 100) score += 10;
    else if (avgContentLength > 50) score += 5;
  }

  const longRecords = records.filter((r) => r.content.length > 200).length;
  score += Math.min(longRecords * 3, 12);

  return clamp(score);
}

export function getAbilityLabels(): Record<string, { label: string; description: string }> {
  return {
    craft: { label: "专业力", description: "技术深度、项目复杂度、成果质量" },
    learn: { label: "学习力", description: "新技术采纳速度、跨领域尝试、成长速度" },
    drive: { label: "自驱力", description: "主动做事、持续记录、课外投入" },
    team: { label: "协作力", description: "团队经验、角色多样性、沟通能力" },
    grit: { label: "抗压力", description: "面对困难不放弃、长周期项目完成率" },
    express: { label: "表达力", description: "叙事清晰度、结构化程度、沟通效率" },
  };
}
