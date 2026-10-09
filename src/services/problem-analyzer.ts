/**
 * 履程 AI 深度分析引擎
 * 核心能力：解析学生"遇到困难→解决问题"的过程描述，
 * 生成结构化能力洞察，评估问题解决深度、思维模式、学习信号。
 * 
 * 双引擎模式：规则引擎（基础）+ InternLM LLM（增强）
 */

import { callInternLM, isInternLMAvailable } from "./internlm";

// === 类型定义 ===

export interface ProblemAnalysis {
  // 问题解决深度评估
  depth: {
    score: number;          // 0-100
    level: "surface" | "moderate" | "deep" | "expert";
    indicators: string[];   // 检测到的深度指标
  };
  // 思维模式识别
  thinking: {
    pattern: string[];      // 如: ["系统性思维", "第一性原理", "类比迁移"]
    creativity: number;     // 0-100 创新性评分
    structuredness: number; // 0-100 结构化程度
  };
  // 学习信号
  learning: {
    newTechAdopted: boolean;
    selfResearch: boolean;
    iterationCount: number;  // 尝试了几种方案
    crossDomain: boolean;    // 是否跨领域借鉴
  };
  // 综合能力洞察
  insights: AbilityInsight[];
  // 文字总结（可直接展示在名片上）
  summary: string;
}

export interface AbilityInsight {
  dimension: "craft" | "learn" | "drive" | "team" | "grit" | "express";
  signal: string;       // 具体发现
  strength: "high" | "medium" | "low";
  evidence: string;     // 原文中的证据片段
}

// === 分析词库与规则 ===

// 深度思维信号词
const DEPTH_SIGNALS: Record<string, string[]> = {
  // 第一性原理 / 底层分析
  "first_principles": ["根本原因", "本质", "底层", "原理", "为什么", "核心问题", "根因", "追根溯源"],
  // 系统性思维
  "systematic": ["整体方案", "架构", "流程", "分阶段", "步骤", "体系", "框架", "全链路"],
  // 量化分析
  "quantitative": ["性能数据", "对比", "从X到Y", "降低了", "提升了", "测试", "benchmark", "压测", "监控"],
  // 权衡取舍
  "tradeoff": ["权衡", "取舍", "利弊", "优缺点", "替代方案", "考虑过但", "最终选择", "因为...所以"],
  // 创新性
  "creative": ["创新", "独创", "自己设计", "没有现成方案", "换了个思路", "逆向", "跨领域", "类比"],
  // 迭代优化
  "iterative": ["第一版", "后来发现", "改进", "优化", "重构", "反复", "迭代", "v2", "又试了"],
};

// 学习信号词
const LEARNING_SIGNALS: Record<string, string[]> = {
  "new_tech": ["第一次用", "学习了", "研究了", "新尝试", "刚学的", "自学", "看了文档", "查了资料"],
  "self_research": ["查了", "翻了很多", "读源码", "看论文", "搜了", "找了很久", "试了多种方案"],
  "cross_domain": ["借鉴", "从另一个项目", "参考了其他", "跨领域", "其他行业的做法"],
};

// 抗压力信号词
const GRIT_SIGNALS = ["卡了很久", "多次失败", "反复调试", "放弃了又捡起来", "连续几天", "最终解决", "没有放弃", "硬啃", "花了很长时间"];

// 协作力信号词  
const TEAM_SIGNALS = ["和队友", "讨论了", "请教", "分工", "协作", "沟通", "说服", "协调", "帮助同学", "code review"];

// 表达力信号词
const EXPRESS_SIGNALS = ["写了博客", "做了分享", "画了图", "文档", "演示", "讲解", "总结", "复盘", "汇报"];

// === 核心分析函数 ===

export function analyzeProblemSolving(
  difficulty: string,
  solution: string,
  techStack: string[]
): ProblemAnalysis {
  const fullText = `${difficulty} ${solution}`;
  const lowerText = fullText.toLowerCase();

  // 1. 深度评估
  const depth = analyzeDepth(solution);

  // 2. 思维模式
  const thinking = analyzeThinking(fullText, solution);

  // 3. 学习信号
  const learning = analyzeLearning(fullText, techStack);

  // 4. 能力洞察
  const insights = generateInsights(fullText, depth, thinking, learning, difficulty, solution);

  // 5. 文字总结
  const summary = generateSummary(depth, thinking, learning, insights, solution);

  return { depth, thinking, learning, insights, summary };
}

