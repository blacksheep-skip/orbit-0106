import { Goal } from "../types";

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
  text += `请你扮演“复盘教练/项目复盘顾问”，根据以上记录按 **STA 原则**输出复盘（中文）：\n\n`;
  text += `STA 模板：\n`;
  text += `S（Situation 情境）：\n`;
  text += `- 目标/背景是什么？\n`;
  text += `- 关键时间点/约束条件是什么？\n`;
  text += `- 当前进度与结果（完成/未完成）？\n\n`;
  text += `T（Task 任务）：\n`;
  text += `- 我本来要完成什么？\n`;
  text += `- “完成/成功”的衡量标准是什么？\n\n`;
  text += `A（Action 行动）：\n`;
  text += `- 我做了哪些关键行动？按先后顺序列出（结合心流日志）\n`;
  text += `- 遇到的阻碍/分心点是什么？当时如何应对？\n`;
  text += `- 哪些决策是关键拐点？为什么这么做？\n\n`;
  text += `最后请补充（务必给出具体、可执行的结论）：\n`;
  text += `1) 3 条“做得好的地方”（可复用的方法）\n`;
  text += `2) 3 条“问题与根因”（不要停留在表面）\n`;
  text += `3) 1 份“下次改进清单”（3-5 条、可执行、可衡量）\n`;
  text += `4) 给我一个“下一步最小行动”（<= 15 分钟能开始）\n`;
  
  return text;
};
