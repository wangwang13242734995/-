"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

const INDUSTRIES = ["互联网/科技", "金融", "教育", "电商/零售", "游戏", "医疗健康", "制造业", "媒体/广告", "企业服务", "AI/大数据", "其他"];
const SIZES = ["1-50人", "50-200人", "200-1000人", "1000-5000人", "5000人以上"];

export default function EnterpriseRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    adminName: "",
    email: "",
    password: "",
    contactPosition: "",
    companyName: "",
    creditCode: "",
    industry: "",
    companySize: "",
    description: "",
    website: "",
    address: "",
    recruitingNeeds: "",
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const validateStep1 = () => {
    if (!form.adminName || form.adminName.length < 2) return "请填写联系人姓名";
    if (!form.email) return "请填写管理邮箱";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "邮箱格式不正确";
    if (!form.password || form.password.length < 6) return "密码至少 6 位";
    return null;
  };
  const validateStep2 = () => {
    if (!form.companyName || form.companyName.length < 2) return "请填写企业名称";
    if (!/^[0-9A-HJ-NPQRTUWXY]{18}$/.test(form.creditCode.toUpperCase())) return "统一社会信用代码格式不正确（18 位数字/大写字母）";
    if (!form.industry) return "请选择所属行业";
    if (!form.companySize) return "请选择公司规模";
    if (!form.description || form.description.length < 20) return "企业简介至少 20 个字符";
    return null;
  };

  const handleNext = () => {
    const err = step === 1 ? validateStep1() : validateStep2();
    if (err) { setError(err); return; }
    setError("");
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/enterprise/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "注册失败"); setLoading(false); return; }

      setSuccess(true);
      const login = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (!login?.error) {
        setTimeout(() => router.push("/enterprise/dashboard"), 600);
      }
    } catch {
      setError("注册失败，请稍后重试");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb] px-4">
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-[#0c4243]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-[#292827] mb-2" style={{ fontSize: 24, fontWeight: 460 }}>企业注册成功</h1>
          <p className="text-[#666666] mb-6 leading-relaxed">账号已创建，正在跳转企业面板…<br/>认证审核通过后即可发布挑战赛、搜索人才。</p>
          <Link href="/enterprise/dashboard" className="btn-primary">进入企业面板</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f0eb] px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 bg-[#421d24] text-white rounded-full" style={{ fontWeight: 540 }}>企业入驻</span>
          </div>
          <h1 className="text-[#292827]" style={{ fontSize: 28, fontWeight: 460 }}>注册企业账号</h1>
          <p className="text-[#666666] mt-2">发布实战挑战赛，发现真正有能力的候选人</p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6 text-xs">
          {["管理员账号", "企业信息", "招聘需求"].map((label, i) => {
            const n = i + 1;
            const active = n === step, done = n < step;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? "bg-[#0c4243] text-white" : active ? "bg-[#421d24] text-white" : "bg-[#e3e3e2] text-[#666666]"}`}>
                  {done ? "✓" : n}
                </div>
                <span className={active || done ? "text-[#292827]" : "text-[#666666]"} style={{ fontWeight: active ? 540 : 400 }}>{label}</span>
                {n < 3 && <div className={`w-6 h-px ${done ? "bg-[#0c4243]" : "bg-[#e3e3e2]"}`} />}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#421d24]/10 border border-[#421d24]/20 text-[#421d24] rounded-xl text-sm">{error}</div>
        )}

        {step === 1 && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827]" style={{ fontWeight: 540 }}>管理员账号</h2>
            <p className="text-xs text-[#666666] -mt-2">用于登录企业后台，非求职者账号</p>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>联系人姓名 *</label>
              <input type="text" value={form.adminName} onChange={(e) => update("adminName", e.target.value)} className="input-field" placeholder="如：张伟" />
            </div>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>职位</label>
              <input type="text" value={form.contactPosition} onChange={(e) => update("contactPosition", e.target.value)} className="input-field" placeholder="如：HR总监 / 技术负责人" />
            </div>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>管理邮箱 *</label>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="input-field" placeholder="your@company.com" />
            </div>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>登录密码 *</label>
              <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} className="input-field" placeholder="至少 6 位" />
            </div>
            <button onClick={handleNext} className="btn-primary w-full">下一步：企业信息</button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827]" style={{ fontWeight: 540 }}>企业信息</h2>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>企业名称 *</label>
              <input type="text" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} className="input-field" placeholder="与营业执照一致的全称" />
            </div>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>统一社会信用代码 *</label>
              <input type="text" value={form.creditCode} onChange={(e) => update("creditCode", e.target.value.toUpperCase())} className="input-field font-mono" placeholder="18 位，如 91110000MA01XXXX0A" maxLength={18} />
              <p className="text-xs text-[#666666] mt-1">营业执照上的 18 位代码，用于资质核验，不对外公开</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>所属行业 *</label>
                <select value={form.industry} onChange={(e) => update("industry", e.target.value)} className="input-field">
                  <option value="">请选择</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>公司规模 *</label>
                <select value={form.companySize} onChange={(e) => update("companySize", e.target.value)} className="input-field">
                  <option value="">请选择</option>
                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>企业简介 *</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} className="input-field min-h-[100px]" placeholder="核心业务、技术方向、团队文化（至少 20 字）" />
            </div>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>公司官网</label>
              <input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} className="input-field" placeholder="https://" />
            </div>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>公司地址</label>
              <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} className="input-field" placeholder="城市 + 区（选填）" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setError(""); setStep(1); }} className="btn-secondary flex-1">上一步</button>
              <button onClick={handleNext} className="btn-primary flex-1">下一步：招聘需求</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827]" style={{ fontWeight: 540 }}>招聘需求（选填）</h2>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>期望的人才方向</label>
              <textarea value={form.recruitingNeeds} onChange={(e) => update("recruitingNeeds", e.target.value)} className="input-field min-h-[90px]" placeholder="例如：前端方向，熟悉 React，有数据可视化项目经验，自驱力强…" />
            </div>
            <div className="bg-[#f2f0eb] rounded-xl p-4 text-xs text-[#666666] space-y-1">
              <p style={{ fontWeight: 540 }}>确认注册信息：</p>
              <p>• 企业：{form.companyName}（{form.industry} · {form.companySize}）</p>
              <p>• 管理员：{form.adminName} {form.contactPosition && `(${form.contactPosition})`} · {form.email}</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setError(""); setStep(2); }} className="btn-secondary flex-1">上一步</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? "注册中..." : "创建企业账号"}</button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-[#666666] mt-6">
          已有账号？{" "}
          <Link href="/auth/login" className="text-[#714cb6] hover:underline">登录</Link>
          {" · "}
          <Link href="/auth/register" className="text-[#714cb6] hover:underline">我是求职者</Link>
        </p>
      </div>
    </div>
  );
}