function analyzeDepth(solution: string): ProblemAnalysis["depth"] {
  let score = 20; // 基础分
  const indicators: string[] = [];

  // 检查各类深度信号
  for (const [category, keywords] of Object.entries(DEPTH_SIGNALS)) {
    const found = keywords.filter(kw => solution.includes(kw));
    if (found.length > 0) {
      score += found.length * 10;
      indicators.push(...found.map(f => `${category}:${f}`));
    }
  }

  // 方案步骤数（通过连接词和编号判断）
  const stepCount = (solution.match(/首先|然后|接着|最后|第一|第二|第三|步骤|Phase|Step/gi) || []).length;
  if (stepCount >= 3) {
    score += 15;
    indicators.push(`多步骤方案(${stepCount}步)`);
  }

  // 是否有量化结果
  if (/\d+[%％]|\d+ms|\d+倍|\d\.\d+/.test(solution)) {
    score += 15;
    indicators.push("量化结果");
  }

  // 是否对比了多种方案
  const alternatives = (solution.match(/或者|也可以|另一种|对比|相比|而.*选择/g) || []).length;
  if (alternatives >= 2) {
    score += 10;
    indicators.push(`多方案对比(${alternatives}种)`);
  }

  score = Math.min(score, 100);

  let level: ProblemAnalysis["depth"]["level"] = "surface";
  if (score >= 80) level = "expert";
  else if (score >= 55) level = "deep";
  else if (score >= 35) level = "moderate";

  return { score, level, indicators };
}

function analyzeThinking(fullText: string, solution: string): ProblemAnalysis["thinking"] {
  const patterns: string[] = [];

  // 识别思维模式
  if (DEPTH_SIGNALS["first_principles"].some(kw => fullText.includes(kw))) {
    patterns.push("第一性原理思维");
  }
  if (DEPTH_SIGNALS["systematic"].some(kw => fullText.includes(kw))) {
    patterns.push("系统性思维");
  }
  if (DEPTH_SIGNALS["quantitative"].some(kw => fullText.includes(kw))) {
    patterns.push("数据驱动思维");
  }
  if (DEPTH_SIGNALS["tradeoff"].some(kw => fullText.includes(kw))) {
    patterns.push("权衡型决策");
  }
  if (DEPTH_SIGNALS["creative"].some(kw => fullText.includes(kw))) {
    patterns.push("创新突破思维");
  }
  if (DEPTH_SIGNALS["iterative"].some(kw => fullText.includes(kw))) {
    patterns.push("迭代优化思维");
  }

  if (patterns.length === 0) patterns.push("实践探索型");

  // 创新性评分
  let creativity = 30;
  if (DEPTH_SIGNALS["creative"].some(kw => fullText.includes(kw))) creativity += 30;
  if (patterns.length >= 3) creativity += 15;
  if (solution.length > 150) creativity += 10; // 详细阐述说明思考深入
  creativity = Math.min(creativity, 100);

  // 结构化程度
  let structuredness = 20;
  const hasSequence = /首先|然后|接着|最后|第[一二三四五]/.test(solution);
  const hasCategories = /方面|维度|层次|分类|类型/.test(solution);
  const hasQuantify = /\d+[%％]|\d+ms|\d+倍/.test(solution);
  const hasCompare = /对比|相比|优于|不如/.test(solution);
  structuredness += (hasSequence ? 25 : 0) + (hasCategories ? 20 : 0) + (hasQuantify ? 15 : 0) + (hasCompare ? 15 : 0);
  structuredness = Math.min(structuredness, 100);

  return { pattern: patterns, creativity, structuredness };
}

function analyzeLearning(fullText: string, techStack: string[]): ProblemAnalysis["learning"] {
  const newTechAdopted = LEARNING_SIGNALS["new_tech"].some(kw => fullText.includes(kw));
  const selfResearch = LEARNING_SIGNALS["self_research"].some(kw => fullText.includes(kw));
  const crossDomain = LEARNING_SIGNALS["cross_domain"].some(kw => fullText.includes(kw));

  // 计算迭代次数（尝试了几种方案）
  const iterations = (fullText.match(/试过|尝试|方案[一二三四五]|另一种|换了|又重新/g) || []).length + 1;

  return {
    newTechAdopted,
    selfResearch,
    iterationCount: Math.min(iterations, 5),
    crossDomain,
  };
}

