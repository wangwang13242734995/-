// Full test suite: Functional + Security + Load
// Run: node scripts/full-test.js   (server must be up on :3456)
const BASE = process.env.BASE_URL || "http://localhost:3456";

// ---------- HTTP helpers with per-session cookie jar ----------
function makeSession() {
  const jar = {};
  function cookieHeader() {
    return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
  }
  function extract(setCookie) {
    if (!setCookie) return;
    for (const part of setCookie.split(",").map((s) => s.trim())) {
      const kv = part.split(";")[0].trim();
      const eq = kv.indexOf("=");
      if (eq > 0) jar[kv.slice(0, eq)] = kv.slice(eq + 1);
    }
  }
  async function api(path, opts = {}) {
    const headers = { "Content-Type": "application/json", ...opts.headers };
    const ch = cookieHeader();
    if (ch) headers["Cookie"] = ch;
    const r = await fetch(BASE + path, { ...opts, headers, redirect: "manual" });
    extract(r.headers.get("set-cookie"));
    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch { data = text ? text.slice(0, 200) : null; }
    return { status: r.status, data, location: r.headers.get("location"), raw: text };
  }
  async function page(path) {
    const headers = {};
    const ch = cookieHeader();
    if (ch) headers["Cookie"] = ch;
    const r = await fetch(BASE + path, { headers, redirect: "manual" });
    extract(r.headers.get("set-cookie"));
    return { status: r.status, location: r.headers.get("location") };
  }
  async function login(email, password) {
    const csrf = await api("/api/auth/csrf");
    const token = csrf.data?.csrfToken;
    const form = new URLSearchParams({ csrfToken: token, email, password, json: "true" });
    const r = await fetch(BASE + "/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookieHeader() },
      body: form.toString(), redirect: "manual",
    });
    extract(r.headers.get("set-cookie"));
    const sess = await api("/api/auth/session");
    return { ok: !!sess.data?.user, session: sess.data };
  }
  return { api, page, login, jar };
}

// ---------- reporting ----------
const results = [];
function check(cat, name, cond, detail = "") {
  results.push({ cat, name, pass: !!cond, detail });
  console.log(`${cond ? "✅" : "❌"} [${cat}] ${name}${detail ? "  → " + detail : ""}`);
}

async function freshStudentSession(tag) {
  const s = makeSession();
  const email = `${tag}${Date.now()}@test.com`;
  const reg = await s.api("/api/auth/register", {
    method: "POST", body: JSON.stringify({ name: tag, email, password: "123456" }),
  });
  if (reg.status !== 201) return { s, email, regOk: false };
  const loginRes = await s.login(email, "123456");
  return { s, email, regOk: true, loggedIn: loginRes.ok };
}

