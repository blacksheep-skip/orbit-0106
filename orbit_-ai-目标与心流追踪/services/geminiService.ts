import { GoogleGenerativeAI } from "@google/generative-ai";
import { Goal } from "../types";

const ENV_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
const LS_KEY = 'orbit_gemini_api_key';

export const getGeminiApiKey = (): string | null => {
  return ENV_API_KEY || localStorage.getItem(LS_KEY);
};

export const setGeminiApiKey = (key: string) => {
  localStorage.setItem(LS_KEY, key);
};

export const summarizeDailyReview = async (reviewText: string): Promise<string> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `你是一个高效的个人复盘助手。请把下面“今日复盘”总结成简洁摘要：\n\n要求：\n- 输出 3~8 条要点\n- 每条不超过 25 个字\n- 只输出要点列表（用短横线开头）\n\n今日复盘：\n${reviewText}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text.trim();
};

// Helper function to format the goal data into a structured text for external AI tools
export const formatGoalForExport = (goal: Goal): string => {
  let text = `目标主题：${goal.title}\n`;
  text += `目标描述：${goal.description || '无'}\n`;
  text += `================================\n\n`;

  if (goal.subGoals.length === 0) {
    text += "（暂无子目标记录）";
    return text;
  }

  goal.subGoals.forEach((sg, index) => {
    const status = sg.isCompleted ? "[已完成]" : "[进行中]";
    // Level 1 Header: Sub-goal
    text += `### 子目标 ${index + 1}：${sg.title} ${status}\n`;
    
    if (sg.logs.length === 0) {
      text += "（暂无心流日志）\n\n";
    } else {
      text += `**心流日志记录：**\n`;
      sg.logs.forEach((log) => {
        const time = new Date(log.timestamp).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        // Level 2 content (bullet points)
        text += `- [${time}] ${log.content}\n`;
      });
      text += "\n";
    }
  });

  text += `================================\n`;
  text += `请根据以上记录，帮我生成一份详细的复盘总结。`;
  
  return text;
};
