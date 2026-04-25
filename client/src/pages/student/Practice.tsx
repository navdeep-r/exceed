import { useState, useEffect } from 'react';
import { PracticeMode, PracticeState, PracticeSession, PracticeQuestion } from '../../types/practice';
import { Brain, Flame, Target, BookOpen, Clock, AlertTriangle, ChevronRight, CheckCircle2, RotateCcw, HelpCircle, Trophy } from 'lucide-react';

// --- MOCK DATA ---
const MOCK_WEAK_TOPICS = [
  { id: '1', name: 'Krebs Cycle', strength: 30 },
  { id: '2', name: 'Enzyme Kinetics', strength: 45 },
  { id: '3', name: 'Cell Membrane', strength: 60 }
];

const MOCK_QUESTIONS: PracticeQuestion[] = [
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
    type: 'flashcard',
    topicId: '2',
    difficulty: 'beginner',
    content: 'What is the Michaelis constant (Km)?',
    correctAnswer: 'The substrate concentration at which the reaction rate is half of its maximum value (Vmax/2).',
    explanation: 'Km indicates the affinity of the enzyme for its substrate. A lower Km means higher affinity.'
  },
  {
    id: 'q3',
    type: 'story_scenario',
    topicId: '3',
    difficulty: 'advanced',
    storyContext: 'You are a doctor treating a patient with severe dehydration. You need to administer IV fluids.',
    characterDialogue: 'Patient: "I feel incredibly dizzy and my mouth is completely dry. Please help."',
    content: 'Which type of IV fluid should you administer to rehydrate the cells without causing them to burst?',
    options: ['Hypertonic Saline (3%)', 'Isotonic Saline (0.9%)', 'Hypotonic Saline (0.45%)', 'Pure Water'],
    correctAnswer: 'Isotonic Saline (0.9%)',
    explanation: 'Isotonic fluid matches the osmolarity of blood plasma, allowing cells to rehydrate safely without massive water influx that could cause lysis.'
  }
];

