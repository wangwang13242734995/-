"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string | null;
  skills: string[];
  major: string | null;
  graduationYear: number | null;
  avatar: string | null;
  createdAt?: string;
}

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    skills: [] as string[],
    major: "",
    graduationYear: "" as string | number,
    avatar: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth/login"); return; }
    if (status === "authenticated") {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          const user = data.user;
          setProfile(user);
          setForm({
            name: user.name || "",
            bio: user.bio || "",
            skills: user.skills || [],
            major: user.major || "",
            graduationYear: user.graduationYear || "",
            avatar: user.avatar || "",
          });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const update = (field: string, value: string | string[] | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s) && form.skills.length < 50) {
      update("skills", [...form.skills, s]);
      setSkillInput("");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        bio: form.bio,
        skills: form.skills,
        major: form.major,
        avatar: form.avatar,
      };
      if (form.graduationYear) payload.graduationYear = Number(form.graduationYear);

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setSaving(false); return; }
      setSuccess("个人资料已更新");
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwdSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pwdForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setPwdSaving(false); return; }
      setSuccess("密码已修改");
      setPwdForm({ currentPassword: "", newPassword: "" });
    } catch {
      setError("修改失败");
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb]">
        <div className="text-[#666666]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f0eb] flex flex-col">
      <Header />
      <main className="flex-1 max-w-[700px] mx-auto w-full px-6 py-10 space-y-6">
        <div>
          <h1 className="text-[#292827]" style={{ fontSize: 26, fontWeight: 460, lineHeight: 1.3 }}>个人设置</h1>
          <p className="text-sm text-[#666666] mt-1">管理你的资料和账户信息</p>
        </div>

        {success && (
          <div className="p-3 rounded-xl bg-[#0c4243]/10 border border-[#0c4243]/20 text-[#0c4243] text-sm">{success}</div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-[#421d24]/10 border border-[#421d24]/20 text-[#421d24] text-sm">{error}</div>
        )}

        {/* Profile Section */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
          <h2 className="text-[#292827]" style={{ fontWeight: 540 }}>基本信息</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#292827] block mb-1" style={{ fontWeight: 540 }}>昵称</label>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} className="input-field" placeholder="你的昵称" maxLength={30} />
            </div>
            <div>
              <label className="text-sm text-[#292827] block mb-1" style={{ fontWeight: 540 }}>邮箱</label>
              <input value={profile?.email || ""} disabled className="input-field opacity-60" />
            </div>
          </div>

          <div>
            <label className="text-sm text-[#292827] block mb-1" style={{ fontWeight: 540 }}>个人简介</label>
            <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} className="input-field min-h-[80px]" placeholder="简单介绍一下自己..." maxLength={500} />
            <p className="text-xs text-[#666666] mt-1">{form.bio.length} / 500</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#292827] block mb-1">专业方向</label>
              <input value={form.major} onChange={(e) => update("major", e.target.value)} className="input-field" placeholder="如：计算机科学" maxLength={100} />
            </div>
            <div>
              <label className="text-sm text-[#292827] block mb-1">预计入职年份</label>
              <select value={form.graduationYear} onChange={(e) => update("graduationYear", e.target.value)} className="input-field">
                <option value="">不填写</option>
                {Array.from({ length: 10 }, (_, i) => 2025 + i).map((y) => (
                  <option key={y} value={y}>{y} 年</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#292827] block mb-1">头像链接（可选）</label>
            <input type="url" value={form.avatar} onChange={(e) => update("avatar", e.target.value)} className="input-field" placeholder="https://..." />
          </div>
        </div>

        {/* Skills Section */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
          <h2 className="text-[#292827] mb-3" style={{ fontWeight: 540 }}>技能标签</h2>
          <div className="flex gap-2 mb-3">
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              className="input-field" placeholder="输入技能后按回车添加" />
            <button type="button" onClick={addSkill} className="btn-secondary whitespace-nowrap">添加</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.skills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-[#f2f0eb] rounded-full text-sm border border-[#e3e3e2]">
                {s}
                <button onClick={() => update("skills", form.skills.filter((x) => x !== s))} className="text-[#421d24] hover:text-red-600 ml-1">×</button>
              </span>
            ))}
            {form.skills.length === 0 && (
              <p className="text-sm text-[#666666]">还没有添加技能标签</p>
            )}
          </div>
        </div>

        {/* Save Profile */}
        <div>
          <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary">
            {saving ? "保存中..." : "保存资料"}
          </button>
        </div>

        {/* Password Section */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
          <h2 className="text-[#292827]" style={{ fontWeight: 540 }}>修改密码</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#292827] block mb-1">当前密码</label>
              <input type="password" value={pwdForm.currentPassword} onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
                className="input-field" placeholder="输入当前密码" />
            </div>
            <div>
              <label className="text-sm text-[#292827] block mb-1">新密码</label>
              <input type="password" value={pwdForm.newPassword} onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
                className="input-field" placeholder="至少 6 位" minLength={6} />
            </div>
          </div>
          <button onClick={handleChangePassword} disabled={pwdSaving || !pwdForm.currentPassword || pwdForm.newPassword.length < 6}
            className="btn-secondary">
            {pwdSaving ? "修改中..." : "修改密码"}
          </button>
        </div>

        {/* Account info */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
          <h2 className="text-[#292827] mb-3" style={{ fontWeight: 540 }}>账户信息</h2>
          <div className="text-sm text-[#666666] space-y-1">
            <p>角色：{profile?.role === "ENTERPRISE" ? "企业用户" : "学生"}</p>
            <p>注册时间：{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("zh-CN") : ""}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
