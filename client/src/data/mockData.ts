import { PracticeQuestion } from '../types/practice';

export const LESSON_OUTLINE = [
  {
    id: 'ch-1',
    title: 'Chapter 1: Cell Biology',
    topics: [
      { id: 't-1', title: 'Cell Membrane Structure', status: 'completed' },
      { id: 't-2', title: 'Active vs Passive Transport', status: 'current' },
      { id: 't-3', title: 'Endocytosis & Exocytosis', status: 'locked' }
    ]
  }
];

export type StepType = 'teach' | 'ask' | 'feedback';

export interface TutorStep {
  id: string;
  type: StepType;
  heading?: string;
  content: string;
  keyPoints?: string[];
  example?: string;
  question?: {
    type: 'mcq' | 'short_answer';
    text: string;
    options?: string[];
    correctAnswer: string;
    hint: string;
  };
}

export const TOPIC_STEPS: TutorStep[] = [
  {
    id: 's-1',
    type: 'teach',
    heading: 'Passive Transport: Diffusion',
    content: "Let's start with passive transport. This is when molecules move across the cell membrane without the cell spending any energy (ATP). They naturally move from an area of high concentration to an area of low concentration.",
    keyPoints: [
      "No cellular energy (ATP) required.",
      "Moves down the concentration gradient (High → Low)."
    ],
    example: "Think of passive transport like riding a bicycle downhill. You don't have to pedal (use energy); gravity does the work for you."
  },
  {
    id: 's-2',
    type: 'ask',
    content: "Let's check your understanding of passive transport.",
    question: {
      type: 'mcq',
      text: "Which of the following is a key characteristic of passive transport?",
      options: [
        "It requires ATP energy",
        "Molecules move from low to high concentration",
        "Molecules move down their concentration gradient",
        "It only happens in plant cells"
      ],
      correctAnswer: "Molecules move down their concentration gradient",
      hint: "Remember the bicycle analogy—you are moving with the natural flow, not fighting against it."
    }
  },
  {
    id: 's-3',
    type: 'teach',
    heading: 'Active Transport',
    content: "Now let's look at active transport. Sometimes a cell needs to move molecules against their natural gradient (from low to high concentration). To do this, the cell must use energy in the form of ATP to pump the molecules across the membrane.",
    keyPoints: [
      "Requires ATP energy.",
      "Moves against the concentration gradient (Low → High).",
      "Often involves specific protein pumps."
    ],
    example: "Active transport is like pedaling a bicycle up a steep hill. It requires significant energy and effort to go against gravity."
  }
];

export const MOCK_SESSIONS = [
  {
    id: 'sess-1',
    title: 'Biology 101: Cell Transport',
    subject: 'Biology',
    lastAccessed: '2 hours ago',
    progress: 33,
    stepIndex: 0,
    source: 'Biology_Chapter4.pdf',
    steps: TOPIC_STEPS
  },
  {
    id: 'sess-2',
    title: 'Thermodynamics Laws',
    subject: 'Physics',
    lastAccessed: 'Yesterday',
    progress: 80,
    stepIndex: 2,
    source: 'Physics_Notes.pdf',
    steps: TOPIC_STEPS
  }
];

export const MOCK_QUESTIONS: PracticeQuestion[] = [
  {
    id: 'q1',
    type: 'mcq',
    topicId: '1',
    difficulty: 'intermediate',
    content: 'Which molecule enters the Krebs cycle by combining with oxaloacetate?',
    options: ['Pyruvate', 'Citrate', 'Acetyl-CoA', 'Alpha-ketoglutarate'],
    correctAnswer: 'Acetyl-CoA',
    explanation: 'Acetyl-CoA, a two-carbon molecule, combines with the four-carbon oxaloacetate to form the six-carbon citrate, initiating the cycle.',
    hints: ['It is a 2-carbon molecule.', 'It is the direct product of the transition reaction from pyruvate.']
  },
  {
    id: 'q2',
    type: 'mcq',
    topicId: '2',
    difficulty: 'beginner',
    content: 'What is the Michaelis constant (Km)?',
    options: ['Max reaction rate', 'Substrate concentration at Vmax/2', 'Enzyme concentration', 'Inhibitor affinity'],
    correctAnswer: 'Substrate concentration at Vmax/2',
    explanation: 'Km indicates the affinity of the enzyme for its substrate. A lower Km means higher affinity.'
  },
  {
    id: 'q3',
    type: 'mcq',
    topicId: '3',
    difficulty: 'advanced',
    content: 'Which type of IV fluid should you administer to rehydrate cells without causing them to burst?',
    options: ['Hypertonic Saline (3%)', 'Isotonic Saline (0.9%)', 'Hypotonic Saline (0.45%)', 'Pure Water'],
    correctAnswer: 'Isotonic Saline (0.9%)',
    explanation: 'Isotonic fluid matches the osmolarity of blood plasma, allowing cells to rehydrate safely without massive water influx that could cause lysis.'
  },
  {
    id: 'q4',
    type: 'mcq',
    topicId: '1',
    difficulty: 'beginner',
    content: 'What is the powerhouse of the cell?',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus'],
    correctAnswer: 'Mitochondria',
    explanation: 'Mitochondria generate most of the cell\'s supply of adenosine triphosphate (ATP).'
  },
  {
    id: 'q5',
    type: 'mcq',
    topicId: '1',
    difficulty: 'intermediate',
    content: 'What is the primary function of ribosomes?',
    options: ['Lipid synthesis', 'Protein synthesis', 'DNA replication', 'Cell division'],
    correctAnswer: 'Protein synthesis',
    explanation: 'Ribosomes are macromolecular machines found within all living cells that perform biological protein synthesis.'
  },
  {
    id: 'q6',
    type: 'mcq',
    topicId: '2',
    difficulty: 'advanced',
    content: 'What does the First Law of Thermodynamics state?',
    options: ['Entropy always increases', 'Energy cannot be created or destroyed', 'Absolute zero is unattainable', 'Heat flows from cold to hot'],
    correctAnswer: 'Energy cannot be created or destroyed',
    explanation: 'The First Law is the law of conservation of energy.'
  }
];

export const MOCK_WEAK_TOPICS = [
  { id: '1', name: 'Krebs Cycle', strength: 30 },
  { id: '2', name: 'Enzyme Kinetics', strength: 45 },
  { id: '3', name: 'Cell Membrane', strength: 60 }
];
