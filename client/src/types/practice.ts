export type PracticeMode = 'quiz' | 'flashcards' | 'story' | 'challenge' | 'weak_areas';
export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface PracticeQuestion {
  id: string;
  type: 'mcq' | 'flashcard' | 'story_scenario';
  content: string;
  options?: string[]; // for mcq
  correctAnswer: string;
  explanation: string;
  difficulty: QuestionDifficulty;
  topicId: string;
  hints?: string[];
  // Story mode specific
  storyContext?: string;
  characterDialogue?: string;
}

export interface PracticeSession {
  id: string;
  mode: PracticeMode;
  questions: PracticeQuestion[];
  currentQuestionIndex: number;
  score: number;
  streak: number;
  startTime: string;
  timeRemainingMs?: number; // for challenge mode
  completed: boolean;
}

export interface PracticeState {
  currentMode: PracticeMode | null;
  activeSession: PracticeSession | null;
  isLoading: boolean;
  weakTopics: { id: string; name: string; strength: number }[];
}
