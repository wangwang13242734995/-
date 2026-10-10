"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INDUSTRIES = ["互联网/科技", "金融", "教育", "电商/零售", "游戏", "医疗健康", "制造业", "媒体/广告", "企业服务", "AI/大数据", "其他"];
const SIZES = ["1-50人", "50-200人", "200-1000人", "1000-5000人", "5000人以上"];

export default function EnterpriseRegisterPage() {
  const { status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    companySize: "",
    description: "",
    website: "",
    contactPerson: "",
    contactPosition: "",
    contactEmail: "",
    address: "",
    recruitingNeeds: "",
  });

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb]">
        <div className="text-center">
          <p className="text-[#666666] mb-4">请先登录后再提交企业认证</p>
          <Link href="/auth/login" className="btn-primary">去登录</Link>
        </div>
      </div>
    );
  }

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const validateStep1 = () => {
    if (!form.companyName || form.companyName.length < 2) return "请填写企业名称";
    if (!form.industry) return "请选择所属行业";
    if (!form.companySize) return "请选择公司规模";
    if (!form.description || form.description.length < 20) return "企业简介至少 20 个字符";
    return null;
  };

  const validateStep2 = () => {
    if (!form.contactPerson || form.contactPerson.length < 2) return "请填写联系人姓名";
    if (!form.contactEmail) return "请填写联系邮箱";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) return "邮箱格式不正确";
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
      const res = await fetch("/api/enterprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "提交失败"); setLoading(false); return; }
      setSuccess(true);
    } catch {
      setError("提交失败，请稍后重试");
    } finally {
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
          <h1 className="text-[#292827] mb-2" style={{ fontSize: 24, fontWeight: 460 }}>认证申请已提交</h1>
          <p className="text-[#666666] mb-6 leading-relaxed">我们将在 1-3 个工作日内审核你的企业资质。<br/>审核通过后即可发布挑战赛、搜索人才。</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="btn-secondary">返回主页</Link>
            <Link href="/enterprise/dashboard" className="btn-primary">进入企业面板</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f0eb] px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-[#292827]" style={{ fontSize: 28, fontWeight: 460 }}>企业入驻履程</h1>
          <p className="text-[#666666] mt-2">发布实战挑战赛，发现真正有能力的候选人</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex items-center gap-2 ${s < step ? "opacity-100" : s === step ? "opacity-100" : "opacity-40"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                s < step ? "bg-[#0c4243] text-white" : s === step ? "bg-[#421d24] text-white" : "bg-[#e3e3e2] text-[#666666]"
              }`}>
                {s < step ? "✓" : s}
              </div>
              {s < 3 && <div className={`w-8 h-px ${s < step ? "bg-[#0c4243]" : "bg-[#e3e3e2]"}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#421d24]/10 border border-[#421d24]/20 text-[#421d24] rounded-xl text-sm">{error}</div>
        )}

        {/* Step 1: 公司信息 */}
        {step === 1 && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827] mb-1" style={{ fontWeight: 540 }}>基本信息</h2>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>企业名称 *</label>
              <input type="text" value={form.companyName} onChange={(e) => update("companyName", e.target.value)}
                className="input-field" placeholder="公司全称（与营业执照一致）" />
            </div>
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
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>企业简介 *</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
                className="input-field min-h-[100px]" placeholder="介绍公司核心业务、技术方向、团队文化（至少20字）" />
            </div>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>公司官网</label>
              <input type="url" value={form.website} onChange={(e) => update("website", e.target.value)}
                className="input-field" placeholder="https://" />
            </div>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>公司地址</label>
              <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)}
                className="input-field" placeholder="城市 + 区（选填）" />
            </div>
            <button onClick={handleNext} className="btn-primary w-full">下一步：联系人信息</button>
          </div>
        )}

        {/* Step 2: 联系人 */}
        {step === 2 && (
          <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827] mb-1" style={{ fontWeight: 540 }}>联系人信息</h2>
            <p className="text-xs text-[#666666] mb-2">用于审核联系及平台通知，不会公开展示</p>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>联系人姓名 *</label>
              <input type="text" value={form.contactPerson} onChange={(e) => update("contactPerson", e.target.value)}
                className="input-field" placeholder="姓名" />
            </div>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>职位</label>
              <input type="text" value={form.contactPosition} onChange={(e) => update("contactPosition", e.target.value)}
                className="input-field" placeholder="如：HR总监 / 技术负责人" />
            </div>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>联系邮箱 *</label>
              <input type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)}
                className="input-field" placeholder="your@company.com" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setError(""); setStep(1); }} className="btn-secondary flex-1">上一步</button>
              <button onClick={handleNext} className="btn-primary flex-1">下一步：招聘需求</button>
            </div>
          </div>
        )}

        {/* Step 3: 招聘需求 */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
            <h2 className="text-[#292827] mb-1" style={{ fontWeight: 540 }}>招聘需求（选填）</h2>
            <p className="text-xs text-[#666666] mb-2">描述你希望找到什么样的人才，有助于推荐精准度</p>
            <div>
              <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 460 }}>期望的能力方向</label>
              <textarea value={form.recruitingNeeds} onChange={(e) => update("recruitingNeeds", e.target.value)}
                className="input-field min-h-[100px]" placeholder="例如：需要前端开发方向，熟悉React，有数据可视化项目经验，自驱力强..." />
            </div>
            <div className="bg-[#f2f0eb] rounded-xl p-4 text-sm text-[#666666]">
              <p className="mb-2" style={{ fontWeight: 540 }}>确认提交以下信息：</p>
              <ul className="space-y-1 text-xs">
                <li>• 企业：{form.companyName}（{form.industry}，{form.companySize}）</li>
                <li>• 联系人：{form.contactPerson} {form.contactPosition && `(${form.contactPosition})`}</li>
                <li>• 邮箱：{form.contactEmail}</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setError(""); setStep(2); }} className="btn-secondary flex-1">上一步</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? "提交中..." : "提交认证"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
