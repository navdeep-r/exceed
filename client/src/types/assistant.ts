export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isAudio?: boolean;
  audioUrl?: string;
  // Structured format for AI responses
  structuredResponse?: {
    answer: string;
    keyPoints?: string[];
    example?: string;
  };
  // Context used to generate the response
  contextSources?: {
    type: 'note' | 'transcript' | 'weak_topic';
    title: string;
    id: string;
  }[];
}

export interface ChatSession {
  id: string;
  studentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  selectedContext?: {
    notesIds: string[];
    topics: string[];
  };
}

export interface ChatState {
  activeChatId: string | null;
  sessions: ChatSession[];
  isLoading: boolean;
  isRecording: boolean;
  selectedContext: {
    notesIds: string[];
    topics: string[];
  } | null;
}

export interface TutorMistake {
  id: string;
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  timestamp: string;
}

export interface TutorStep {
  id: string;
  type: 'teach' | 'ask' | 'feedback' | 'summary';
  content: string;
  audioUrl?: string;
  // For 'ask' type
  question?: {
    id: string;
    text: string;
    type: 'multiple_choice' | 'short_answer' | 'voice';
    options?: string[]; // for multiple choice
    hints?: string[];
  };
}

export interface TutorSession {
  id: string;
  studentId: string;
  topicId: string;
  mode: 'learn' | 'practice' | 'revision';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  currentStepIndex: number;
  steps: TutorStep[];
  score: number;
  mistakes: TutorMistake[];
  startedAt: string;
  completedAt?: string;
}

export interface TutorState {
  activeSession: TutorSession | null;
  isLoading: boolean;
  isRecording: boolean;
}