async function funcTests() {
  console.log("\n========== 功能测试 (FUNCTIONAL) ==========");
  const anon = makeSession();

  // public pages
  for (const p of ["/", "/challenges", "/auth/login", "/auth/register", "/enterprise/register"]) {
    const r = await anon.page(p);
    check("功能", `公开页 ${p}`, r.status === 200, `status=${r.status}`);
  }
  // protected pages redirect when anon
  for (const p of ["/dashboard", "/projects", "/records", "/enterprise/dashboard"]) {
    const r = await anon.page(p);
    check("功能", `受保护页 ${p} 需登录`, r.status === 307 || r.status === 302, `status=${r.status}`);
  }
  // challenge list
  const list = await anon.api("/api/challenges");
  check("功能", "挑战列表 API", list.status === 200 && (list.data?.challenges || []).length > 0, `${(list.data?.challenges||[]).length} 条`);
  const openCh = (list.data?.challenges || []).find((c) => c.status === "OPEN");

  // student flow: register + login + participate + record
  const { s, loggedIn } = await freshStudentSession("stu");
  check("功能", "学生注册+登录", loggedIn);

  if (openCh) {
    const join = await s.api("/api/challenges/participate", { method: "POST", body: JSON.stringify({ challengeId: openCh.id }) });
    check("功能", "参与开放挑战", join.status === 201 || (join.data?.message || "").includes("已加入"), `status=${join.status}`);
    const submit = await s.api("/api/challenges/participate", {
      method: "PUT", body: JSON.stringify({ challengeId: openCh.id, submission: "这是一个满足最小长度要求的完整作品提交说明文本内容。", links: ["https://github.com/x/y"] }),
    });
    check("功能", "提交挑战作品", submit.status === 200, `status=${submit.status}`);
  }

  const proj = await s.api("/api/projects", {
    method: "POST", body: JSON.stringify({ title: "全栈后台", type: "PERSONAL", role: "全栈", teamSize: 1, startDate: "2026-06-01", techStack: ["Next.js"], description: "使用Next.js App Router与Prisma构建的全栈电商管理后台，包含商品管理、订单处理、用户权限与数据看板模块，前后端一体部署可运行。" }),
  });
  check("功能", "创建项目", proj.status === 201 || proj.status === 429, `status=${proj.status} ${proj.data?.error || ""}`);

  const rec = await s.api("/api/records", {
    method: "POST", body: JSON.stringify({ type: "MILESTONE", title: "完成看板", content: "独立完成了短视频数据分析看板的前端开发，使用Recharts图表库实现响应式布局和多维度筛选，历时三天系统学习了数据可视化的最佳实践。", abilitySignals: ["craft", "learn"] }),
  });
  check("功能", "创建成长记录", rec.status === 201 || rec.status === 429, `status=${rec.status} ${rec.data?.error || ""}`);

  for (const [name, path] of [["能力分", "/api/ability"], ["仪表盘", "/api/dashboard"], ["周复盘", "/api/weekly-review"]]) {
    const r = await s.api(path);
    check("功能", `GET ${name}`, r.status === 200, `status=${r.status}`);
  }

  // enterprise: login seeded enterprise account, hit new dashboard API + talents + register validation
  const ent = makeSession();
  const entLogin = await ent.login("enterprise@test.com", "password123");
  check("功能", "企业账号登录", entLogin.ok);

  const dash = await ent.api("/api/enterprise/dashboard");
  check("功能", "企业Dashboard聚合API", dash.status === 200 && dash.data?.dashboard?.stats, JSON.stringify(dash.data?.dashboard?.stats || {}).slice(0, 120));

  const talents = await ent.api("/api/talents?minScore=0&sortBy=totalScore");
  check("功能", "企业人才搜索API", talents.status === 200 && Array.isArray(talents.data?.students), `${(talents.data?.students||[]).length} 人`);

  // enterprise register requires auth: student should be able to submit (201) but dup guard
  const entReg = await s.api("/api/enterprise", {
    method: "POST", body: JSON.stringify({ companyName: "测试公司X", industry: "互联网/科技", companySize: "1-50人", description: "这是一家用于测试的公司的简介需要超过二十个字符长度要求", contactPerson: "张三", contactEmail: "z@x.com" }),
  });
  check("功能", "学生提交企业认证(带详细字段)", entReg.status === 201, `status=${entReg.status} ${entReg.data?.error || ""}`);
}

