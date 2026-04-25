import { useState, useRef, useCallback } from 'react';
import { aiAPI } from '../../api';
import {
  Upload, FileText, Loader2, CheckCircle2, Lock, Star,
  ChevronRight, RotateCcw, Trophy, Zap, Map, X, Sword, Skull, Gift
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface StoryQuestion {
  type: 'mcq' | 'open';
  text: string;
  options?: string[];
  correctAnswer?: string;
  explanation: string;
}

interface StoryNode {
  id: string;
  type: 'start' | 'concept' | 'quiz' | 'boss';
  title: string;
  description: string;
  unlocked: boolean;
  completed: boolean;
  xp: number;
  question: StoryQuestion | null;
}

interface StoryEdge { from: string; to: string; }

interface StoryMap { nodes: StoryNode[]; edges: StoryEdge[]; }

type Phase = 'upload' | 'processing' | 'map' | 'node';

// ── Node colours by type ───────────────────────────────────────────────────
const NODE_STYLE: Record<string, { border: string; glow: string; badge: string; icon: React.ReactNode }> = {
  start:   { border: '#3b82f6', glow: 'rgba(59,130,246,0.35)', badge: 'bg-blue-500',    icon: <Map className="w-5 h-5 text-blue-300" /> },
  concept: { border: '#a855f7', glow: 'rgba(168,85,247,0.35)',  badge: 'bg-purple-500',  icon: <FileText className="w-5 h-5 text-purple-300" /> },
  quiz:    { border: '#f59e0b', glow: 'rgba(245,158,11,0.35)',  badge: 'bg-amber-500',   icon: <Gift className="w-5 h-5 text-amber-300" /> },
  boss:    { border: '#ef4444', glow: 'rgba(239,68,68,0.35)',   badge: 'bg-red-500',     icon: <Skull className="w-5 h-5 text-red-300" /> },
};

// ── Processing dots animation ─────────────────────────────────────────────
function ProcessingDot({ delay }: { delay: number }) {
  return (
    <span
      className="w-2.5 h-2.5 rounded-full bg-primary-400 inline-block"
      style={{ animation: `bounce 1.2s ${delay}ms ease-in-out infinite` }}
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function StoryModePage() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; docId: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [storyMap, setStoryMap] = useState<StoryMap | null>(null);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [activeNode, setActiveNode] = useState<StoryNode | null>(null);
  const [totalXP, setTotalXP] = useState(0);
  const [filename, setFilename] = useState('');

  // Quiz state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<{ score: number; isCorrect: boolean; feedback: string } | null>(null);
  const [showResult, setShowResult] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Upload PDF ──────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await aiAPI.uploadPdf(file);
      setUploadedFile({ name: res.filename, docId: res.docId });
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Generate Story Map ──────────────────────────────────────────────────
  const createStory = async () => {
    if (!uploadedFile) return;
    setPhase('processing');
    setUploadError(null);
    try {
      const res = await aiAPI.generateStoryMap(uploadedFile.docId);
      const map: StoryMap = res.storyMap;
      
      // Safety: Force only the very first node to be unlocked, others locked
      const sanitizedNodes = map.nodes.map((node, i) => ({
        ...node,
        unlocked: i === 0,
        completed: false
      }));

      setStoryMap({ ...map, nodes: sanitizedNodes });
      setNodes(sanitizedNodes);
      setFilename(res.filename || uploadedFile.name);
      setPhase('map');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to generate story map');
      setPhase('upload');
    }
  };

  // ── Open node detail ────────────────────────────────────────────────────
  const openNode = (node: StoryNode) => {
    if (!node.unlocked) return;
    setActiveNode(node);
    setSelectedAnswer(null);
    setTypedAnswer('');
    setEvaluation(null);
    setShowResult(false);
    setPhase('node');
  };

  // ── Check quiz answer ───────────────────────────────────────────────────
  const checkAnswer = async () => {
    if (!activeNode?.question) return;

    if (activeNode.question.type === 'mcq') {
      if (!selectedAnswer) return;
      setShowResult(true);
    } else {
      if (!typedAnswer.trim()) return;
      setIsEvaluating(true);
      try {
        const result = await aiAPI.evaluateAnswer(uploadedFile?.docId || '', activeNode.question.text, typedAnswer);
        setEvaluation(result);
        setShowResult(true);
      } catch (err) {
        console.error('Evaluation error:', err);
      } finally {
        setIsEvaluating(false);
      }
    }
  };

  // ── Complete node and check for unlocks ──────────────────────────────────
  const completeNode = useCallback((nodeId: string) => {
    setNodes(prev => {
      // 1. Mark current node as completed
      const nextNodes = prev.map(n =>
        n.id === nodeId ? { ...n, completed: true } : n
      );

      // 2. Check every other node to see if it should be unlocked
      if (!storyMap) return nextNodes;

      return nextNodes.map(node => {
        // If already unlocked/completed, skip
        if (node.unlocked || node.completed) return node;

        // Find all nodes that lead to this node
        const parents = storyMap.edges
          .filter(e => e.to === node.id)
          .map(e => e.from);

        // If it has no parents, it should have been start (already handled)
        if (parents.length === 0) return node;

        // Check if ALL parents are completed in our 'nextNodes' array
        const allParentsDone = parents.every(pId => {
          const pNode = nextNodes.find(n => n.id === pId);
          return pNode && pNode.completed;
        });

        return allParentsDone ? { ...node, unlocked: true } : node;
      });
    });
  }, [storyMap]);


  // ── After answering, mark complete + go back to map ────────────────────
  const finishNode = () => {
    if (!activeNode) return;
    const xpGain = activeNode.xp ?? 50;
    if (!activeNode.completed) setTotalXP(p => p + xpGain);
    completeNode(activeNode.id);
    setActiveNode(null);
    setPhase('map');
  };

  // ── Layout helper: assign (x, y) grid positions ────────────────────────
  const getNodePosition = (index: number) => {
    if (!storyMap) return { x: 400, y: 100 };

    // Group nodes by levels (distance from start)
    const nodeLevels: Record<string, number> = {};
    const queue = [{ id: storyMap.nodes[0]?.id, level: 0 }];
    const visited = new Set();

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (!id || visited.has(id)) continue;
      visited.add(id);
      nodeLevels[id] = level;

      const children = storyMap.edges.filter(e => e.from === id).map(e => e.to);
      children.forEach(childId => queue.push({ id: childId, level: level + 1 }));
    }

    // Default level if not reached (orphan nodes)
    const node = storyMap.nodes[index];
    const level = nodeLevels[node.id] ?? index;

    // Get all nodes at this level to distribute them horizontally
    const nodesAtSameLevel = Object.entries(nodeLevels)
      .filter(([_, l]) => l === level)
      .map(([id, _]) => id);
    
    const levelIndex = nodesAtSameLevel.indexOf(node.id);
    const totalAtLevel = nodesAtSameLevel.length;

    const spacingY = 180;
    const spacingX = 200;
    const width = 800;

    // Distribute horizontally centered
    const x = (width / 2) + (levelIndex - (totalAtLevel - 1) / 2) * spacingX;
    const y = 100 + (level * spacingY);

    return { x, y };
  };

  const completedCount = nodes.filter(n => n.completed).length;
  const allDone = nodes.length > 0 && completedCount === nodes.length;

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: UPLOAD
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'upload') {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-surface-950 flex items-center justify-center p-6">
        <div className="w-full max-w-lg animate-fade-in">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
              <Map className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-surface-50">Story Mode</h1>
            <p className="text-surface-400 mt-2 text-sm leading-relaxed">
              Upload your study notes and AI will turn them into an<br />
              interactive treasure hunt learning path.
            </p>
          </div>

          {/* Upload card */}
          <div
            onClick={() => !uploadedFile && fileInputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-4 transition-all cursor-pointer
              ${uploadedFile
                ? 'border-emerald-500/50 bg-emerald-500/5 cursor-default'
                : 'border-surface-700 hover:border-primary-500/60 hover:bg-primary-500/5'}`}
          >
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
                <p className="text-surface-300 font-medium">Processing PDF...</p>
              </>
            ) : uploadedFile ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-surface-100 font-semibold">{uploadedFile.name}</p>
                  <p className="text-emerald-400 text-sm mt-1 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Ready to create story
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setUploadedFile(null); }}
                  className="text-xs text-surface-500 hover:text-surface-300 transition-colors"
                >
                  Remove and upload different file
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-surface-400" />
                </div>
                <div className="text-center">
                  <p className="text-surface-200 font-medium">Click to upload PDF</p>
                  <p className="text-surface-500 text-sm mt-1">Study notes, textbook chapters, lecture slides</p>
                </div>
              </>
            )}
          </div>

          {uploadError && (
            <div className="mt-4 p-3 bg-danger-500/10 border border-danger-500/20 rounded-xl text-sm text-danger-400">
              {uploadError}
            </div>
          )}

          {uploadedFile && (
            <button
              onClick={createStory}
              className="mt-6 w-full py-4 bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-500 hover:to-emerald-500 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 text-base"
            >
              <Map className="w-5 h-5" />
              Create Story Map
            </button>
          )}

          {!uploadedFile && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 w-full py-4 bg-surface-800 hover:bg-surface-700 text-surface-200 font-medium rounded-2xl transition-colors border border-surface-700 flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Select PDF
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: PROCESSING
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'processing') {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-surface-950 flex items-center justify-center p-6">
        <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)} }`}</style>
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-600 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-500/30">
            <Map className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-surface-50 mb-2">Generating Your Map</h2>
          <p className="text-surface-400 text-sm mb-8">AI is analyzing your notes and building the treasure hunt...</p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <ProcessingDot delay={0} />
            <ProcessingDot delay={200} />
            <ProcessingDot delay={400} />
          </div>
          <div className="space-y-3 text-left max-w-xs mx-auto">
            {['Extracting key concepts...', 'Building learning path...', 'Crafting quiz challenges...'].map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-surface-900 border border-surface-800 rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 text-primary-400 animate-spin shrink-0" />
                <span className="text-sm text-surface-300">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: MAP
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'map') {
    return (
      <div className="relative flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#0a0a0a]">
        {/* Grid Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        {/* Top Header Overlay */}
        <div className="relative z-20 p-6 bg-gradient-to-b from-[#0a0a0a] to-transparent flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Map className="w-6 h-6 text-primary-400" />
              Treasure Hunt: {filename}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="h-1.5 w-48 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-1000"
                  style={{ width: `${(completedCount / Math.max(nodes.length, 1)) * 100}%` }}
                />
              </div>
              <span className="text-xs text-white/40">{completedCount}/{nodes.length} Challenges</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/5 border border-white/10 rounded-full px-5 py-2 flex items-center gap-2 shadow-xl backdrop-blur-md">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-bold">{totalXP} XP</span>
            </div>
            <button
              onClick={() => { setPhase('upload'); setNodes([]); setStoryMap(null); setTotalXP(0); setUploadedFile(null); }}
              className="p-2.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Graph Map Area */}
        <div className="flex-1 overflow-auto relative custom-scrollbar scroll-smooth bg-transparent">
          <div className="relative min-h-[2500px] py-20 mx-auto" style={{ width: '800px' }}>
            
            {/* SVG Connections Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              {storyMap?.edges.map((edge, i) => {
                const fromNodeIdx = nodes.findIndex(n => n.id === edge.from);
                const toNodeIdx = nodes.findIndex(n => n.id === edge.to);
                if (fromNodeIdx === -1 || toNodeIdx === -1) return null;
                
                const start = getNodePosition(fromNodeIdx);
                const end = getNodePosition(toNodeIdx);
                
                // Curve calculation (Bezier)
                const midY = (start.y + end.y) / 2;
                const pathData = `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`;
                
                const isPathActive = nodes[fromNodeIdx].completed;
                const isPathVisible = nodes[fromNodeIdx].completed;
                
                if (!isPathVisible) return null;

                return (
                  <path
                    key={`${edge.from}-${edge.to}`}
                    d={pathData}
                    fill="none"
                    stroke={isPathActive ? "url(#lineGrad)" : "rgba(255,255,255,0.15)"}
                    strokeWidth="3"
                    strokeDasharray={isPathActive ? "none" : "8 5"}
                    className="transition-all duration-1000"
                  />
                );
              })}
            </svg>

            {/* Nodes Layer */}
            {nodes.map((node, i) => {
              const pos = getNodePosition(i);
              const style = NODE_STYLE[node.type] || NODE_STYLE.concept;
              const isLocked = !node.unlocked;
              
              return (
                <div
                  key={node.id}
                  style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
                  className="absolute z-10 group"
                >
                  {/* Pulse Effect for current node */}
                  {node.unlocked && !node.completed && (
                    <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: style.border }} />
                  )}

                  <button
                    onClick={() => openNode(node)}
                    disabled={isLocked}
                    className={`
                      relative flex flex-col items-center gap-3 transition-all duration-300
                      ${isLocked ? 'grayscale opacity-30 cursor-not-allowed scale-90' : 'hover:scale-110'}
                    `}
                  >
                    {/* Node Shape */}
                    <div 
                      className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center border-2 shadow-2xl backdrop-blur-xl transition-all
                        ${node.completed ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/10'}
                      `}
                      style={node.unlocked && !node.completed ? { borderColor: style.border, boxShadow: `0 0 25px ${style.glow}` } : {}}
                    >
                      {node.completed ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      ) : node.type === 'boss' ? (
                        <Skull className="w-9 h-9 text-red-400" />
                      ) : node.type === 'quiz' ? (
                        <Gift className="w-8 h-8 text-amber-400" />
                      ) : node.type === 'start' ? (
                        <Map className="w-8 h-8 text-blue-400" />
                      ) : (
                        <FileText className="w-8 h-8 text-purple-400" />
                      )}
                    </div>

                    {/* Label */}
                    <div className="absolute top-full mt-2 w-32 text-center pointer-events-none">
                      <p className={`text-xs font-bold uppercase tracking-widest transition-colors ${isLocked ? 'text-white/20' : 'text-white/80'}`}>
                        {node.title}
                      </p>
                      {node.completed && (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Completed</span>
                      )}
                      {!isLocked && !node.completed && (
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">{node.xp} XP</span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE: NODE DETAIL
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'node' && activeNode) {
    const style = NODE_STYLE[activeNode.type] || NODE_STYLE.concept;
    const hasQuestion = !!activeNode.question;
    const isMcq = activeNode.question?.type === 'mcq';
    const isCorrect = isMcq 
      ? (selectedAnswer === activeNode.question?.correctAnswer)
      : (evaluation?.isCorrect ?? false);

    return (
      <div className="min-h-[calc(100vh-64px)] bg-surface-950 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl animate-fade-in">
          {/* Back */}
          <button
            onClick={() => { setActiveNode(null); setPhase('map'); }}
            className="flex items-center gap-2 text-surface-400 hover:text-surface-200 mb-6 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" /> Back to Map
          </button>

          {/* Node card */}
          <div
            className="rounded-3xl border bg-surface-900 p-8 shadow-2xl mb-6 overflow-hidden relative"
            style={{ borderColor: style.border, boxShadow: `0 0 40px ${style.glow}` }}
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-10 -mt-10 opacity-20" style={{ backgroundColor: style.border }} />

            {/* Type badge */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center">
                {style.icon}
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${style.badge} bg-opacity-20 text-surface-200`}>
                  {activeNode.type}
                </span>
                <p className="text-amber-400 text-xs font-semibold mt-1 flex items-center gap-1">
                  <Star className="w-3 h-3" /> {activeNode.xp ?? 50} XP reward
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-surface-50 mb-3">{activeNode.title}</h2>
            <p className="text-surface-300 text-sm leading-relaxed mb-6">{activeNode.description}</p>

            {/* Quiz section */}
            {hasQuestion && activeNode.question && (
              <div className="border-t border-surface-800 pt-6">
                <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-3">Challenge Question</p>
                <p className="text-surface-100 font-medium mb-5 text-base leading-snug">{activeNode.question.text}</p>

                {isMcq ? (
                  <div className="space-y-3">
                    {activeNode.question.options?.map((opt, i) => {
                      const isSelected = selectedAnswer === opt;
                      const isCorrectOpt = opt === activeNode.question!.correctAnswer;
                      let cls = 'bg-surface-800 border-surface-700 text-surface-300 hover:border-surface-500';
                      if (showResult) {
                        if (isCorrectOpt) cls = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300';
                        else if (isSelected) cls = 'bg-danger-500/10 border-danger-500/50 text-danger-400';
                        else cls = 'bg-surface-800 border-surface-800 text-surface-600 opacity-50';
                      } else if (isSelected) {
                        cls = 'bg-primary-500/10 border-primary-500/50 text-primary-200';
                      }
                      return (
                        <button
                          key={i}
                          disabled={showResult}
                          onClick={() => setSelectedAnswer(opt)}
                          className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all flex items-center justify-between text-sm font-medium ${cls}`}
                        >
                          <span>{opt}</span>
                          {showResult && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          {showResult && isSelected && !isCorrectOpt && <X className="w-4 h-4 text-danger-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      disabled={showResult || isEvaluating}
                      placeholder="Type your detailed answer here..."
                      className="w-full h-32 bg-surface-800 border border-surface-700 rounded-xl p-4 text-surface-100 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all outline-none resize-none placeholder:text-surface-600"
                    />
                    
                    {!showResult && (
                      <button
                        onClick={checkAnswer}
                        disabled={isEvaluating || !typedAnswer.trim()}
                        className="w-full py-3.5 bg-surface-700 hover:bg-surface-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {isEvaluating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            AI is evaluating...
                          </>
                        ) : (
                          <>Submit Answer</>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {showResult && (
                  <div className={`mt-5 p-5 rounded-2xl border animate-slide-up ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-danger-500/10 border-danger-500/20'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-bold ${isCorrect ? 'text-emerald-400' : 'text-danger-400'}`}>
                        {isCorrect ? 'Great Job!' : 'Room for Improvement'}
                      </p>
                      {!isMcq && evaluation && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${evaluation.score >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          Score: {evaluation.score}%
                        </span>
                      )}
                    </div>
                    <p className="text-surface-300 text-sm leading-relaxed">
                      {isMcq ? activeNode.question.explanation : evaluation?.feedback}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {(!hasQuestion || showResult) && (
            <button
              onClick={() => {
                if (hasQuestion && !isCorrect) {
                  setShowResult(false);
                  setEvaluation(null);
                  setTypedAnswer('');
                } else {
                  finishNode();
                }
              }}
              className={`w-full py-4 font-semibold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2
                ${(!hasQuestion || isCorrect) 
                  ? 'bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-500 hover:to-emerald-500 text-white' 
                  : 'bg-danger-500 hover:bg-danger-400 text-white'}`}
            >
              <CheckCircle2 className="w-5 h-5" /> 
              {(!hasQuestion || isCorrect) ? 'Complete & Continue' : 'Retry Challenge'}
            </button>
          )}

          {hasQuestion && !showResult && (
            <button
              onClick={checkAnswer}
              disabled={!selectedAnswer}
              className="w-full py-4 bg-accent-600 hover:bg-accent-500 disabled:opacity-40 text-white font-semibold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Check Answer
            </button>
          )}

          {hasQuestion && showResult && (
            <button
              onClick={finishNode}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-emerald-600 hover:from-primary-500 hover:to-emerald-500 text-white font-semibold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <ChevronRight className="w-5 h-5" />
              {isCorrect ? `Claim ${activeNode.xp ?? 50} XP & Continue` : 'Continue Anyway'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
