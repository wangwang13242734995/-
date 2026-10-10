/* Admin review closed-loop test. Run server on :3456 first. */
const BASE = process.env.BASE || "http://localhost:3456";

class Session {
  constructor() { this.cookies = {}; }
  store(res) {
    const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const c of sc) {
      const [kv] = c.split(";");
      const i = kv.indexOf("=");
      this.cookies[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
    }
  }
  header() {
    return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join("; ");
  }
  async req(method, path, { json, form, headers } = {}) {
    const h = { Cookie: this.header(), ...(headers || {}) };
    let body;
    if (json !== undefined) { h["Content-Type"] = "application/json"; body = JSON.stringify(json); }
    if (form !== undefined) { h["Content-Type"] = "application/x-www-form-urlencoded"; body = form; }
    const res = await fetch(BASE + path, { method, headers: h, body, redirect: "manual" });
    this.store(res);
    return res;
  }
  async login(email, password) {
    const csrfRes = await this.req("GET", "/api/auth/csrf");
    const { csrfToken } = await csrfRes.json();
    const form = new URLSearchParams({ csrfToken, email, password, json: "true" }).toString();
    const res = await this.req("POST", "/api/auth/callback/credentials", { form });
    const me = await this.req("GET", "/api/auth/session");
    const session = await me.json();
    return session?.user?.email === email ? session.user : null;
  }
}

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log("  PASS", name); }
  else { fail++; console.log("  FAIL", name, extra); }
}

const uniq = Date.now().toString(36);
const VALID_CODE = "9131000MA1FL" + String(Date.now()).slice(-6); // 18 chars, allowed set only

async function main() {
  // 1) register a fresh enterprise (status PENDING)
  const reg = await fetch(BASE + "/api/enterprise/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      adminName: "测试管理员", email: `ent_${uniq}@test.com`, password: "password123",
      companyName: "闭环测试科技有限公司", creditCode: VALID_CODE,
      industry: "信息技术", companySize: "50-99人",
      description: "这是一家用于验证管理员审核闭环流程的测试企业，主营数据智能与可视化产品研发业务。",
    }),
  });
  check("企业注册返回 201", reg.status === 201, "got " + reg.status + " " + await reg.text().catch(() => ""));

  // 2) non-admin blocked
  const ent = new Session();
  const entUser = await ent.login(`ent_${uniq}@test.com`, "password123");
  check("企业账号可登录", !!entUser);
  const forbidden = await ent.req("GET", "/api/admin/overview");
  check("非管理员访问 overview 被拒(403)", forbidden.status === 403, "got " + forbidden.status);

  // 3) admin login
  const admin = new Session();
  const adminUser = await admin.login("admin@test.com", "admin123456");
  check("管理员登录成功且 role=ADMIN", adminUser?.role === "ADMIN", JSON.stringify(adminUser));

  // 4) overview contains pending enterprise
  const ov1 = await admin.req("GET", "/api/admin/overview");
  const d1 = await ov1.json();
  check("overview 返回 200", ov1.status === 200);
  const target = d1.pendingStatus.find((e) => e.creditCode === VALID_CODE);
  check("待基础认证列表含新企业", !!target, JSON.stringify(d1.counts));

  // 5) approve status
  if (target) {
    const ap = await admin.req("POST", `/api/admin/enterprises/${target.id}/review`, { json: { action: "approve", scope: "status" } });
    const apd = await ap.json();
    check("通过基础认证→status=APPROVED", ap.ok && apd.enterprise?.status === "APPROVED", JSON.stringify(apd));

    // 6) enterprise requests deep verify
    const vf = await ent.req("POST", "/api/enterprise/verify", { json: { legalPerson: "张三" } });
    check("企业申请深度认证→PENDING_DEEP", vf.ok, "got " + vf.status + " " + await vf.text().catch(() => ""));

    // 7) admin sees pendingDeep and approves deep
    const ov2 = await admin.req("GET", "/api/admin/overview");
    const d2 = await ov2.json();
    const deepTarget = d2.pendingDeep.find((e) => e.id === target.id);
    check("待深度核验列表含该企业", !!deepTarget, JSON.stringify(d2.counts));
    if (deepTarget) {
      const dp = await admin.req("POST", `/api/admin/enterprises/${target.id}/review`, { json: { action: "approve", scope: "deep" } });
      const dpd = await dp.json();
      check("通过深度核验→verificationLevel=DEEP", dp.ok && dpd.enterprise?.verificationLevel === "DEEP", JSON.stringify(dpd));
    }
  }

  // 8) reject requires reason
  const badReject = await admin.req("POST", "/api/admin/enterprises/nonexistent/review", { json: { action: "reject", scope: "status" } });
  check("不存在的企业受益于鉴权/校验(非500)", badReject.status !== 500, "got " + badReject.status);

  console.log(`\n==== Admin test: ${pass} passed, ${fail} failed ====`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
