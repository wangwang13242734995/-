/**
 * Demo data seeder — idempotent, ZERO runtime deps beyond @prisma/client.
 * MUST NOT require bcryptjs (unavailable in standalone runtime when run by plain node).
 * Password hashes below are precomputed constants (login password = "password123").
 * Called from init-db.js on every container boot; all writes are guarded so re-runs are safe.
 */

const PW_HASH = "$2b$10$E73hEXL6E1aV7yR0eYTR6.szp2DLc4q4JaXratUDd6vApuZapEijS"; // bcrypt("password123")

const round = (a) => Math.round(a.reduce((s, x) => s + x, 0) / a.length);
const daysAgo = (d) => new Date(Date.now() - d * 86400000);

const STUDENTS = [
  { name: "张伟", major: "计算机科学与技术", school: "华中科技大学", graduationYear: 2027,
    skills: ["React", "TypeScript", "Next.js", "数据可视化"],
    trend: [{ craft: 72, learn: 65, drive: 70, team: 60, grit: 55, express: 78 },
            { craft: 80, learn: 70, drive: 76, team: 66, grit: 60, express: 84 },
            { craft: 88, learn: 76, drive: 80, team: 70, grit: 65, express: 90 }] },
  { name: "李娜", major: "统计学", school: "中南财经政法大学", graduationYear: 2026,
    skills: ["Python", "Pandas", "SQL", "机器学习"],
    trend: [{ craft: 70, learn: 80, drive: 68, team: 74, grit: 60, express: 66 },
            { craft: 76, learn: 86, drive: 73, team: 80, grit: 65, express: 70 },
            { craft: 82, learn: 92, drive: 78, team: 85, grit: 70, express: 74 }] },
  { name: "王强", major: "数字媒体技术", school: "浙江传媒学院", graduationYear: 2027,
    skills: ["Figma", "用户研究", "交互设计", "Principle"],
    trend: [{ craft: 50, learn: 60, drive: 74, team: 80, grit: 60, express: 82 },
            { craft: 55, learn: 66, drive: 80, team: 86, grit: 64, express: 89 },
            { craft: 60, learn: 70, drive: 85, team: 92, grit: 68, express: 95 }] },
  { name: "陈静", major: "软件工程", school: "西安电子科技大学", graduationYear: 2026,
    skills: ["Go", "Kubernetes", "PostgreSQL", "分布式系统"],
    trend: [{ craft: 78, learn: 70, drive: 78, team: 58, grit: 82, express: 52 },
            { craft: 84, learn: 75, drive: 83, team: 62, grit: 87, express: 56 },
            { craft: 90, learn: 80, drive: 88, team: 66, grit: 92, express: 60 }] },
];

