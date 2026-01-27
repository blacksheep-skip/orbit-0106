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
  text += `请根据以上记录，帮我生成一份详细的复盘总结。`;
  
  return text;
};
