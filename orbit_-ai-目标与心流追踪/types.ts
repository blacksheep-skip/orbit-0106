export enum MatrixQuadrant {
  DoFirst = 'DO_FIRST', // Important & Urgent
  Schedule = 'SCHEDULE', // Important & Not Urgent
  Delegate = 'DELEGATE', // Not Important & Urgent
  Eliminate = 'ELIMINATE' // Not Important & Not Urgent
}

export interface GoalLog {
  id: string;
  timestamp: number; // Date.now()
  content: string;
  mood?: 'neutral' | 'happy' | 'frustrated' | 'focused';
}

export interface SubGoal {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: number; // Timestamp when completed
  assignedDate?: string; // ISO Date string (YYYY-MM-DD) for "Today" view
  todayIndex?: number; // For sorting in Today View
  logs: GoalLog[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  quadrant: MatrixQuadrant;
  deadline: string; // ISO date string
  subGoals: SubGoal[];
  retrospective?: string;
  source?: 'manual' | 'calendar';
  createdAt: number;
}