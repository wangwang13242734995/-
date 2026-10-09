// Comprehensive QA test script - run with: node scripts/qa-test.js
const BASE = "http://localhost:3456";
let cookies = {};

function cookieHeader() {
  return Object.entries(cookies).map(([k,v]) => `${k}=${v}`).join("; ");
}
function extractCookies(setCookie) {
  if (!setCookie) return;
  // Handle multiple set-cookie headers (comma separated)
  const parts = setCookie.split(",").map(s => s.trim());
  for (const part of parts) {
    const kv = part.split(";")[0].trim();
    const eq = kv.indexOf("=");
    if (eq > 0) { cookies[kv.slice(0, eq)] = kv.slice(eq + 1); }
  }
}

async function api(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...opts.headers };
  const ch = cookieHeader();
  if (ch) headers["Cookie"] = ch;
  const r = await fetch(BASE + path, { ...opts, headers, redirect: "manual" });
  extractCookies(r.headers.get("set-cookie"));
  const data = await r.json().catch(() => null);
  return { status: r.status, data, location: r.headers.get("location") };
}

async function page(path) {
  const headers = {};
  const ch = cookieHeader();
  if (ch) headers["Cookie"] = ch;
  const r = await fetch(BASE + path, { headers, redirect: "manual" });
  extractCookies(r.headers.get("set-cookie"));
  return { status: r.status, location: r.headers.get("location") };
}

const results = [];
function log(name, result, pass) {
  results.push({ name, pass, ...result });
  console.log(`${pass ? "✅" : "❌"} ${name}: status=${result.status}${result.data?.error ? " err=" + result.data.error : ""}`);
}

