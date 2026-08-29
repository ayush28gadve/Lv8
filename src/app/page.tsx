'use client';

import React, { useState, useEffect } from 'react';
import { getAllConcepts } from '@/data/concepts';
import { getProblemsByConcept } from '@/data/problems';
import type { ConceptId, PhysicsConcept } from '@/types/physics';
import type { SessionApiResponse, SessionApiResult, ApiTwinProblem, SessionApiError, HandwritingAnalysisResult } from '@/lib/api/types';

// Progressive loader simulation texts
const LOADER_TEXTS = [
  'Parsing step-by-step mathematical reasoning...',
  'Isolating physical invariants and coordinate systems...',
  'Analyzing potential conceptual misconceptions...',
  'Shaping custom conceptual transfer challenge...',
];

// The list of concepts in order of prerequisites
const CONCEPT_ORDER: ConceptId[] = [
  'fbd-force-identification',
  'newtons-second-law',
  'friction-direction',
  'inclined-plane',
  'connected-bodies-pulleys',
];

export default function Home() {
  const concepts = getAllConcepts();

  // State management
  const [selectedConceptId, setSelectedConceptId] = useState<ConceptId>('fbd-force-identification');
  const [selectedProblemIndex, setSelectedProblemIndex] = useState<number>(0); // index 0 (easy), index 1 (medium/hard)
  const [working, setWorking] = useState<string>('');
  const [finalAnswer, setFinalAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Student Onboarding States
  const [onboarded, setOnboarded] = useState<boolean>(false);
  const [studentInfo, setStudentInfo] = useState<{
    name: string;
    classLevel: '11' | '12';
    exam: 'JEE' | 'NEET' | 'Board';
    subject: string;
    chapter: string;
  } | null>(null);

  // Temporary Onboarding Form States
  const [onboardingName, setOnboardingName] = useState<string>('');
  const [onboardingClass, setOnboardingClass] = useState<'11' | '12'>('11');
  const [onboardingExam, setOnboardingExam] = useState<'JEE' | 'NEET' | 'Board'>('JEE');
  const [onboardingConcept, setOnboardingConcept] = useState<ConceptId>('fbd-force-identification');

  // Vision / Handwriting Submission States
  const [submissionType, setSubmissionType] = useState<'text' | 'image'>('text');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);
  const [extractionResult, setExtractionResult] = useState<HandwritingAnalysisResult | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Session & Progress tracking
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [masteredConcepts, setMasteredConcepts] = useState<Set<ConceptId>>(new Set());
  const [remediationConcepts, setRemediationConcepts] = useState<Set<ConceptId>>(new Set());

  // Active state results
  const [apiResult, setApiResult] = useState<SessionApiResponse | null>(null);
  const [activeStage, setActiveStage] = useState<'seed' | 'twin'>('seed');
  const [activeTwin, setActiveTwin] = useState<ApiTwinProblem | null>(null);

  // Progressive loader simulation state
  const [loaderStep, setLoaderStep] = useState<number>(0);

  // Loader interval simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting) {
      interval = setInterval(() => {
        setLoaderStep((prev) => (prev < LOADER_TEXTS.length - 1 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isSubmitting]);

  // Derived variables
  const currentConcept = concepts.find((c) => c.conceptId === selectedConceptId) as PhysicsConcept;
  const conceptProblems = getProblemsByConcept(selectedConceptId);
  const currentProblem = conceptProblems[selectedProblemIndex] || conceptProblems[0];

  // Helper to determine the concept node status
  const getConceptStatus = (conceptId: ConceptId) => {
    if (masteredConcepts.has(conceptId)) return 'mastered';
    if (remediationConcepts.has(conceptId)) return 'remediation';
    if (selectedConceptId === conceptId) return 'active';

    const index = CONCEPT_ORDER.indexOf(conceptId);
    if (index === 0) return 'unlocked';

    // Unlocked if previous is mastered
    const prevConcept = CONCEPT_ORDER[index - 1];
    if (masteredConcepts.has(prevConcept)) return 'unlocked';

    return 'locked';
  };

  // Change concept selection
  const handleConceptSelect = (conceptId: ConceptId) => {
    const status = getConceptStatus(conceptId);
    if (status === 'locked') return;

    setSelectedConceptId(conceptId);
    setSelectedProblemIndex(0);
    resetWorkspace();
  };

  const resetWorkspace = () => {
    setWorking('');
    setFinalAnswer('');
    setError(null);
    setApiResult(null);
    setActiveStage('seed');
    setActiveTwin(null);
    // Reset Vision states
    setImageFile(null);
    setImageBase64(null);
    setExtractionResult(null);
    setExtractionError(null);
  };

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingName.trim()) {
      setError('Please enter your name to begin.');
      return;
    }

    setStudentInfo({
      name: onboardingName,
      classLevel: onboardingClass,
      exam: onboardingExam,
      subject: 'Physics',
      chapter: "Newton's Laws & Friction",
    });
    setSelectedConceptId(onboardingConcept);
    setSelectedProblemIndex(0);
    setOnboarded(true);
    resetWorkspace();
  };

  const getStepStatus = (step: string): 'locked' | 'pending' | 'active' | 'completed' | 'bypassed' => {
    const hasMastered = masteredConcepts.has(selectedConceptId);
    const hasAttemptedSeed = apiResult !== null;
    const isTwin = activeStage === 'twin';
    const isEvaluating = isSubmitting;

    switch (step) {
      case 'PYQ':
        return hasAttemptedSeed || isTwin ? 'completed' : 'active';
      case 'Solution':
        return hasAttemptedSeed || isTwin ? 'completed' : 'active';
      case 'Eval':
        if (isEvaluating) return 'active';
        return hasAttemptedSeed ? 'completed' : 'pending';
      case 'Gap':
        if (hasMastered && !isTwin && apiResult?.nextAction === 'mastered') return 'bypassed';
        if (isTwin) return 'completed';
        if (apiResult?.nextAction === 'show_twin') return 'active';
        return 'pending';
      case 'Twin':
        if (hasMastered && !isTwin && apiResult?.nextAction === 'mastered') return 'bypassed';
        if (isTwin && hasAttemptedSeed) return 'completed';
        if (isTwin || apiResult?.nextAction === 'show_twin') return 'active';
        return 'locked';
      case 'Transfer':
        if (hasMastered && !isTwin && apiResult?.nextAction === 'mastered') return 'bypassed';
        if (hasMastered && isTwin) return 'completed';
        if (isTwin) return 'active';
        return 'locked';
      case 'Mastery':
        if (hasMastered) return 'completed';
        if (remediationConcepts.has(selectedConceptId)) return 'pending';
        return 'locked';
      default:
        return 'pending';
    }
  };

  // Image Upload / Selection Handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    setImageFile(file);
    setExtractionResult(null);
    setExtractionError(null);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  // call API to analyze solution image
  const runImageAnalysis = async () => {
    if (!imageBase64 || !imageFile) return;

    setIsAnalyzingImage(true);
    setExtractionResult(null);
    setExtractionError(null);
    setError(null);

    const activeQuestion = activeStage === 'seed' ? currentProblem.question : activeTwin?.question ?? '';

    try {
      const res = await fetch('/api/analyze-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          mimeType: imageFile.type,
          question: activeQuestion,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to extract handwriting details.');
      }

      setExtractionResult(data.data);
      if (!data.data.isImageUnclear) {
        // Automatically populate workspace inputs
        setWorking(data.data.extractedWorking);
        setFinalAnswer(String(data.data.extractedFinalAnswer));
      }
    } catch (err) {
      setExtractionError(err instanceof Error ? err.message : 'Something went wrong during vision analysis.');
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Submit attempt
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Perform vision validation before normal checks if image tab is selected
    if (submissionType === 'image') {
      if (!imageFile) {
        setError('Please upload an image of your handwritten solution.');
        return;
      }
      if (!extractionResult) {
        setError('Please extract your handwritten solution using Gemini Vision before submitting.');
        return;
      }
      if (extractionResult.isImageUnclear) {
        setError('Cannot submit: The uploaded image is unclear. Please upload a clearer solution image.');
        return;
      }
    }

    if (!working.trim() || !finalAnswer.trim()) {
      setError('Please provide both step-by-step working and a final answer.');
      return;
    }

    setLoaderStep(0);
    setIsSubmitting(true);
    setError(null);

    try {
      const isTwinStage = activeStage === 'twin';
      const parsedAnswer = parseFloat(finalAnswer);

      const basePayload = {
        working,
        finalAnswer: isNaN(parsedAnswer) ? finalAnswer : parsedAnswer,
        sessionId: sessionId ?? undefined,
        ...(submissionType === 'image' && imageBase64 ? { image: imageBase64 } : {}),
      };

      const payload = isTwinStage
        ? {
            stage: 'twin' as const,
            twinId: activeTwin?.twinId ?? '',
            problemId: currentProblem.problemId,
            twinProblem: activeTwin,
            ...basePayload,
          }
        : {
            stage: 'seed' as const,
            problemId: currentProblem.problemId,
            ...basePayload,
          };

      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as SessionApiResult;

      if (!res.ok || !data.ok) {
        throw new Error(
          (data as SessionApiError).error || 'An error occurred during evaluation.'
        );
      }

      const response = data as SessionApiResponse;
      setApiResult(response);
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }

      // Handle outcomes
      if (response.nextAction === 'mastered' || response.nextAction === 'twin_accepted') {
        const updatedMastered = new Set(masteredConcepts);
        updatedMastered.add(selectedConceptId);
        setMasteredConcepts(updatedMastered);

        // Remove from remediation if it was there
        const updatedRemediation = new Set(remediationConcepts);
        updatedRemediation.delete(selectedConceptId);
        setRemediationConcepts(updatedRemediation);
      } else if (response.nextAction === 'remediation') {
        const updatedRemediation = new Set(remediationConcepts);
        updatedRemediation.add(selectedConceptId);
        setRemediationConcepts(updatedRemediation);
      } else if (response.nextAction === 'show_twin' && response.twin) {
        setActiveTwin(response.twin);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transition to twin challenge view
  const acceptTwinChallenge = () => {
    if (!activeTwin) return;
    setActiveStage('twin');
    setWorking('');
    setFinalAnswer('');
    setError(null);
    setApiResult(null);
    // Clear image status for the twin challenge step
    setImageFile(null);
    setImageBase64(null);
    setExtractionResult(null);
    setExtractionError(null);
  };

  // Skip / reset after mastery
  const proceedToNextConcept = () => {
    const currentIndex = CONCEPT_ORDER.indexOf(selectedConceptId);
    if (currentIndex < CONCEPT_ORDER.length - 1) {
      const nextConcept = CONCEPT_ORDER[currentIndex + 1];
      setSelectedConceptId(nextConcept);
      setSelectedProblemIndex(0);
      resetWorkspace();
    }
  };

  if (!onboarded) {
    return (
      <div className="min-h-screen w-screen bg-[#09090b] flex items-center justify-center p-6 relative overflow-hidden font-sans text-zinc-100 selection:bg-violet-500/30">
        {/* Ambient radial lighting for high-quality aesthetics */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="bg-[#0c0c0e]/80 border border-zinc-800 backdrop-blur-md rounded-2xl p-8 max-w-lg w-full space-y-6 shadow-2xl relative z-10">
          <div className="flex flex-col items-center text-center space-y-2">
            <span className="text-3xl">✨</span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-2">Welcome to ConceptTwin</h1>
            <p className="text-xs text-zinc-400 max-w-xs">
              Establish deep, adaptive conceptual mastery in mechanics and solve conceptual transfer challenges.
            </p>
          </div>

          <form onSubmit={handleOnboardingSubmit} className="space-y-5">
            {/* Student Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Your Name</label>
              <input
                type="text"
                required
                value={onboardingName}
                onChange={(e) => setOnboardingName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-[#121215] border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/80 transition"
              />
            </div>

            {/* Class & Exam Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Class Level</label>
                <div className="grid grid-cols-2 bg-[#121215] p-1 rounded-lg border border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setOnboardingClass('11')}
                    className={`py-2 text-xs font-semibold rounded transition-all cursor-pointer ${
                      onboardingClass === '11'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Class 11
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingClass('12')}
                    className={`py-2 text-xs font-semibold rounded transition-all cursor-pointer ${
                      onboardingClass === '12'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Class 12
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Target Exam</label>
                <div className="grid grid-cols-3 bg-[#121215] p-1 rounded-lg border border-zinc-800/80">
                  {(['JEE', 'NEET', 'Board'] as const).map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setOnboardingExam(ex)}
                      className={`py-2 text-xs font-semibold rounded transition-all cursor-pointer ${
                        onboardingExam === ex
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Subject & Chapter */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Subject</label>
                <div className="w-full bg-[#121215]/50 border border-zinc-800/40 text-zinc-505 rounded-lg p-3 text-xs font-semibold cursor-not-allowed">
                  Physics (Mechanics)
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Chapter</label>
                <div className="w-full bg-[#121215]/50 border border-zinc-800/40 text-zinc-505 rounded-lg p-3 text-xs font-semibold truncate cursor-not-allowed">
                  {"Newton's Laws & Friction"}
                </div>
              </div>
            </div>

            {/* Concept Selector Grid */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Select Target Concept</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {getAllConcepts().map((concept) => (
                  <button
                    key={concept.conceptId}
                    type="button"
                    onClick={() => setOnboardingConcept(concept.conceptId)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition flex flex-col space-y-1 cursor-pointer ${
                      onboardingConcept === concept.conceptId
                        ? 'border-violet-500 bg-violet-950/10'
                        : 'border-zinc-800 bg-[#121215] hover:border-zinc-700/60'
                    }`}
                  >
                    <span className={`font-semibold ${onboardingConcept === concept.conceptId ? 'text-violet-400' : 'text-zinc-200'}`}>
                      {concept.name}
                    </span>
                    <span className="text-[10px] text-zinc-450 truncate max-w-sm">{concept.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-3 rounded-lg text-xs leading-relaxed">
                {error}
              </div>
            )}

            {/* Begin Button */}
            <button
              type="submit"
              className="w-full bg-violet-650 hover:bg-violet-600 text-white font-bold py-3 rounded-lg text-xs transition shadow-lg cursor-pointer"
            >
              LAUNCH LEARNING WORKSPACE
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] font-sans text-zinc-100 selection:bg-violet-500/30">
      {/* Sidebar: Concept Map */}
      <aside className="w-80 flex-shrink-0 border-r border-zinc-800 bg-[#0c0c0e] flex flex-col">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs tracking-wider uppercase font-semibold text-zinc-500">Hackathon MVP</span>
            <span className="text-xl font-bold tracking-tight text-white mt-1">ConceptTwin</span>
          </div>
          <span className="text-xs bg-zinc-800/80 px-2.5 py-1 rounded-full text-zinc-300 border border-zinc-700/50">
            {masteredConcepts.size}/{concepts.length} Mastered
          </span>
        </div>

        {/* subway-line Concept Navigation */}
        <nav className="flex-1 overflow-y-auto px-6 py-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-6">Concept Pathway</h2>
          <div className="relative pl-6 border-l border-zinc-800/80 space-y-8">
            {CONCEPT_ORDER.map((cid, i) => {
              const concept = concepts.find((c) => c.conceptId === cid);
              if (!concept) return null;

              const status = getConceptStatus(cid);
              const isActive = selectedConceptId === cid;

              return (
                <div key={cid} className="relative group">
                  {/* subway connector node */}
                  <div
                    className={`absolute -left-[31px] top-1.5 w-[11px] h-[11px] rounded-full border-2 transition-all duration-300 ${
                      status === 'mastered'
                        ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : status === 'remediation'
                          ? 'bg-amber-500 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : status === 'active'
                            ? 'bg-[#09090b] border-violet-500 scale-125 shadow-[0_0_12px_rgba(139,92,246,0.5)] animate-pulse'
                            : status === 'unlocked'
                              ? 'bg-[#09090b] border-zinc-600'
                              : 'bg-zinc-800 border-zinc-800'
                    }`}
                  />

                  <button
                    disabled={status === 'locked'}
                    onClick={() => handleConceptSelect(cid)}
                    className={`w-full text-left flex flex-col transition-all ${
                      status === 'locked' ? 'opacity-40 cursor-not-allowed' : 'hover:translate-x-1'
                    }`}
                  >
                    <span className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                      0{i + 1} — {status.toUpperCase()}
                    </span>
                    <span
                      className={`text-sm font-semibold tracking-tight mt-0.5 ${
                        isActive ? 'text-violet-400' : 'text-zinc-300 group-hover:text-white'
                      }`}
                    >
                      {concept.name}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* Main Grid Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header Bar with Profile & Visual Stepper */}
        <header className="bg-[#0b0b0c] border-b border-zinc-800 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 z-20 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-base font-bold tracking-tight text-white">Learning Pathway</span>
            {studentInfo && (
              <div className="flex items-center space-x-2 bg-zinc-900/60 px-3 py-1 rounded-full border border-zinc-800 text-[11px] text-zinc-400">
                <span className="font-semibold text-zinc-350">{studentInfo.name}</span>
                <span className="text-zinc-650">•</span>
                <span>Class {studentInfo.classLevel}</span>
                <span className="text-zinc-650">•</span>
                <span className="text-violet-400 font-bold uppercase">{studentInfo.exam}</span>
              </div>
            )}
            <button
              onClick={() => setOnboarded(false)}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 transition underline cursor-pointer"
            >
              Change Target
            </button>
          </div>

          {/* Stepper Progression */}
          <div className="flex items-center space-x-2 md:space-x-3 overflow-x-auto pb-1 lg:pb-0">
            {(['PYQ', 'Solution', 'Eval', 'Gap', 'Twin', 'Transfer', 'Mastery'] as const).map((step, idx) => {
              const status = getStepStatus(step);
              const label =
                step === 'Solution' ? 'Solution' :
                step === 'Eval' ? 'AI Evaluation' :
                step === 'Gap' ? 'Concept Gap' :
                step === 'Twin' ? 'ConceptTwin' :
                step === 'Transfer' ? 'Transfer Test' :
                step === 'Mastery' ? 'Mastery' : 'PYQ';

              return (
                <div key={step} className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                  {idx > 0 && <span className="text-zinc-700 text-xs">→</span>}
                  <div
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase transition-all duration-300 ${
                      status === 'completed'
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                        : status === 'active'
                          ? 'bg-violet-950/20 border-violet-500 text-violet-400 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.2)]'
                          : status === 'bypassed'
                            ? 'border-zinc-800 border-dashed text-zinc-500 bg-zinc-950/10'
                            : 'border-zinc-850 text-zinc-600 bg-zinc-950/5'
                    }`}
                  >
                    <span>
                      {status === 'completed' ? '✓' :
                       status === 'bypassed' ? '—' :
                       status === 'locked' ? '🔒' : (idx + 1)}
                    </span>
                    <span>{label}</span>
                    {status === 'bypassed' && <span className="text-[8px] bg-zinc-800 px-1 rounded text-zinc-500">Bypassed</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </header>

        {/* Main Content Workspace Split Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Problem Statement & Physics context */}
          <section className="w-[45%] flex-shrink-0 border-r border-zinc-800 bg-[#0b0b0c] flex flex-col overflow-y-auto">
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Concept Module</span>
                <h1 className="text-sm font-bold tracking-tight text-white mt-1 uppercase max-w-xs truncate">
                  {currentConcept.name}
                </h1>
              </div>
              <span className="text-[10px] bg-zinc-800/80 px-2.5 py-1 rounded text-zinc-350 border border-zinc-700/50 uppercase font-semibold">
                Problem Set
              </span>
            </div>

            <div className="p-8 flex-1 space-y-6">
              {/* CARD 1: Diagnostic PYQ */}
              <div className={`rounded-xl border p-6 space-y-4 transition ${
                activeStage === 'seed'
                  ? 'bg-zinc-900/10 border-violet-850/50 shadow-[0_0_12px_rgba(139,92,246,0.05)]'
                  : 'bg-zinc-950/20 border-zinc-850 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-950/30 border border-violet-900/50 px-2 py-0.5 rounded">
                      Diagnostic PYQ
                    </span>
                    {currentProblem.pyqMetadata && (
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {currentProblem.pyqMetadata.exam} ({currentProblem.pyqMetadata.year})
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                    activeStage === 'seed' ? 'text-violet-400' : 'text-zinc-500'
                  }`}>
                    {activeStage === 'seed' ? '● ACTIVE' : '✓ SOLVED'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Problem Statement</span>
                    <span className="text-[10px] bg-zinc-850 px-2 py-0.5 rounded text-zinc-400 font-mono capitalize">
                      {currentProblem.difficulty}
                    </span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-zinc-200">
                    {currentProblem.question}
                  </p>
                </div>
              </div>

              {/* CARD 2: ConceptTwin Challenge */}
              <div className={`rounded-xl border p-6 space-y-4 relative overflow-hidden transition ${
                activeStage === 'twin'
                  ? 'bg-zinc-900/10 border-amber-850/50 shadow-[0_0_12px_rgba(245,158,11,0.05)]'
                  : apiResult?.nextAction === 'show_twin'
                    ? 'border-amber-850/30 bg-[#0c0c0e]/30'
                    : 'border-zinc-850 bg-zinc-950/20 opacity-55'
              }`}>
                {/* Lock Overlay if locked */}
                {activeStage === 'seed' && apiResult?.nextAction !== 'show_twin' && (
                  <div className="absolute inset-0 bg-[#0c0c0e]/90 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                    <span className="text-2xl animate-bounce">🔒</span>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ConceptTwin Locked</span>
                      <p className="text-[11px] leading-relaxed text-zinc-500 max-w-xs mx-auto">
                        Unlocks dynamically if the AI evaluator detects a surface pattern-matching approach on the PYQ solution.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/30 border border-amber-900/50 px-2 py-0.5 rounded">
                    ConceptTwin Challenge
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                    activeStage === 'twin' ? 'text-amber-400' : 'text-zinc-500'
                  }`}>
                    {activeStage === 'twin' ? '● ACTIVE' : apiResult?.nextAction === 'twin_accepted' ? '✓ VERIFIED' : 'PENDING'}
                  </span>
                </div>

                {activeTwin && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">Deep Transfer Task</span>
                        <span className="text-[10px] bg-zinc-850 px-2 py-0.5 rounded text-zinc-400 font-mono capitalize">
                          {activeTwin.difficulty}
                        </span>
                      </div>
                      <p className="text-[14px] leading-relaxed text-zinc-200">
                        {activeTwin.question}
                      </p>
                    </div>

                    <div className="bg-amber-950/10 border border-amber-900/30 rounded-lg p-4 space-y-2">
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">AI Twin Rationale</span>
                      <p className="text-[11px] leading-relaxed text-amber-200/80">
                        {activeTwin.twinRationale}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Collapsed Equations Accordion */}
              <div className="border border-zinc-800/80 rounded-lg overflow-hidden">
                <details className="group">
                  <summary className="p-4 bg-zinc-900/40 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center justify-between cursor-pointer hover:bg-zinc-900/60 select-none">
                    <span>Reference Governing Equations</span>
                    <span className="transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="p-5 bg-zinc-950/20 border-t border-zinc-800/80 space-y-4 font-mono text-xs">
                    {currentConcept.coreEquations.map((eq) => (
                      <div key={eq.id} className="p-3 bg-zinc-900/30 rounded border border-zinc-850">
                        <div className="flex justify-between items-center text-zinc-300 font-bold mb-1">
                          <span>{eq.label}</span>
                          <span className="text-violet-400 font-sans">{eq.latex}</span>
                        </div>
                        <p className="text-zinc-500 font-sans">{eq.explanation}</p>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </section>

          {/* Right Panel: Student Workspace */}
          <section className="flex-1 bg-[#09090b] flex flex-col overflow-y-auto">
            <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">STUDENT WORKSPACE</span>
                <h2 className="text-lg font-bold tracking-tight text-white mt-1">Submit Derivation</h2>
              </div>

              {/* Tab Selector for input modes */}
              {!apiResult && (
                <div className="flex bg-zinc-900/80 p-1 rounded-lg border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setSubmissionType('text')}
                    className={`text-xs px-3.5 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                      submissionType === 'text'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Type Solution
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionType('image')}
                    className={`text-xs px-3.5 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                      submissionType === 'image'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Upload Image
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-8 flex-1 flex flex-col space-y-6">
              {submissionType === 'text' ? (
                /* Working Textarea */
                <div className="flex-1 flex flex-col space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    Write your step-by-step working/reasoning:
                  </label>
                  <textarea
                    disabled={isSubmitting || !!apiResult}
                    value={working}
                    onChange={(e) => setWorking(e.target.value)}
                    placeholder="e.g. 
Forces acting vertically on the mass:
Normal Force (N) upwards, gravity (mg) downwards.
Applying Newton's Second Law along the acceleration path:
N - mg = m * a
N = m(g + a) = 2 * (10 + 2) = 24 N."
                    className="flex-1 min-h-[220px] bg-[#0c0c0e] border border-zinc-800 rounded-lg p-5 text-sm font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-violet-500/80 disabled:opacity-50 resize-none leading-relaxed"
                  />
                </div>
              ) : (
                /* Vision Image Upload Workspace */
                <div className="flex-1 flex flex-col space-y-4">
                  {!imageFile ? (
                    /* Drag & Drop Area */
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex-1 min-h-[220px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 transition-all ${
                        isDragging
                          ? 'border-violet-500 bg-violet-950/10'
                          : 'border-zinc-800 bg-[#0c0c0e] hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="file"
                        id="handwriting-file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="handwriting-file"
                        className="cursor-pointer flex flex-col items-center space-y-3"
                      >
                        <span className="text-3xl">📷</span>
                        <span className="text-sm font-semibold text-zinc-300 text-center">
                          Drag & drop your handwritten solution, or <span className="text-violet-400 underline">browse</span>
                        </span>
                        <span className="text-xs text-zinc-500">Supports PNG, JPG, JPEG (Max 5MB)</span>
                      </label>
                    </div>
                  ) : (
                    /* Image Selection Metadata + Preview Control */
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-zinc-900/40 rounded-lg border border-zinc-850 gap-4">
                        <div className="flex items-center space-x-4">
                          {imageBase64 && (
                            <img
                              src={imageBase64}
                              alt="Handwritten solution preview"
                              className="w-16 h-16 object-contain rounded border border-zinc-800 bg-zinc-950"
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-zinc-200 truncate max-w-xs">{imageFile.name}</span>
                            <span className="text-xs text-zinc-500">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        </div>
                        {!apiResult && (
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImageBase64(null);
                              setExtractionResult(null);
                              setExtractionError(null);
                              setWorking('');
                              setFinalAnswer('');
                            }}
                            className="text-xs text-rose-400 hover:text-rose-300 font-semibold border border-rose-900/30 bg-rose-950/20 px-3.5 py-1.5 rounded transition cursor-pointer"
                          >
                            Remove Image
                          </button>
                        )}
                      </div>

                      {/* Extraction Statuses */}
                      {!extractionResult && !isAnalyzingImage && !extractionError && (
                        <button
                          type="button"
                          onClick={runImageAnalysis}
                          className="w-full bg-violet-650 hover:bg-violet-600 border border-violet-700/50 text-white font-bold py-3 px-4 rounded-lg text-xs transition cursor-pointer flex items-center justify-center space-x-2"
                        >
                          <span>✨</span>
                          <span>EXTRACT SOLUTION WITH GEMINI VISION</span>
                        </button>
                      )}

                      {isAnalyzingImage && (
                        <div className="p-8 bg-zinc-900/20 border border-zinc-850 rounded-lg flex flex-col items-center justify-center space-y-3">
                          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-mono text-zinc-400 animate-pulse">Gemini Vision is transcribing steps...</span>
                        </div>
                      )}

                      {extractionError && (
                        <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 rounded-lg text-xs space-y-2.5">
                          <p className="font-semibold text-red-300">Extraction Error:</p>
                          <p>{extractionError}</p>
                          <button
                            type="button"
                            onClick={runImageAnalysis}
                            className="bg-red-900/40 hover:bg-red-800/40 border border-red-800/60 px-3 py-1 rounded font-bold cursor-pointer"
                          >
                            Retry Extraction
                          </button>
                        </div>
                      )}

                      {extractionResult && (
                        <div className="space-y-4">
                          {extractionResult.isImageUnclear ? (
                            <div className="p-5 bg-amber-950/20 border border-amber-900/40 rounded-lg space-y-2">
                              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase">
                                <span>⚠️</span>
                                <span>Image Unclear or Not Readable</span>
                              </div>
                              <p className="text-xs text-zinc-300 leading-relaxed">
                                Gemini Vision could not identify a valid, readable handwritten solution. Please verify image lighting and crop.
                              </p>
                              {extractionResult.unclearRegions.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Identified issues:</span>
                                  <ul className="list-disc pl-4 space-y-1 text-xs text-zinc-400">
                                    {extractionResult.unclearRegions.map((region: string, idx: number) => (
                                      <li key={idx}>{region}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-lg space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase">
                                  <span>✨ Transcribed Solution Details</span>
                                  <span className="font-mono bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-800/40">
                                    {(extractionResult.confidence * 100).toFixed(0)}% Confidence
                                  </span>
                                </div>
                                <div className="text-xs text-zinc-300 font-mono space-y-1.5">
                                  <p className="font-semibold text-zinc-400">Transcribed Working:</p>
                                  <pre className="p-3 bg-zinc-950/60 border border-zinc-850 rounded whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                                    {extractionResult.extractedWorking}
                                  </pre>
                                </div>

                                {extractionResult.detectedEquations.length > 0 && (
                                  <div className="text-xs space-y-1">
                                    <span className="font-semibold text-zinc-400">Detected Equations:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {extractionResult.detectedEquations.map((eq: string, idx: number) => (
                                        <span key={idx} className="bg-zinc-850 px-2 py-0.5 rounded text-zinc-300 font-mono text-[10px] border border-zinc-700/60">
                                          {eq}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Student Verification Message */}
                              {!apiResult && (
                                <div className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-lg text-xs text-zinc-400 leading-relaxed">
                                  <p className="font-semibold text-zinc-300 mb-1">Verify & Refine:</p>
                                  <p>
                                    Verify the transcription and the pre-filled answer below. If Gemini Vision misread a value or variable, you can edit the working or final answer box directly before confirming.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Answer Input and Submit Button side-by-side */}
              <div className="grid grid-cols-3 gap-4 items-end">
                <div className="col-span-1 space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                    Final Answer ({activeStage === 'seed' ? currentProblem.unit : activeTwin?.unit}):
                  </label>
                  <input
                    disabled={isSubmitting || !!apiResult}
                    type="text"
                    value={finalAnswer}
                    onChange={(e) => setFinalAnswer(e.target.value)}
                    placeholder="Value"
                    className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-lg p-3 text-sm font-mono text-center text-zinc-200 focus:outline-none focus:border-violet-500/80 disabled:opacity-50"
                  />
                </div>

                <div className="col-span-2">
                  {!apiResult ? (
                    <button
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full bg-violet-650 hover:bg-violet-600 text-white font-bold py-3 px-6 rounded-lg text-sm transition focus:outline-none disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                    >
                      {isSubmitting ? (
                        <span>Evaluating...</span>
                      ) : (
                        <span>SUBMIT SOLUTION</span>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resetWorkspace}
                      className="w-full bg-zinc-805 hover:bg-zinc-700 text-zinc-300 font-bold py-3 px-6 rounded-lg text-sm transition focus:outline-none cursor-pointer border border-zinc-700/30"
                    >
                      RESET WORKSPACE
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-4 rounded-lg text-xs leading-relaxed">
                  {error}
                </div>
              )}
            </form>
          </section>
        </div>

        {/* Ambient Loader Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-[#09090b]/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-6 z-40">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <div className="flex flex-col items-center space-y-1">
              <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">ANALYZING ATTEMPT</span>
              <p className="text-sm font-mono text-zinc-300 animate-pulse">{LOADER_TEXTS[loaderStep]}</p>
            </div>
          </div>
        )}

        {/* Feedback Overlay Panel (Slides up when evaluation is ready) */}
        {apiResult && (
          <div className="border-t border-zinc-800 bg-[#0c0c0e] p-8 max-h-[50%] overflow-y-auto space-y-6 z-30">
            {/* Top evaluation summary strip */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Evaluation Outcome</span>
                <h3 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                  <span>Score: {apiResult.evaluation?.score}%</span>
                  <span className="text-zinc-600">•</span>
                  <span
                    className={
                      apiResult.evaluation?.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                    }
                  >
                    {apiResult.evaluation?.isCorrect ? 'Correct Numerical Answer' : 'Incorrect Answer'}
                  </span>
                </h3>
              </div>

              <div className="flex items-center space-x-3">
                {/* Stage A (Seed) Success or Fail Transitions */}
                {apiResult.nextAction === 'mastered' && (
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/20 border border-emerald-900/30 px-3 py-1 rounded">
                      Concept Mastered!
                    </span>
                    <button
                      onClick={proceedToNextConcept}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded text-xs transition cursor-pointer"
                    >
                      PROCEED TO NEXT CONCEPT
                    </button>
                  </div>
                )}

                {apiResult.nextAction === 'show_twin' && activeStage === 'seed' && (
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-amber-400 font-semibold bg-amber-950/20 border border-amber-900/30 px-3 py-1 rounded">
                      Rote/Surface Match Detected
                    </span>
                    <button
                      onClick={acceptTwinChallenge}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-5 rounded text-xs transition cursor-pointer"
                    >
                      ACCEPT TWIN CHALLENGE
                    </button>
                  </div>
                )}

                {/* Stage B (Twin) Success / Fail Transitions */}
                {apiResult.nextAction === 'twin_accepted' && (
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/20 border border-emerald-900/30 px-3 py-1 rounded">
                      Transfer Confirmed! Concept Mastered.
                    </span>
                    <button
                      onClick={proceedToNextConcept}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded text-xs transition cursor-pointer"
                    >
                      PROCEED TO NEXT CONCEPT
                    </button>
                  </div>
                )}

                {apiResult.nextAction === 'remediation' && (
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-red-400 font-semibold bg-red-950/20 border border-red-900/30 px-3 py-1 rounded">
                      Needs Remediation
                    </span>
                    <button
                      onClick={resetWorkspace}
                      className="bg-red-650 hover:bg-red-650 text-white font-bold py-2.5 px-5 rounded text-xs transition cursor-pointer"
                    >
                      TRY AGAIN
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Vision Image and Extraction summary row */}
            {submissionType === 'image' && imageBase64 && extractionResult && (
              <div className="bg-[#121215] border border-zinc-800/80 p-5 rounded-lg space-y-4">
                <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                  Submitted Image & Extraction Analysis
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1 border border-zinc-850 rounded-lg p-3 bg-zinc-950/50 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Original Solution Image</span>
                    <img
                      src={imageBase64}
                      alt="Handwritten physics solution"
                      className="max-h-32 object-contain rounded border border-zinc-800"
                    />
                  </div>
                  <div className="col-span-2 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-400">Extracted Step-by-Step Working:</span>
                      <span className="text-[10px] bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 font-mono px-2 py-0.5 rounded">
                        {(extractionResult.confidence * 100).toFixed(0)}% Confidence
                      </span>
                    </div>
                    <pre className="p-3 bg-zinc-950/50 border border-zinc-850 rounded whitespace-pre-wrap font-mono text-zinc-300 max-h-24 overflow-y-auto leading-relaxed">
                      {extractionResult.extractedWorking}
                    </pre>
                    <div className="flex space-x-6 pt-1">
                      <div>
                        <span className="font-semibold text-zinc-400">Answer Extracted: </span>
                        <span className="text-zinc-200 font-mono">{extractionResult.extractedFinalAnswer}</span>
                      </div>
                      {extractionResult.detectedEquations.length > 0 && (
                        <div>
                          <span className="font-semibold text-zinc-400">Formulas Found: </span>
                          <span className="text-zinc-300 font-mono">{extractionResult.detectedEquations.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dissected mistakes list */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left pane: evaluator mistakes / feedback */}
              <div className="bg-[#121215] border border-zinc-800 p-5 rounded-lg space-y-4">
                <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Evaluator Dissection</span>
                <p className="text-sm text-zinc-300 italic">&ldquo;{apiResult.evaluation?.summary}&rdquo;</p>
                {apiResult.evaluation?.identifiedMistakes && apiResult.evaluation.identifiedMistakes.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Identified Mistakes:</span>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-zinc-400">
                      {apiResult.evaluation.identifiedMistakes.map((mistake, idx) => (
                        <li key={idx}>{mistake}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right pane: diagnosis / verifier feedback */}
              {activeStage === 'seed' && apiResult.diagnosis && (
                <div className="bg-amber-950/10 border border-amber-900/30 p-5 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">Diagnosis Report</span>
                    <span className="text-[10px] bg-amber-900/30 border border-amber-800/40 text-amber-300 font-mono px-2 py-0.5 rounded">
                      {(apiResult.diagnosis.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-amber-400">Misconception: </span>
                      <span className="text-zinc-300">{apiResult.diagnosis.misconceptionType}</span>
                    </div>
                    <div>
                      <span className="font-bold text-amber-400">Conceptual Gap: </span>
                      <p className="text-zinc-400 mt-0.5">{apiResult.diagnosis.conceptualGap}</p>
                    </div>
                    <div>
                      <span className="font-bold text-amber-400">Deep Principle Failure: </span>
                      <p className="text-zinc-400 mt-0.5">{apiResult.diagnosis.deepStructureFailure}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeStage === 'twin' && apiResult.verification && (
                <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-lg space-y-4">
                  <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Verifier Report</span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-zinc-400">Transfer Score: </span>
                      <span className="text-zinc-300 font-mono">{apiResult.verification.twinAttemptScore}%</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-400">Feedback: </span>
                      <p className="text-zinc-400 mt-0.5">{apiResult.verification.transferFeedback}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