function generateInsights(
  fullText: string,
  depth: ProblemAnalysis["depth"],
  thinking: ProblemAnalysis["thinking"],
  learning: ProblemAnalysis["learning"],
  difficulty: string,
  solution: string,
): AbilityInsight[] {
  const insights: AbilityInsight[] = [];

  // 专业力洞察
  if (depth.score >= 50) {
    const evidence = findEvidence(solution, DEPTH_SIGNALS["quantitative"]) || solution.slice(0, 50);
    insights.push({
      dimension: "craft",
      signal: `解决方案具备${depth.level === "expert" ? "专家级" : "深度"}技术思维`,
      strength: depth.score >= 80 ? "high" : "medium",
      evidence,
    });
  }

  // 学习力洞察
  if (learning.newTechAdopted || learning.selfResearch) {
    const signals = [
      learning.newTechAdopted ? "主动学习新技术" : "",
      learning.selfResearch ? "自主研究解决问题" : "",
      learning.crossDomain ? "跨领域借鉴方案" : "",
    ].filter(Boolean).join("、");
    insights.push({
      dimension: "learn",
      signal: signals,
      strength: learning.crossDomain ? "high" : "medium",
      evidence: findEvidence(fullText, LEARNING_SIGNALS["new_tech"]) || difficulty.slice(0, 50),
    });
  }

  // 自驱力洞察
  if (learning.iterationCount >= 2) {
    insights.push({
      dimension: "drive",
      signal: `面对问题主动尝试了 ${learning.iterationCount} 种方案`,
      strength: learning.iterationCount >= 3 ? "high" : "medium",
      evidence: findEvidence(fullText, ["试过", "尝试", "方案", "换了", "又重新"]) || solution.slice(0, 50),
    });
  }

  // 协作力洞察
  if (TEAM_SIGNALS.some(kw => fullText.includes(kw))) {
    insights.push({
      dimension: "team",
      signal: "解决过程中体现了协作沟通能力",
      strength: "medium",
      evidence: findEvidence(fullText, TEAM_SIGNALS) || "",
    });
  }

  // 抗压力洞察
  if (GRIT_SIGNALS.some(kw => fullText.includes(kw))) {
    insights.push({
      dimension: "grit",
      signal: "面对技术难题展现了持续攻坚精神",
      strength: fullText.match(/很久|多次|反复|连续/) ? "high" : "medium",
      evidence: findEvidence(fullText, GRIT_SIGNALS) || difficulty.slice(0, 50),
    });
  }

  // 表达力洞察
  if (thinking.structuredness >= 60) {
    insights.push({
      dimension: "express",
      signal: "问题分析结构清晰，表达具备逻辑层次感",
      strength: thinking.structuredness >= 80 ? "high" : "medium",
      evidence: "方案描述结构化程度高",
    });
  }

  return insights;
}

function generateSummary(
  depth: ProblemAnalysis["depth"],
  thinking: ProblemAnalysis["thinking"],
  learning: ProblemAnalysis["learning"],
  insights: AbilityInsight[],
  solution: string,
): string {
  const parts: string[] = [];

  // 思维模式总结
  parts.push(`展现了${thinking.pattern.slice(0, 2).join("与")}的能力`);

  // 深度评价
  if (depth.level === "expert") {
    parts.push("解决问题的深度达到专业水平");
  } else if (depth.level === "deep") {
    parts.push("具备深度分析和系统性解决复杂问题的潜力");
  } else if (depth.level === "moderate") {
    parts.push("展现了基本的技术问题拆解能力");
  }

  // 学习评价
  if (learning.newTechAdopted && learning.selfResearch) {
    parts.push("且能在实践中主动学习新知识");
  }

  // 维度覆盖
  const dimensions = new Set(insights.map(i => i.dimension));
  parts.push(`本次记录体现了 ${dimensions.size} 个维度的能力信号`);

  return parts.join("，") + "。";
}

function findEvidence(text: string, keywords: string[]): string | null {
  for (const kw of keywords) {
    const idx = text.indexOf(kw);
    if (idx >= 0) {
      return text.slice(Math.max(0, idx - 10), idx + kw.length + 30);
    }
  }
  return null;
}

// === LLM 增强分析 ===

/**
 * 使用 InternLM 对分析结果进行深度增强
 * 在规则引擎基础上，用 LLM 生成更有诗意和深度的能力洞察文案
 */
export async function analyzeWithLLM(
  difficulty: string,
  solution: string,
  techStack: string[],
  ruleResult: ProblemAnalysis
): Promise<ProblemAnalysis> {
  if (!isInternLMAvailable()) {
    return ruleResult; // 无 token 时回退到规则引擎
  }

  try {
    const prompt = `你是一个大学生能力评估专家。请根据以下学生的项目记录，生成一段有深度、有诗意的能力评价（80-150字）。

要求：
1. 引用学生描述中的原话关键词
2. 使用比喻让评价更生动（如"把杯子换成湖"这类意象）
3. 指出具体展现了哪些能力维度（专业力/学习力/自驱力/协作力/抗压力/表达力）
4. 避免空泛套话，要有洞察感
5. 最后用一句话概括这个学生的成长特质

学生记录：
- 遇到的困难：${difficulty}
- 解决方案：${solution}
- 技术栈：${techStack.join(", ")}
- 规则引擎检测到的思维模式：${ruleResult.thinking.pattern.join(", ")}
- 解决深度：${ruleResult.depth.level}

请直接输出评价文字，不要加引号或前缀。`;

    const llmSummary = await callInternLM(
      [
        { role: "system", content: "你是履程平台的能力分析师，擅长从学生的项目记录中发现独特的成长信号。文案风格追求诗意与深度。" },
        { role: "user", content: prompt },
      ],
      { temperature: 0.8, maxTokens: 300 }
    );

    if (llmSummary && llmSummary.length > 20) {
      return {
        ...ruleResult,
        summary: llmSummary.trim(),
      };
    }
  } catch (error) {
    console.error("InternLM analysis fallback:", error);
  }

  return ruleResult;
}