async function secTests() {
  console.log("\n========== 安全测试 (SECURITY) ==========");
  const anon = makeSession();

  // 1. unauthenticated access to protected APIs
  for (const [name, path] of [["成长记录", "/api/records"], ["项目", "/api/projects"], ["能力分", "/api/ability"], ["企业面板", "/api/enterprise/dashboard"]]) {
    const r = await anon.api(path);
    check("安全", `未授权访问 ${name} 被拒`, r.status === 401 || r.status === 403 || r.status === 307, `status=${r.status}`);
  }

  // 2. student accessing enterprise-only resources
  const { s } = await freshStudentSession("sec");
  const entOnly = await s.api("/api/enterprise/dashboard");
  check("安全", "学生访问企业面板→403/404", entOnly.status === 403 || entOnly.status === 404, `status=${entOnly.status}`);
  const entTalents = await s.api("/api/talents");
  check("安全", "未认证企业访问人才库→403", entTalents.status === 403 || entTalents.status === 401, `status=${entTalents.status}`);

  // 3. SQL injection attempts (Prisma parameterizes -> must not error 500 or leak all)
  const inj = await s.api("/api/talents?category=" + encodeURIComponent("Robert'; DROP TABLE User;--"));
  check("安全", "SQL注入(人才搜索)不报500", inj.status !== 500, `status=${inj.status}`);
  const stillAlive = await anon.api("/api/challenges");
  check("安全", "注入后数据表仍完整", stillAlive.status === 200 && Array.isArray(stillAlive.data?.challenges));

  // 4. XSS payload stored literally (server should not crash; client escapes)
  const xss = await s.api("/api/records", {
    method: "POST", body: JSON.stringify({ type: "MILESTONE", title: "<script>alert(1)</script>", content: "包含<script>标签与<img onerror=alert(1)>的测试内容，用于验证服务端存储转义策略。", abilitySignals: ["craft"] }),
  });
  check("安全", "XSS载荷不导致500", xss.status === 201 || xss.status === 400 || xss.status === 429, `status=${xss.status}`);

  // 5. tampered JWT cookie
  const tampered = makeSession();
  tampered.jar["next-auth.session-token"] = "invalid.tampered.token.value";
  const sess = await tampered.api("/api/auth/session");
  check("安全", "伪造/篡改会话无效", !sess.data?.user, JSON.stringify(sess.data));

  // 6. wrong password login
  const badLogin = makeSession();
  const res = await badLogin.login("enterprise@test.com", "wrongpass");
  check("安全", "错误密码登录失败", !res.ok);

  // 7. duplicate email
  const dup = await anon.api("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "dup", email: "enterprise@test.com", password: "123456" }) });
  check("安全", "重复邮箱注册被拒", dup.status === 400 || dup.status === 409, `status=${dup.status}`);

  // 8. validation: short password / bad email
  const weak = await anon.api("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "a", email: "not-an-email", password: "1" }) });
  check("安全", "非法注册参数被校验拒绝", weak.status === 400, `status=${weak.status}`);

  // 9. oversized payload
  const big = await s.api("/api/records", { method: "POST", body: JSON.stringify({ type: "MILESTONE", title: "t", content: "x".repeat(2000000), abilitySignals: [] }) });
  check("安全", "超大请求体不导致500崩溃", big.status === 200 || big.status === 400 || big.status === 413 || big.status === 429 || big.status === 502 || big.status !== 500, `status=${big.status}`);
}

async function loadTests() {
  console.log("\n========== 压力测试 (LOAD) ==========");
  const anon = makeSession();

  async function bench(name, path, concurrency, total) {
    const latencies = [];
    let ok = 0, fail = 0;
    let done = 0;
    const queue = Array.from({ length: total }, () => path);
    const workers = Array.from({ length: concurrency }, async () => {
      while (done < queue.length) {
        const idx = done++;
        const t0 = Date.now();
        try {
          const r = await anon.api(queue[idx]);
          if (r.status >= 200 && r.status < 400) ok++; else fail++;
        } catch { fail++; }
        latencies.push(Date.now() - t0);
      }
    });
    const start = Date.now();
    await Promise.all(workers);
    const dur = Date.now() - start;
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const rps = (total / (dur / 1000)).toFixed(1);
    const errRate = ((fail / total) * 100).toFixed(1);
    console.log(`   ${name}: ${total}req @${concurrency}并发 → p50=${p50}ms p95=${p95}ms RPS=${rps} 错误率=${errRate}%`);
    check("压力", `${name} 错误率<5%`, parseFloat(errRate) < 5, `错误率=${errRate}%`);
    check("压力", `${name} p95<3000ms`, p95 < 3000, `p95=${p95}ms`);
  }

  await bench("挑战列表 GET", "/api/challenges", 20, 200);
  await bench("公开首页 GET", "/challenges", 20, 100);

  // write pressure: concurrent record creation hits rate limiter — expect graceful 429 not 5xx
  const { s } = await freshStudentSession("load");
  const t0 = Date.now();
  const writes = await Promise.all(
    Array.from({ length: 30 }, () =>
      s.api("/api/records", { method: "POST", body: JSON.stringify({ type: "MILESTONE", title: "压测", content: "并发写入压力测试记录内容，长度满足要求用于验证限流器的处理行为。", abilitySignals: ["craft"] }) })
    )
  );
  const dur = Date.now() - t0;
  const fiveXx = writes.filter((w) => w.status >= 500).length;
  const limited = writes.filter((w) => w.status === 429).length;
  console.log(`   并发写30: 耗时=${dur}ms 5xx=${fiveXx} 429限流=${limited}`);
  check("压力", "并发写无5xx崩溃", fiveXx === 0, `5xx=${fiveXx}`);
  check("压力", "限流器优雅处理(429)或成功", limited > 0 || writes.every((w) => w.status < 500), `429=${limited}`);
}

async function main() {
  console.log(`目标: ${BASE}`);
  await funcTests();
  await secTests();
  await loadTests();

  console.log("\n" + "=".repeat(56));
  const byCat = {};
  results.forEach((r) => { (byCat[r.cat] ||= { p: 0, f: 0 }); r.pass ? byCat[r.cat].p++ : byCat[r.cat].f++; });
  Object.entries(byCat).forEach(([c, v]) => console.log(`  ${c}: ${v.p}/${v.p + v.f} 通过`));
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n📊 总计: ${passed}/${results.length} 通过 (${Math.round((passed / results.length) * 100)}%)`);
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.log("\n❌ 失败项:");
    failed.forEach((r) => console.log(`  - [${r.cat}] ${r.name}  ${r.detail}`));
    process.exit(1);
  } else {
    console.log("\n🎉 全部通过！");
  }
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
