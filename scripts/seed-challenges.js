const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const p = new PrismaClient();

async function main() {
  // Create enterprise user
  const hash = await bcrypt.hash("password123", 10);
  const eUser = await p.user.upsert({
    where: { email: "enterprise@test.com" },
    update: {},
    create: { name: "TestEnterprise", email: "enterprise@test.com", password: hash },
  });
  console.log("Enterprise user:", eUser.id);

  // Create enterprise
  const ent = await p.enterprise.upsert({
    where: { userId: eUser.id },
    update: { status: "APPROVED" },
    create: {
      userId: eUser.id,
      companyName: "字节跳动",
      industry: "互联网",
      description: "全球领先的科技公司",
      status: "APPROVED",
    },
  });
  console.log("Enterprise:", ent.id);

  // Delete existing challenges to avoid duplicates
  await p.challenge.deleteMany({ where: { enterpriseId: ent.id } });

  // Create challenges
  const c1 = await p.challenge.create({
    data: {
      enterpriseId: ent.id,
      title: "短视频数据看板设计",
      description: "设计一个面向创作者的短视频数据看板，展示播放量、完播率、互动率等关键指标并给出优化建议。\n\n要求：\n1. 包含至少3个核心指标\n2. 支持时间维度筛选\n3. 移动端适配",
      category: "数据分析",
      requirements: "具备基础数据可视化能力，了解常见图表类型",
      maxParticipants: 200,
      duration: 14,
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-08-15"),
      status: "OPEN",
      rewardType: "INTERVIEW_PASS",
      rewardDetail: "优秀作品可获得字节跳动数据产品经理岗位面试直通卡",
    },
  });
  console.log("Challenge 1:", c1.id, c1.title);

  const c2 = await p.challenge.create({
    data: {
      enterpriseId: ent.id,
      title: "AI教育产品原型",
      description: "为K12在线教育设计一个AI辅助学习产品原型，包含用户旅程和核心交互流程。\n\n任务包括：\n1. 完成用户调研（假设目标用户为初二学生）\n2. 设计AI自适应学习路径\n3. 输出高保真原型",
      category: "产品",
      requirements: "有产品设计经验，熟悉Figma或类似工具",
      maxParticipants: 100,
      duration: 21,
      startDate: new Date("2026-07-05"),
      endDate: new Date("2026-09-01"),
      status: "OPEN",
      rewardType: "MENTORSHIP",
      rewardDetail: "前10名提交者获得字节高级产品经理1v1辅导",
    },
  });
  console.log("Challenge 2:", c2.id, c2.title);

  // CLOSED challenge for testing
  const c3 = await p.challenge.create({
    data: {
      enterpriseId: ent.id,
      title: "【已结束】前端组件库建设",
      description: "为履程平台设计一套可复用的React组件库（此挑战已结束，用于测试状态）",
      category: "前端开发",
      maxParticipants: 50,
      duration: 7,
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-08"),
      status: "CLOSED",
      rewardType: "CERTIFICATE",
    },
  });
  console.log("Closed challenge:", c3.id, c3.title);

  console.log("\n--- All challenges ---");
  const all = await p.challenge.findMany({ include: { enterprise: { select: { companyName: true } }, _count: { select: { participations: true } } } });
  all.forEach(c => console.log(` [${c.status}] ${c.title} (${c.enterprise.companyName})`));

  await p.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