export default function PracticePage() {
  const [state, setState] = useState<PracticeState>({
    currentMode: null,
    activeSession: null,
    isLoading: false,
    weakTopics: MOCK_WEAK_TOPICS
  });

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const startSession = (mode: PracticeMode) => {
    setState(prev => ({
      ...prev,
      currentMode: mode,
      activeSession: {
        id: `sess-${Date.now()}`,
        mode,
        questions: MOCK_QUESTIONS.filter(q => mode === 'quiz' ? q.type === 'mcq' : mode === 'flashcards' ? q.type === 'flashcard' : mode === 'story' ? q.type === 'story_scenario' : true),
        currentQuestionIndex: 0,
        score: 0,
        streak: 0,
        startTime: new Date().toISOString(),
        completed: false,
        timeRemainingMs: mode === 'challenge' ? 60000 : undefined
      }
    }));
  };

  const endSession = () => {
    setState(prev => ({ ...prev, activeSession: null, currentMode: null }));
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowHint(false);
  };

  const handleAnswer = (answer: string) => {
    if (showExplanation) return; // Prevent changing answer after submission
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    if (!state.activeSession) return;
    const currentQ = state.activeSession.questions[state.activeSession.currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    
    setShowExplanation(true);
    
    setState(prev => {
      if (!prev.activeSession) return prev;
      return {
        ...prev,
        activeSession: {
          ...prev.activeSession,
          score: isCorrect ? prev.activeSession.score + 100 + (prev.activeSession.streak * 10) : prev.activeSession.score,
          streak: isCorrect ? prev.activeSession.streak + 1 : 0,
        }
      };
    });
  };

  const nextQuestion = () => {
    if (!state.activeSession) return;
    const isLast = state.activeSession.currentQuestionIndex === state.activeSession.questions.length - 1;
    
    if (isLast) {
      setState(prev => ({ ...prev, activeSession: { ...prev.activeSession!, completed: true } }));
    } else {
      setState(prev => ({
        ...prev,
        activeSession: {
          ...prev.activeSession!,
          currentQuestionIndex: prev.activeSession!.currentQuestionIndex + 1
        }
      }));
    }
    
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowHint(false);
  };

  const renderModeSelector = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      <ModeCard 
        icon={<Brain className="w-6 h-6 text-primary-400" />} 
        title="Classic Quiz" 
        desc="Standard multiple choice questions tailored to your level." 
        onClick={() => startSession('quiz')} 
      />
      <ModeCard 
        icon={<BookOpen className="w-6 h-6 text-accent-400" />} 
        title="Flashcards" 
        desc="Active recall practice for definitions and core concepts." 
        onClick={() => startSession('flashcards')} 
      />
      <ModeCard 
        icon={<BookOpen className="w-6 h-6 text-emerald-400" />} 
        title="Story Mode" 
        desc="Apply knowledge in realistic, scenario-based challenges." 
        onClick={() => startSession('story')} 
      />
      <ModeCard 
        icon={<Clock className="w-6 h-6 text-amber-400" />} 
        title="Challenge Mode" 
        desc="Beat the clock. Rapid fire questions to test recall speed." 
        onClick={() => startSession('challenge')} 
      />
      <ModeCard 
        icon={<AlertTriangle className="w-6 h-6 text-danger-400" />} 
        title="Weak Areas" 
        desc="Targeted practice focusing solely on topics you struggle with." 
        onClick={() => startSession('weak_areas')} 
      />
    </div>
  );

  const activeSession = state.activeSession;

  if (!activeSession) {
    return (
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface-950">
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-10">
            <div>
              <h1 className="text-3xl font-bold text-surface-50">Practice & Mastery</h1>
              <p className="text-surface-400 mt-2">Select a mode to begin your targeted practice session.</p>
            </div>
            {renderModeSelector()}
          </div>
        </div>
        
        {/* Right Panel - Overview */}
        <div className="w-80 border-l border-surface-800 bg-surface-900/30 p-6 flex flex-col hidden lg:flex overflow-y-auto custom-scrollbar">
          <h2 className="text-sm font-semibold text-surface-200 mb-6 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-400" /> Focus Areas
          </h2>
          <div className="space-y-4">
            {state.weakTopics.map(topic => (
              <div key={topic.id} className="bg-surface-800/50 rounded-xl p-4 border border-surface-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-surface-200">{topic.name}</span>
                  <span className="text-[10px] text-danger-400 font-bold">{topic.strength}% Mastery</span>
                </div>
                <div className="w-full h-1.5 bg-surface-950 rounded-full overflow-hidden">
                  <div className="h-full bg-danger-500 rounded-full" style={{ width: `${topic.strength}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeSession.completed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-950 h-[calc(100vh-64px)]">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary-500/20">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-surface-50 mb-2">Session Complete!</h2>
        <p className="text-surface-400 mb-8">Great job! Your adaptive learning model has been updated.</p>
        
        <div className="flex gap-6 mb-10">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center min-w-[140px]">
            <p className="text-xs text-surface-500 font-medium uppercase tracking-wider mb-2">Score</p>
            <p className="text-3xl font-bold text-primary-400">{activeSession.score}</p>
          </div>
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center min-w-[140px]">
            <p className="text-xs text-surface-500 font-medium uppercase tracking-wider mb-2">Max Streak</p>
            <p className="text-3xl font-bold text-accent-400 flex items-center justify-center gap-1">
              <Flame className="w-6 h-6" /> {activeSession.streak}
            </p>
          </div>
        </div>

        <button 
          onClick={endSession}
          className="px-8 py-3 bg-surface-800 hover:bg-surface-700 text-surface-100 font-medium rounded-xl transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = activeSession.questions[activeSession.currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQ.correctAnswer;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface-950">
      
      {/* Main Practice Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="h-16 px-8 flex items-center justify-between border-b border-surface-800 bg-surface-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={endSession} className="text-surface-400 hover:text-surface-200"><RotateCcw className="w-5 h-5" /></button>
            <span className="text-sm font-semibold text-surface-200 capitalize">{activeSession.mode.replace('_', ' ')} Mode</span>
          </div>
          
          <div className="flex items-center gap-6">
            {activeSession.mode === 'challenge' && (
              <div className="flex items-center gap-2 text-danger-400 font-bold bg-danger-500/10 px-3 py-1 rounded-lg">
                <Clock className="w-4 h-4" /> 00:59
              </div>
            )}
            <div className="text-xs font-semibold text-surface-400">
              Question {activeSession.currentQuestionIndex + 1} of {activeSession.questions.length}
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
          <div className="w-full max-w-3xl animate-fade-in space-y-8">
            
            {/* Story Context (if applicable) */}
            {currentQ.type === 'story_scenario' && currentQ.storyContext && (
              <div className="bg-surface-800/30 border border-surface-700 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-accent-400 uppercase tracking-wider mb-2">Scenario</h3>
                <p className="text-surface-300 text-sm leading-relaxed mb-4">{currentQ.storyContext}</p>
                {currentQ.characterDialogue && (
                  <div className="pl-4 border-l-2 border-accent-500/50 italic text-surface-400 text-sm">
                    {currentQ.characterDialogue}
                  </div>
                )}
              </div>
            )}

            {/* The Question */}
            <h2 className="text-xl md:text-2xl font-semibold text-surface-100 leading-snug">
              {currentQ.content}
            </h2>

            {/* Hints */}
            {!showExplanation && currentQ.hints && (
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowHint(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-surface-400 hover:text-primary-400 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" /> Need a hint?
                </button>
              </div>
            )}
            {showHint && currentQ.hints && !showExplanation && (
              <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 animate-slide-up">
                <p className="text-sm text-primary-300">💡 Hint: {currentQ.hints[0]}</p>
              </div>
            )}

            {/* Answer Options / Input */}
            {currentQ.type === 'flashcard' ? (
               <div className="pt-8 flex justify-center">
                 {!showExplanation ? (
                   <button 
                     onClick={() => setShowExplanation(true)}
                     className="px-8 py-4 bg-surface-800 hover:bg-surface-700 border border-surface-600 rounded-xl text-surface-200 font-medium transition-colors"
                   >
                     Reveal Answer
                   </button>
                 ) : (
                   <div className="w-full text-center space-y-8 animate-fade-in">
                     <p className="text-lg text-emerald-400 font-medium">{currentQ.correctAnswer}</p>
                     <div className="flex gap-4 justify-center">
                       <button onClick={nextQuestion} className="px-6 py-2 bg-danger-500/20 text-danger-400 rounded-lg text-sm font-medium hover:bg-danger-500/30">Hard</button>
                       <button onClick={nextQuestion} className="px-6 py-2 bg-warning-500/20 text-warning-400 rounded-lg text-sm font-medium hover:bg-warning-500/30">Good</button>
                       <button onClick={nextQuestion} className="px-6 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30">Easy</button>
                     </div>
                   </div>
                 )}
               </div>
            ) : (
              <div className="space-y-3">
                {currentQ.options?.map((opt, i) => {
                  const isSelected = selectedAnswer === opt;
                  const isCorrectAnswer = opt === currentQ.correctAnswer;
                  
                  let stateClass = 'bg-surface-900 border-surface-800 text-surface-300 hover:border-surface-600';
                  
                  if (showExplanation) {
                    if (isCorrectAnswer) stateClass = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400';
                    else if (isSelected) stateClass = 'bg-danger-500/10 border-danger-500/50 text-danger-400';
                    else stateClass = 'bg-surface-900 border-surface-800 text-surface-500 opacity-50';
                  } else if (isSelected) {
                    stateClass = 'bg-primary-500/10 border-primary-500/50 text-primary-200';
                  }

                  return (
                    <button
                      key={i}
                      disabled={showExplanation}
                      onClick={() => handleAnswer(opt)}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center justify-between group ${stateClass}`}
                    >
                      <span className="font-medium">{opt}</span>
                      {showExplanation && isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Explanation & Action Panel */}
            {showExplanation && currentQ.type !== 'flashcard' && (
              <div className="pt-6 animate-slide-up space-y-6">
                <div className={`p-5 rounded-xl border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-danger-500/10 border-danger-500/20'}`}>
                  <h4 className={`text-sm font-bold mb-2 flex items-center gap-2 ${isCorrect ? 'text-emerald-400' : 'text-danger-400'}`}>
                    {isCorrect ? '✨ Correct!' : 'Incorrect'}
                  </h4>
                  <p className="text-sm leading-relaxed text-surface-300">{currentQ.explanation}</p>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    onClick={nextQuestion}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors"
                  >
                    Next Question <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {!showExplanation && currentQ.type !== 'flashcard' && selectedAnswer && (
              <div className="pt-6 flex justify-end animate-fade-in">
                <button 
                  onClick={checkAnswer}
                  className="flex items-center gap-2 px-8 py-3 bg-accent-600 hover:bg-accent-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-accent-500/20"
                >
                  Check Answer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Progress (Hidden on mobile) */}
      <div className="w-72 border-l border-surface-800 bg-surface-900/30 flex flex-col hidden xl:flex">
        <div className="p-6 border-b border-surface-800">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-accent-400" />
            <h3 className="text-xl font-bold text-surface-100">{activeSession.streak}</h3>
          </div>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Current Streak</p>
        </div>
        <div className="p-6 border-b border-surface-800">
          <h3 className="text-xl font-bold text-primary-400 mb-1">{activeSession.score}</h3>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Total Score</p>
        </div>
        <div className="p-6">
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-4">Topic Mastery</p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-surface-300">
                <span>Krebs Cycle</span>
                <span>30%</span>
              </div>
              <div className="w-full h-1 bg-surface-800 rounded-full"><div className="h-full bg-danger-400 rounded-full" style={{ width: '30%' }}/></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeCard({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="text-left bg-surface-900 border border-surface-800 rounded-2xl p-6 hover:bg-surface-800 hover:border-surface-600 transition-all group flex flex-col items-start gap-4"
    >
      <div className="w-12 h-12 rounded-xl bg-surface-800 group-hover:scale-110 transition-transform flex items-center justify-center border border-surface-700">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-surface-100 mb-1">{title}</h3>
        <p className="text-xs text-surface-400 leading-relaxed">{desc}</p>
      </div>
    </button>
  );
}