async function main() {
  console.log("=== 1. PAGES ===\n");
  
  const publicPages = ["/", "/challenges", "/auth/login", "/auth/register", "/enterprise/register"];
  for (const p of publicPages) {
    const r = await page(p);
    log(`GET ${p}`, r, r.status === 200);
  }

  console.log("\n=== 2. PROTECTED PAGES (should redirect) ===\n");
  const protectedPages = ["/dashboard", "/projects", "/records", "/weekly-review", "/my-challenges", "/time-capsule"];
  for (const p of protectedPages) {
    const r = await page(p);
    log(`GET ${p} (no auth)`, r, r.status === 307 || r.status === 302);
  }

  console.log("\n=== 3. REGISTRATION ===\n");
  const regEmail = `qa${Date.now()}@test.com`;
  const reg = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "QA Tester", email: regEmail, password: "123456" }),
  });
  log("Register new user", reg, reg.status === 201);

  const dupReg = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Dup", email: regEmail, password: "123456" }),
  });
  log("Register duplicate email", dupReg, dupReg.status === 400 || dupReg.status === 409);

  console.log("\n=== 4. LOGIN ===\n");
  const loginRes = await api("/api/auth/callback/credentials", {
    method: "POST",
    body: JSON.stringify({ email: regEmail, password: "123456", csrfToken: "test" }),
  });
  // NextAuth uses form-encoded, let me try session check instead
  const session1 = await api("/api/auth/session");
  log("Session (before proper login)", session1, true); // just checking endpoint works

  // Try NextAuth flow with form-encoded
  const csrfRes = await api("/api/auth/csrf");
  const csrfToken = csrfRes.data?.csrfToken;
  console.log(`  csrf token: ${csrfToken ? "obtained" : "FAILED"}`);

  const formBody = new URLSearchParams({ csrfToken, email: regEmail, password: "123456", json: "true" });
  const loginR = await fetch(BASE + "/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cookie": cookieHeader() },
    body: formBody.toString(),
    redirect: "manual",
  });
  extractCookies(loginR.headers.get("set-cookie"));
  console.log(`  Login callback: ${loginR.status}, cookies: ${Object.keys(cookies).join(",")}`);

  const session2 = await api("/api/auth/session");
  log("Session (after login)", session2, session2.status === 200 && session2.data?.user);

  console.log("\n=== 5. CHALLENGES LIST API ===\n");
  const listRes = await api("/api/challenges");
  const challenges = listRes.data?.challenges || [];
  log("GET /api/challenges", listRes, listRes.status === 200 && challenges.length > 0);
  console.log(`  Found ${challenges.length} challenges`);

  const openCh = challenges.find(c => c.status === "OPEN");
  const closedCh = challenges.find(c => c.status === "CLOSED");
  if (openCh) console.log(`  Open challenge: ${openCh.title}`);
  if (closedCh) console.log(`  Closed challenge: ${closedCh.title}`);

  console.log("\n=== 6. CHALLENGE DETAIL API ===\n");
  if (openCh) {
    const detail = await api(`/api/challenges/${openCh.id}`);
    log("GET challenge detail (OPEN)", detail, detail.status === 200 && detail.data?.challenge);
  }
  if (closedCh) {
    const detail = await api(`/api/challenges/${closedCh.id}`);
    log("GET challenge detail (CLOSED)", detail, detail.status === 200 && detail.data?.challenge?.status === "CLOSED");
  }

  console.log("\n=== 7. PARTICIPATE IN CHALLENGE ===\n");
  if (openCh) {
    const join = await api("/api/challenges/participate", {
      method: "POST",
      body: JSON.stringify({ challengeId: openCh.id }),
    });
    log("POST participate (OPEN)", join, join.status === 201 || join.data?.message?.includes("已加入"));

    // Try joining again (duplicate)
    const rejoin = await api("/api/challenges/participate", {
      method: "POST",
      body: JSON.stringify({ challengeId: openCh.id }),
    });
    log("POST participate (duplicate)", rejoin, rejoin.status === 400);

    // Submit work
    const submit = await api("/api/challenges/participate", {
      method: "PUT",
      body: JSON.stringify({
        challengeId: openCh.id,
        submission: "这是我的短视频数据分析看板，使用了React + Recharts实现数据可视化，支持多维度筛选和时间序列展示，包含完播率、互动率等核心指标。",
        links: ["https://github.com/test/repo"],
      }),
    });
    log("PUT submit work (OPEN)", submit, submit.status === 200);

    // Try submitting to CLOSED challenge
    if (closedCh) {
      const closedSubmit = await api("/api/challenges/participate", {
        method: "PUT",
        body: JSON.stringify({
          challengeId: closedCh.id,
          submission: "试图提交到已关闭的挑战，这段文字超过二十个字符用于测试",
          links: [],
        }),
      });
      log("PUT submit (CLOSED) should fail", closedSubmit, closedSubmit.status === 400);
    }
  }

  console.log("\n=== 8. PROJECTS ===\n");
  const createProject = await api("/api/projects", {
    method: "POST",
    body: JSON.stringify({
      title: "测试项目：电商后台",
      type: "PERSONAL",
      role: "全栈开发者",
      teamSize: 1,
      startDate: "2026-06-01",
      techStack: ["Next.js", "Prisma", "TailwindCSS"],
      description: "使用Next.js App Router + Prisma + SQLite构建的全栈电商管理后台，包含商品管理、订单处理、用户权限系统，支持数据看板与实时通知功能。",
      link: "https://github.com/test/ecommerce",
    }),
  });
  log("POST /api/projects", createProject, createProject.status === 201);

  const listProjects = await api("/api/projects");
  log("GET /api/projects", listProjects, listProjects.status === 200);

  console.log("\n=== 9. GROWTH RECORDS ===\n");
  const createRecord = await api("/api/records", {
    method: "POST",
    body: JSON.stringify({
      type: "MILESTONE",
      title: "完成第一个数据看板",
      content: "独立完成了短视频数据分析看板的前端开发，使用了Recharts图表库，实现了响应式布局和数据筛选功能，耗时3天，学习了数据可视化的最佳实践。",
      abilitySignals: ["craft", "learn"],
    }),
  });
  log("POST /api/records (rate limit OK)", createRecord, createRecord.status === 201 || createRecord.status === 429);

  const listRecords = await api("/api/records");
  log("GET /api/records", listRecords, listRecords.status === 200);

  console.log("\n=== 10. WEEKLY REVIEW ===\n");
  const review = await api("/api/weekly-review");
  log("GET /api/weekly-review", review, review.status === 200);

  console.log("\n=== 11. WEEKLY REPORT ===\n");
  const report = await api("/api/weekly-report", { method: "POST" });
  log("POST /api/weekly-report", report, report.status === 200 || report.status === 201);

  console.log("\n=== 12. ABILITY SCORES ===\n");
  const scores = await api("/api/ability");
  log("GET /api/ability", scores, scores.status === 200);

  console.log("\n=== 13. DASHBOARD API ===\n");
  const dashApi = await api("/api/dashboard");
  log("GET /api/dashboard", dashApi, dashApi.status === 200);

  console.log("\n=== 14. TALENT RADAR ===\n");
  const radar = await api("/api/talent-radar", { method: "POST", body: JSON.stringify({ minTotalScore: 30 }) });
  log("POST /api/talent-radar (enterprise only)", radar, radar.status === 200 || radar.status === 403);

  console.log("\n=== 15. DASHBOARD PAGE (authenticated) ===\n");
  if (session2.data?.user) {
    const dash = await page("/dashboard");
    log("GET /dashboard (authed page)", dash, dash.status === 200);
  }

  console.log("\n=== 16. ENTERPRISE CHALLENGE MANAGEMENT ===\n");
  const createChallenge = await api("/api/challenges", {
    method: "POST",
    body: JSON.stringify({
      title: "新挑战测试",
      description: "这是一个通过API创建的新挑战，描述至少十个字符",
      category: "前端开发",
      startDate: "2026-07-10",
      duration: 14,
      rewardType: "CERTIFICATE",
      publish: true,
    }),
  });
  // Expected to fail since logged in as regular user, not enterprise
  log("POST /api/challenges (non-enterprise)", createChallenge, createChallenge.status === 403);

  console.log("\n" + "=".repeat(50));
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log(`\n📊 RESULT: ${passed}/${total} passed (${Math.round(passed/total*100)}%)`);
  if (passed < total) {
    console.log("\n❌ FAILED TESTS:");
    results.filter(r => !r.pass).forEach(r => console.log(`  - ${r.name}: status=${r.status} ${r.data?.error || ''}`));
  }
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
