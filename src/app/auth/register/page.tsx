"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    major: "",
    availableYear: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          availableYear: form.availableYear
            ? parseInt(form.availableYear)
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "注册失败");
        return;
      }

      router.push("/auth/login?registered=true");
    } catch {
      setError("注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[#292827]" style={{ fontSize: 30, fontWeight: 460 }}>加入履程</h1>
          <p className="text-[#666666] mt-2">开始记录你的每一步成长</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#421d24]/10 border border-[#421d24]/20 text-[#421d24] rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>
              昵称 *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="input-field"
              placeholder="你的昵称"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>
              邮箱 *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>
              密码 *
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="input-field"
              placeholder="至少 6 位"
              required
              minLength={6}
            />
          </div>

          <div className="border-t border-[#e3e3e2] pt-4">
            <p className="text-sm text-[#666666] mb-3">以下信息选填，用于生成能力名片</p>
          </div>

          <div>
            <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>
              一句话介绍自己
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              className="input-field resize-none"
              placeholder="例：自学前端2年，专注数据可视化方向"
              rows={2}
              maxLength={100}
            />
            <p className="text-xs text-[#666666] mt-1">{form.bio.length}/100</p>
          </div>

          <div>
            <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>
              专业方向
            </label>
            <input
              type="text"
              value={form.major}
              onChange={(e) => update("major", e.target.value)}
              className="input-field"
              placeholder="如：前端开发、产品设计、数据分析"
            />
          </div>

          <div>
            <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>
              预计可入职年份
            </label>
            <select
              value={form.availableYear}
              onChange={(e) => update("availableYear", e.target.value)}
              className="input-field"
            >
              <option value="">请选择</option>
              {[2026, 2027, 2028, 2029, 2030].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "注册中..." : "注册"}
          </button>

          <p className="text-center text-sm text-[#666666]">
            已有账号？{" "}
            <Link href="/auth/login" className="text-[#714cb6] hover:underline">
              立即登录
            </Link>
          </p>

          <div className="border-t border-[#e3e3e2] pt-3 text-center">
            <Link href="/enterprise/register" className="text-sm text-[#421d24] hover:underline" style={{ fontWeight: 460 }}>
              我是企业，前往企业入驻 →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
