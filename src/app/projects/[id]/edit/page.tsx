"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";

const PROJECT_TYPES = [
  { value: "COURSE", label: "课程作业" },
  { value: "COMPETITION", label: "比赛项目" },
  { value: "INTERNSHIP", label: "实习经历" },
  { value: "PERSONAL", label: "个人项目" },
  { value: "CHALLENGE", label: "挑战赛" },
];

const OUTCOME_TYPES = [
  { value: "NONE", label: "暂不填写" },
  { value: "QUANTIFIED", label: "有量化数据" },
  { value: "AWARD", label: "获得奖项" },
  { value: "LAUNCHED", label: "已上线" },
  { value: "OPEN_SOURCE", label: "已开源" },
];

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: "PERSONAL",
    role: "",
    teamSize: 1,
    startDate: "",
    endDate: "",
    techStack: [] as string[],
    description: "",
    outcome: "",
    outcomeType: "NONE",
    outcomeData: "",
    difficultyEncountered: "",
    solution: "",
    githubLink: "",
    designLink: "",
    videoLink: "",
    liveLink: "",
    status: "PUBLISHED",
  });

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("获取失败");
        return res.json();
      })
      .then((data) => {
        const p = data.project || data;
        setForm({
          title: p.title || "",
          type: p.type || "PERSONAL",
          role: p.role || "",
          teamSize: p.teamSize || 1,
          startDate: p.startDate ? p.startDate.slice(0, 10) : "",
          endDate: p.endDate ? p.endDate.slice(0, 10) : "",
          techStack: typeof p.techStack === "string" ? JSON.parse(p.techStack) : (p.techStack || []),
          description: p.description || "",
          outcome: p.outcome || "",
          outcomeType: p.outcomeType || "NONE",
          outcomeData: p.outcomeData || "",
          difficultyEncountered: p.difficultyEncountered || "",
          solution: p.solution || "",
          githubLink: p.githubLink || "",
          designLink: p.designLink || "",
          videoLink: p.videoLink || "",
          liveLink: p.liveLink || "",
          status: p.status || "PUBLISHED",
        });
        setLoading(false);
      })
      .catch(() => { setError("无法加载项目"); setLoading(false); });
  }, [params.id]);

  const update = (field: string, value: string | number | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addTech = () => {
    const t = techInput.trim();
    if (t && !form.techStack.includes(t)) {
      update("techStack", [...form.techStack, t]);
      setTechInput("");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setSaving(false); return; }
      router.push(`/projects/${params.id}`);
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`, { method: "DELETE" });
      if (res.ok) router.push("/projects");
      else { const d = await res.json(); setError(d.error); }
    } catch { setError("删除失败"); }
    setShowDelete(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb]">
      <div className="text-[#666666]">加载中...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f0eb] flex flex-col">
      <Header />
      <main className="flex-1 max-w-[800px] mx-auto w-full px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link href={`/projects/${params.id}`} className="link-violet text-sm">&larr; 返回项目详情</Link>
          <button onClick={() => setShowDelete(true)} className="text-sm text-[#421d24] hover:underline">删除项目</button>
        </div>

        <h1 className="text-[#292827]" style={{ fontSize: 26, fontWeight: 460 }}>编辑项目</h1>

        {error && (
          <div className="p-4 rounded-xl bg-[#421d24]/10 border border-[#421d24]/20 text-[#421d24] text-sm">{error}</div>
        )}

        {/* Basic Info */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm text-[#292827] block mb-1" style={{ fontWeight: 540 }}>项目名称</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} className="input-field" placeholder="给你的项目起个名字" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#292827] block mb-1" style={{ fontWeight: 540 }}>类型</label>
              <select value={form.type} onChange={(e) => update("type", e.target.value)} className="input-field">
                {PROJECT_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-[#292827] block mb-1" style={{ fontWeight: 540 }}>状态</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value)} className="input-field">
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">已发布</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-[#292827] block mb-1">角色</label>
              <input value={form.role} onChange={(e) => update("role", e.target.value)} className="input-field" placeholder="如：前端开发" />
            </div>
            <div>
              <label className="text-sm text-[#292827] block mb-1">团队人数</label>
              <input type="number" min={1} max={50} value={form.teamSize} onChange={(e) => update("teamSize", +e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-sm text-[#292827] block mb-1">开始日期</label>
              <input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-sm text-[#292827] block mb-1">结束日期（可选）</label>
            <input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className="input-field" />
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
          <label className="text-sm text-[#292827] block mb-2" style={{ fontWeight: 540 }}>技术栈</label>
          <div className="flex gap-2 mb-3">
            <input value={techInput} onChange={(e) => setTechInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
              className="input-field" placeholder="输入后按回车添加" />
            <button type="button" onClick={addTech} className="btn-secondary whitespace-nowrap">添加</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.techStack.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-3 py-1 bg-[#f2f0eb] rounded-full text-sm border border-[#e3e3e2]">
                {t}
                <button onClick={() => update("techStack", form.techStack.filter((x) => x !== t))} className="text-[#421d24] hover:text-red-600 ml-1">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6">
          <label className="text-sm text-[#292827] block mb-2" style={{ fontWeight: 540 }}>项目描述</label>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} className="input-field min-h-[120px]" placeholder="描述这个项目..." />
        </div>

        {/* Difficulty & Solution */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm text-[#292827] block mb-1" style={{ fontWeight: 540 }}>遇到的困难</label>
            <textarea value={form.difficultyEncountered} onChange={(e) => update("difficultyEncountered", e.target.value)} className="input-field min-h-[80px]" placeholder="描述你在项目中遇到的最大困难..." />
          </div>
          <div>
            <label className="text-sm text-[#292827] block mb-1" style={{ fontWeight: 540 }}>解决方案</label>
            <textarea value={form.solution} onChange={(e) => update("solution", e.target.value)} className="input-field min-h-[80px]" placeholder="描述你的解决过程..." />
          </div>
        </div>

        {/* Outcome & Links */}
        <div className="bg-white border border-[#e3e3e2] rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[#292827] block mb-1">成果类型</label>
              <select value={form.outcomeType} onChange={(e) => update("outcomeType", e.target.value)} className="input-field">
                {OUTCOME_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-[#292827] block mb-1">成果描述</label>
              <input value={form.outcome} onChange={(e) => update("outcome", e.target.value)} className="input-field" placeholder="如：获得一等奖" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-[#666666] block mb-1">GitHub</label><input type="url" value={form.githubLink} onChange={(e) => update("githubLink", e.target.value)} className="input-field" placeholder="https://github.com/..." /></div>
            <div><label className="text-xs text-[#666666] block mb-1">线上地址</label><input type="url" value={form.liveLink} onChange={(e) => update("liveLink", e.target.value)} className="input-field" placeholder="https://..." /></div>
            <div><label className="text-xs text-[#666666] block mb-1">设计稿</label><input type="url" value={form.designLink} onChange={(e) => update("designLink", e.target.value)} className="input-field" placeholder="https://figma.com/..." /></div>
            <div><label className="text-xs text-[#666666] block mb-1">视频</label><input type="url" value={form.videoLink} onChange={(e) => update("videoLink", e.target.value)} className="input-field" placeholder="https://bilibili.com/..." /></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "保存中..." : "保存修改"}</button>
          <Link href={`/projects/${params.id}`} className="btn-secondary">取消</Link>
        </div>
      </main>

      {/* Delete Confirm Modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-[#292827] mb-2" style={{ fontWeight: 540 }}>确认删除</h3>
            <p className="text-sm text-[#666666] mb-4">删除后不可恢复，关联的成长记录也将一并删除。</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 py-2 bg-[#421d24] text-white rounded-xl text-sm hover:opacity-90 transition">确认删除</button>
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2 bg-[#f2f0eb] text-[#292827] rounded-xl text-sm border border-[#e3e3e2]">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