async function seedDemo(prisma) {
  // ---- 1. Enterprise (字节跳动) ----
  let eUser = await prisma.user.findUnique({ where: { email: "enterprise@test.com" } });
  if (!eUser) {
    eUser = await prisma.user.create({
      data: { name: "TestEnterprise", email: "enterprise@test.com", password: PW_HASH, role: "ENTERPRISE" },
    });
  } else if (eUser.role !== "ENTERPRISE") {
    eUser = await prisma.user.update({ where: { id: eUser.id }, data: { role: "ENTERPRISE" } });
  }

  let ent = await prisma.enterprise.findUnique({ where: { userId: eUser.id } });
  if (!ent) {
    ent = await prisma.enterprise.create({
      data: {
        userId: eUser.id, companyName: "字节跳动", industry: "互联网", companySize: "10000人以上",
        creditCode: "91110108551386082L", legalPerson: "张三", verificationLevel: "DEEP",
        description: "全球领先的科技公司，主营短视频、信息与教育等业务，致力于用技术服务每一个用户。",
        website: "https://bytedance.com", address: "北京市海淀区", contactPerson: "人力资源部",
        recruitingNeeds: "数据产品、前端、算法方向实习生与校招", status: "APPROVED", verifiedAt: new Date(),
      },
    });
  } else if (ent.status !== "APPROVED" || ent.verificationLevel !== "DEEP") {
    ent = await prisma.enterprise.update({ where: { id: ent.id }, data: { status: "APPROVED", verificationLevel: "DEEP" } });
  }

  // ---- 2. Challenges (only if this enterprise has none) ----
  const chCount = await prisma.challenge.count({ where: { enterpriseId: ent.id } });
  if (chCount === 0) {
    await prisma.challenge.createMany({
      data: [
        { enterpriseId: ent.id, title: "短视频数据看板设计",
          description: "设计一个面向创作者的短视频数据看板，展示播放量、完播率、互动率等关键指标并给出优化建议。\n\n要求：\n1. 包含至少3个核心指标\n2. 支持时间维度筛选\n3. 移动端适配",
          category: "数据分析", requirements: "具备基础数据可视化能力，了解常见图表类型",
          maxParticipants: 200, duration: 14, startDate: daysAgo(20), endDate: daysAgo(-40), status: "OPEN",
          rewardType: "INTERVIEW_PASS", rewardDetail: "优秀作品可获得面试直通卡" },
        { enterpriseId: ent.id, title: "AI教育产品原型",
          description: "为K12在线教育设计一个AI辅助学习产品原型，包含用户旅程和核心交互流程。\n\n任务：\n1. 完成用户调研\n2. 设计AI自适应学习路径\n3. 输出高保真原型",
          category: "产品", requirements: "有产品设计经验，熟悉Figma或类似工具",
          maxParticipants: 100, duration: 21, startDate: daysAgo(15), endDate: daysAgo(-30), status: "OPEN",
          rewardType: "MENTORSHIP", rewardDetail: "前10名提交者获得高级产品经理1v1辅导" },
        { enterpriseId: ent.id, title: "【已结束】前端组件库建设",
          description: "为平台设计一套可复用的React组件库（此挑战已结束，用于展示状态区分）",
          category: "前端开发", maxParticipants: 50, duration: 7,
          startDate: daysAgo(60), endDate: daysAgo(50), status: "CLOSED", rewardType: "CERTIFICATE" },
      ],
    });
  }

  // ---- 3. Students + ability trend + projects + growth records ----
  const openChallenges = await prisma.challenge.findMany({ where: { enterpriseId: ent.id, status: "OPEN" } });
  for (const s of STUDENTS) {
    const email = s.name === "张伟" ? "student1@test.com"
      : s.name === "李娜" ? "student2@test.com"
      : s.name === "王强" ? "student3@test.com" : "student4@test.com";

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { name: s.name, email, password: PW_HASH, role: "STUDENT",
          major: s.major, school: s.school, graduationYear: s.graduationYear, skills: JSON.stringify(s.skills) },
      });
    }

    // ability snapshots (only if none exist) → drives radar + growth trend line
    const asCount = await prisma.abilityScore.count({ where: { userId: user.id } });
    if (asCount === 0) {
      const offsets = [60, 30, 1];
      for (let i = 0; i < s.trend.length; i++) {
        const d = s.trend[i];
        await prisma.abilityScore.create({
          data: { userId: user.id, ...d, totalScore: round([d.craft, d.learn, d.drive, d.team, d.grit, d.express]),
            calculatedAt: daysAgo(offsets[i] || 1) },
        });
      }
    }

    // published projects (only if none)
    const pjCount = await prisma.project.count({ where: { userId: user.id } });
    if (pjCount === 0) {
      await prisma.project.createMany({
        data: [
          { userId: user.id, title: `${s.skills[0]} 实战项目：校园数据助手`, type: "PERSONAL", role: "独立开发",
            startDate: daysAgo(90), endDate: daysAgo(60), techStack: JSON.stringify(s.skills.slice(0, 3)), status: "PUBLISHED",
            description: `围绕${s.major}方向，使用 ${s.skills.join("、")} 完成的一个完整项目，覆盖需求分析、原型设计、开发与上线全流程，并沉淀了可复用的模块。`,
            difficultyEncountered: "初期对核心数据结构理解不深，导致首版性能较差，渲染卡顿明显。",
            solution: "通过定位热点、引入缓存与虚拟列表重构渲染，最终将首屏加载时间从 3.2s 优化到 0.8s。",
            outcome: "上线后被校内 200+ 同学使用，量化指标（日活/留存）持续提升。", outcomeType: "METRIC", credibilityScore: 8 },
          { userId: user.id, title: `${s.category || s.skills[1]} 课程大作业`, type: "COURSE", role: "组长",
            teamSize: 4, startDate: daysAgo(120), endDate: daysAgo(100), techStack: JSON.stringify([s.skills[0]]), status: "PUBLISHED",
            description: `作为组长带领 4 人团队完成课程项目，负责任务拆分、进度协调与最终答辩汇报，最终获得课程最高评价，过程充分体现了跨职能协作与推进能力。`,
            difficultyEncountered: "组员进度不一，中期出现关键模块无人认领的风险。",
            solution: "重新划分任务粒度并引入每日同步机制，主动承担了最难的模块。",
            outcome: "课程综合评分 95/100，被评为优秀作业。", outcomeType: "AWARD", credibilityScore: 6 },
        ],
      });
    }

    // growth records (only if none)
    const grCount = await prisma.growthRecord.count({ where: { userId: user.id } });
    if (grCount === 0) {
      await prisma.growthRecord.createMany({
        data: [
          { userId: user.id, type: "MILESTONE", title: "完成校园数据助手并上线", date: daysAgo(60),
            content: `花了三周把 ${s.skills[0]} 数据助手从原型推到上线，最难的是性能优化那一段，最终首屏从 3.2s 降到 0.8s，看到有人真的在用，特别有成就感。`,
            abilitySignals: JSON.stringify(["craft", "drive"]) },
          { userId: user.id, type: "CHALLENGE", title: "课程项目担任组长", date: daysAgo(100),
            content: "第一次做组长，学会了怎么把大目标拆成人人能上手的小任务，也在冲突里学会了先听后说，团队效率肉眼可见地变好了。",
            abilitySignals: JSON.stringify(["team", "express"]) },
          { userId: user.id, type: "LEARNING", title: "系统学完一门核心课", date: daysAgo(30),
            content: `利用空余时间系统补齐了${s.major}相关的一块短板，做了笔记和小练习，回头看当初卡住自己的地方，其实只是没找到那把合适的钥匙。`,
            abilitySignals: JSON.stringify(["learn", "grit"]) },
        ],
      });
    }

    // participation in first open challenge (idempotent via unique)
    if (openChallenges[0]) {
      const existing = await prisma.challengeParticipation.findUnique({
        where: { userId_challengeId: { userId: user.id, challengeId: openChallenges[0].id } },
      });
      if (!existing) {
        const submitted = ["张伟", "李娜"].includes(s.name);
        await prisma.challengeParticipation.create({
          data: { userId: user.id, challengeId: openChallenges[0].id,
            status: submitted ? "SUBMITTED" : "IN_PROGRESS",
            submittedAt: submitted ? daysAgo(2) : null,
            submission: submitted ? "这是我的数据看板作品，包含播放量/完播率/互动率三个核心指标与移动端适配方案，附设计说明与可交互原型链接。" : null,
            links: JSON.stringify(submitted ? ["https://example.com/demo-" + s.name] : []) },
        });
      }
    }
  }

  console.log(`Demo data ensured: 1 enterprise, ${STUDENTS.length} students, ${chCount === 0 ? 3 : 0} challenges created.`);
}

module.exports = { seedDemo };

// Allow standalone execution: `node scripts/seed-demo.js`
if (require.main === module) {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  seedDemo(prisma)
    .catch((e) => { console.error("seedDemo error:", e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
