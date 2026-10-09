import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero — Gradient Atmospheric Band */}
        <section className="relative overflow-hidden py-24 px-6">
          {/* Gradient Composition */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 600px 400px at 68% 50%, rgba(113,76,182,0.12) 0%, transparent 70%),
                radial-gradient(ellipse 500px 350px at 93% 50%, rgba(59,130,246,0.08) 0%, transparent 70%),
                radial-gradient(ellipse 600px 300px at 50% 98%, rgba(236,72,153,0.06) 0%, transparent 60%),
                radial-gradient(ellipse 500px 300px at 30% 75%, rgba(6,182,212,0.06) 0%, transparent 60%)
              `,
            }}
          />
          <div className="relative max-w-[1200px] mx-auto text-center">
            <h1
              className="text-[#292827] leading-[0.96] tracking-[-0.028em]"
              style={{ fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 460 }}
            >
              让每一步成长
              <br />
              <span className="text-[#421d24]">都被看见、被认证</span>
            </h1>
            <p className="text-lg text-[#666666] mt-6 max-w-2xl mx-auto leading-relaxed" style={{ fontWeight: 400 }}>
              不看学历，看能力。用结构化的项目记录和成长轨迹，
              向用人单位展示你的真实能力——30 秒生成能力名片。
            </p>
            <div className="flex items-center justify-center gap-4 mt-10">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#421d24] text-white rounded-2xl hover:bg-[#5a2830] transition-colors"
                style={{ fontWeight: 460, fontSize: 16 }}
              >
                开始记录成长
                <span className="text-sm">→</span>
              </Link>
              <a
                href="#features"
                className="px-6 py-3 text-[#292827] hover:underline transition-colors"
                style={{ fontWeight: 460, fontSize: 16 }}
              >
                了解更多
              </a>
            </div>
            <p className="text-sm text-[#666666] mt-6 opacity-70" style={{ fontWeight: 400 }}>
              面向大学生 · 免费使用 · 30 秒注册
            </p>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2
              className="text-[#292827] text-center mb-14 tracking-[-0.022em]"
              style={{ fontSize: 28, fontWeight: 460, lineHeight: 1.14 }}
            >
              85% 的大学生没有学历光环，如何证明自己？
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: "📄", title: "简历同质化", desc: "所有人都写着学生会主席、绩点 3.8，HR 分不清谁有能力" },
                { icon: "🎓", title: "学历不等于能力", desc: "名校毕业不代表能干活，双非学生也有很强的实战能力" },
                { icon: "⏱️", title: "面试看不准", desc: "30 分钟面试判断一个人，试错成本是年薪的 1.5 倍" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-white border border-[#e3e3e2] rounded-2xl p-6 text-center">
                  <div className="text-4xl mb-4">{icon}</div>
                  <h3 className="text-[#292827] mb-2" style={{ fontSize: 18, fontWeight: 540 }}>{title}</h3>
                  <p className="text-sm text-[#666666] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features — Dark Feature Band */}
        <section id="features" className="py-20 px-6 bg-[#0c4243]">
          <div className="max-w-[1200px] mx-auto">
            <h2
              className="text-white mb-4 tracking-[-0.022em]"
              style={{ fontSize: 28, fontWeight: 460, lineHeight: 1.14 }}
            >
              履程的解法：用数据说话
            </h2>
            <p className="text-white/70 mb-14 max-w-lg" style={{ fontWeight: 400 }}>
              结构化记录你的项目经历，AI 自动分析六维能力，30 秒生成能力名片
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { icon: "📝", title: "结构化项目记录", desc: "不是写简历，而是填表记录。项目名称、角色、技术栈、遇到的困难、解决方案——结构化输入，标准化输出。" },
                { icon: "🎯", title: "六维能力评估", desc: "专业力、学习力、自驱力、协作力、抗压力、表达力。由行为数据自动计算，不是你自己打分。" },
                { icon: "📈", title: "成长斜率追踪", desc: "持续记录，看你的能力增长趋势。成长斜率比绝对分数更有价值——只有持续记录的平台才能算出来。" },
                { icon: "🪪", title: "能力名片", desc: "一个链接，30 秒看懂一个人。HR 在微信里点开就能判断要不要面试，不需要翻简历。" },
                { icon: "🏆", title: "企业挑战赛", desc: "企业发布实战任务，学生参与挑战。即使没被选中，完成过程也沉淀到能力档案。" },
                { icon: "🔍", title: "可信度标记", desc: "有 GitHub 链接、量化数据、他人评价的记录标记为高可信。让 HR 知道哪些数据是硬货。" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                  <div className="text-2xl mb-3">{icon}</div>
                  <h3 className="text-white mb-1.5" style={{ fontSize: 17, fontWeight: 540 }}>{title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2
              className="text-[#292827] text-center mb-14 tracking-[-0.022em]"
              style={{ fontSize: 28, fontWeight: 460, lineHeight: 1.14 }}
            >
              三步开始
            </h2>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { step: "01", title: "注册并记录", desc: "注册账号，把你的课程项目、比赛、实习经历用结构化表单记录下来" },
                { step: "02", title: "AI 自动分析", desc: "平台根据你的行为数据自动计算六维能力分数，每次记录后即时反馈" },
                { step: "03", title: "分享给 HR", desc: "生成能力名片链接，放在简历上或直接发给用人单位，30 秒看懂你" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="w-14 h-14 bg-[#d4c7ff] text-[#421d24] rounded-2xl flex items-center justify-center text-xl mx-auto mb-5" style={{ fontWeight: 540 }}>
                    {step}
                  </div>
                  <h3 className="text-[#292827] mb-2" style={{ fontSize: 18, fontWeight: 540 }}>{title}</h3>
                  <p className="text-sm text-[#666666] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6">
          <div className="max-w-[800px] mx-auto text-center">
            <h2
              className="text-[#292827] mb-4 tracking-[-0.027em]"
              style={{ fontSize: 40, fontWeight: 460, lineHeight: 1.2 }}
            >
              你的每一步成长，都值得被看见
            </h2>
            <p className="text-[#666666] mb-8 text-lg" style={{ fontWeight: 400 }}>
              加入履程，开始构建你的能力档案。免费、简单、30 秒注册。
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#421d24] text-white rounded-2xl hover:bg-[#5a2830] transition-colors"
              style={{ fontWeight: 460, fontSize: 16 }}
            >
              立即开始
              <span className="text-sm">→</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
