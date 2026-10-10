/* Enterprise talent card page runtime test. Server on :3456. */
const BASE = "http://localhost:3456";

class Session {
  constructor() { this.cookies = {}; }
  store(res) {
    const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const c of sc) { const [kv] = c.split(";"); const i = kv.indexOf("="); this.cookies[kv.slice(0, i).trim()] = kv.slice(i + 1).trim(); }
  }
  header() { return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join("; "); }
  async req(method, path, { json, form } = {}) {
    const h = { Cookie: this.header() };
    let body;
    if (json !== undefined) { h["Content-Type"] = "application/json"; body = JSON.stringify(json); }
    if (form !== undefined) { h["Content-Type"] = "application/x-www-form-urlencoded"; body = form; }
    const res = await fetch(BASE + path, { method, headers: h, body, redirect: "manual" });
    this.store(res); return res;
  }
  async login(email, password) {
    const csrf = await (await this.req("GET", "/api/auth/csrf")).json();
    const form = new URLSearchParams({ csrfToken: csrf.csrfToken, email, password, json: "true" }).toString();
    await this.req("POST", "/api/auth/callback/credentials", { form });
    const s = await (await this.req("GET", "/api/auth/session")).json();
    return s?.user?.email === email ? s.user : null;
  }
}

let pass = 0, fail = 0;
const check = (n, c, x = "") => { if (c) { pass++; console.log("  PASS", n); } else { fail++; console.log("  FAIL", n, x); } };

async function main() {
  const uniq = Date.now().toString(36);
  const CODE = "9131000MA1FL" + String(Date.now()).slice(-6);

  // anonymous access should redirect (307) to login
  const anon = new Session();
  const a = await anon.req("GET", "/enterprise/talents/whatever123");
  const loc = a.headers.get("location") || "";
  check("未登录访问名片被重定向", (a.status === 307 || a.status === 302) && loc.includes("/auth/login"), "status=" + a.status + " loc=" + loc);

  // register a fresh enterprise (role=ENTERPRISE, status=PENDING)
  const reg = await fetch(BASE + "/api/enterprise/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      adminName: "名片测试", email: `card_${uniq}@test.com`, password: "password123",
      companyName: "名片测试公司", creditCode: CODE, industry: "信息技术", companySize: "10-49人",
      description: "用于验证企业视角能力名片页面访问权限与渲染的测试企业，主营可视化与数据业务产品。",
    }),
  });
  check("新企业注册 201", reg.status === 201, "status=" + reg.status);

  // login as this enterprise (PENDING) → card should redirect to dashboard (not approved yet)
  const ent = new Session();
  const eu = await ent.login(`card_${uniq}@test.com`, "password123");
  check("企业账号登录且 role=ENTERPRISE", eu?.role === "ENTERPRISE", JSON.stringify(eu));
  const pend = await ent.req("GET", "/enterprise/talents/anyid");
  const pendLoc = pend.headers.get("location") || "";
  check("未认证企业访问名片被挡→dashboard", (pend.status === 307 || pend.status === 302) && pendLoc.includes("/enterprise/dashboard"), "status=" + pend.status + " loc=" + pendLoc);

  // admin approves the enterprise status
  const admin = new Session();
  await admin.login("admin@test.com", "admin123456");
  const ov = await (await admin.req("GET", "/api/admin/overview")).json();
  const target = (ov.pendingStatus || []).find((e) => e.creditCode === CODE);
  check("管理员在待审列表找到该企业", !!target, JSON.stringify(ov.counts || {}));
  if (target) {
    const ap = await admin.req("POST", `/api/admin/enterprises/${target.id}/review`, { json: { action: "approve", scope: "status" } });
    check("管理员通过该企业基础认证", ap.ok, "status=" + ap.status);
  }

  // now the enterprise is APPROVED → can view the talent card
  const listRes = await ent.req("GET", "/api/talents?sortBy=totalScore&minScore=0");
  const list = await listRes.json();
  const students = list.students || [];
  check("已认证企业可获取人才列表", listRes.status === 200 && students.length > 0, "status=" + listRes.status + " n=" + students.length);
  if (students.length > 0) {
    const sid = students[0].id;
    const pageRes = await ent.req("GET", `/enterprise/talents/${sid}`);
    const html = await pageRes.text();
    check("企业查看名片返回 200", pageRes.status === 200, "status=" + pageRes.status + " loc=" + (pageRes.headers.get("location") || ""));
    check("名片含『能力名片』标题", html.includes("能力名片"));
    check("名片含『成长轨迹』区块", html.includes("成长轨迹"));
    check("名片含『30秒速览』统计", html.includes("综合能力") && html.includes("最强维度"));
    check("名片含『代表项目』或雷达", html.includes("代表项目") || html.includes("能力雷达"));
    console.log("   样本学生:", students[0].name, "id=" + sid);
  }

  // admin (role=ADMIN, not ENTERPRISE) should be redirected away from enterprise card
  const anySid = (await (await ent.req("GET", "/api/talents")).json())?.students?.[0]?.id || "x";
  const g = await admin.req("GET", `/enterprise/talents/${anySid}`);
  const gloc = g.headers.get("location") || "";
  check("非企业角色(ADMIN)访问名片被挡", (g.status === 307 || g.status === 302) && gloc.includes("/enterprise/dashboard"), "status=" + g.status + " loc=" + gloc);

  console.log(`\n==== Talent card test: ${pass} passed, ${fail} failed ====`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
