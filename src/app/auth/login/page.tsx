"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[#292827]" style={{ fontSize: 30, fontWeight: 460 }}>履程</h1>
          <p className="text-[#666666] mt-2">登录你的成长档案</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#421d24]/10 border border-[#421d24]/20 text-[#421d24] rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#292827] mb-1" style={{ fontWeight: 540 }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="至少 6 位"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "登录中..." : "登录"}
          </button>

          <p className="text-center text-sm text-[#666666]">
            还没有账号？{" "}
            <Link href="/auth/register" className="text-[#714cb6] hover:underline">
              立即注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
