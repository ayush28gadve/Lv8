'use client';

import React, { useState, useEffect } from 'react';
import { getAllConcepts } from '@/data/concepts';
import { getProblemsByConcept } from '@/data/problems';
import type { ConceptId, PhysicsConcept } from '@/types/physics';
import type { SessionApiResponse, SessionApiResult, ApiTwinProblem, SessionApiError, HandwritingAnalysisResult } from '@/lib/api/types';

// Tutor progressive analysis stages
const TUTOR_ANALYSIS_STAGES = [
  'Reading your solution...',
  'Understanding your reasoning...',
  'Checking governing principles...',
  'Comparing your physics approach...',
  'Identifying potential gaps...',
  'Estimating concept mastery...',
  'Building next challenge...',
];

// The list of concepts in order of prerequisites
const CONCEPT_ORDER: ConceptId[] = [
  'fbd-force-identification',
  'newtons-second-law',
  'friction-direction',
  'inclined-plane',
  'connected-bodies-pulleys',
];

const ParticlesBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
    <div className="particle animate-float-particle" style={{ top: '12%', left: '15%', animationDelay: '0s', animationDuration: '9s' }} />
    <div className="particle animate-float-particle" style={{ top: '28%', left: '85%', animationDelay: '2.5s', animationDuration: '12s' }} />
    <div className="particle animate-float-particle" style={{ top: '48%', left: '18%', animationDelay: '4.5s', animationDuration: '10s' }} />
    <div className="particle animate-float-particle" style={{ top: '68%', left: '72%', animationDelay: '1.2s', animationDuration: '14s' }} />
    <div className="particle animate-float-particle" style={{ top: '88%', left: '28%', animationDelay: '5.5s', animationDuration: '11s' }} />
    <div className="particle animate-float-particle" style={{ top: '15%', left: '92%', animationDelay: '3.5s', animationDuration: '8s' }} />
    <div className="particle animate-float-particle" style={{ top: '58%', left: '48%', animationDelay: '6.5s', animationDuration: '13s' }} />
    <div className="particle animate-float-particle" style={{ top: '92%', left: '82%', animationDelay: '2.8s', animationDuration: '9s' }} />
  </div>
);

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
  const [tutorStep, setTutorStep] = useState<number>(0);

  // Loader interval simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting) {
      interval = setInterval(() => {
        setTutorStep((prev) => (prev < TUTOR_ANALYSIS_STAGES.length - 1 ? prev + 1 : prev));
      }, 700);
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

    setTutorStep(0);
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
      <div className="min-h-screen w-screen bg-background flex items-center justify-center p-6 relative overflow-hidden font-sans text-text-primary selection:bg-accent-brand/30">
        <ParticlesBackground />
        
        {/* Ambient radial lighting for high-quality aesthetics */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-brand/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-dark/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="bg-bg-card border border-border-default rounded-2xl p-8 max-w-lg w-full space-y-6 shadow-lg relative z-10">
          <div className="flex flex-col items-center text-center space-y-2">
            <span className="text-3xl">✨</span>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary mt-2">Welcome to ConceptTwin</h1>
            <p className="text-xs text-text-secondary max-w-xs">
              Establish deep, adaptive conceptual mastery in mechanics and solve conceptual transfer challenges.
            </p>
          </div>

          <form onSubmit={handleOnboardingSubmit} className="space-y-5">
            {/* Student Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Your Name</label>
              <input
                type="text"
                required
                value={onboardingName}
                onChange={(e) => setOnboardingName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-bg-card border border-border-default rounded-lg p-3 text-sm text-text-primary focus:outline-none focus:border-border-active focus:ring-2 focus:ring-accent-brand/20 transition placeholder:text-text-disabled"
              />
            </div>

            {/* Class & Exam Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Class Level</label>
                <div className="grid grid-cols-2 bg-bg-secondary p-1 rounded-lg border border-border-default">
                  <button
                    type="button"
                    onClick={() => setOnboardingClass('11')}
                    className={`py-2 text-xs font-semibold rounded transition-all cursor-pointer ${
                      onboardingClass === '11'
                        ? 'bg-accent-dark text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Class 11
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingClass('12')}
                    className={`py-2 text-xs font-semibold rounded transition-all cursor-pointer ${
                      onboardingClass === '12'
                        ? 'bg-accent-dark text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Class 12
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Target Exam</label>
                <div className="grid grid-cols-3 bg-bg-secondary p-1 rounded-lg border border-border-default">
                  {(['JEE', 'NEET', 'Board'] as const).map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setOnboardingExam(ex)}
                      className={`py-2 text-xs font-semibold rounded transition-all cursor-pointer ${
                        onboardingExam === ex
                          ? 'bg-accent-dark text-white shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
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
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Subject</label>
                <div className="w-full bg-bg-secondary/50 border border-border-default text-text-secondary rounded-lg p-3 text-xs font-semibold cursor-not-allowed">
                  Physics (Mechanics)
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Chapter</label>
                <div className="w-full bg-bg-secondary/50 border border-border-default text-text-secondary rounded-lg p-3 text-xs font-semibold truncate cursor-not-allowed">
                  {"Newton's Laws & Friction"}
                </div>
              </div>
            </div>

            {/* Concept Selector Grid */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Select Target Concept</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {getAllConcepts().map((concept) => (
                  <button
                    key={concept.conceptId}
                    type="button"
                    onClick={() => setOnboardingConcept(concept.conceptId)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition flex flex-col space-y-1 cursor-pointer ${
                      onboardingConcept === concept.conceptId
                        ? 'border-accent-dark bg-accent-soft/40 text-accent-dark'
                        : 'border-border-default bg-bg-card hover:bg-bg-secondary/50 hover:border-border-hover text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className={`font-semibold ${onboardingConcept === concept.conceptId ? 'text-accent-dark font-bold' : 'text-text-primary'}`}>
                      {concept.name}
                    </span>
                    <span className="text-[10px] text-text-muted truncate max-w-sm">{concept.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-error-bg border border-error-border text-error-text p-3 rounded-lg text-xs leading-relaxed">
                {error}
              </div>
            )}

            {/* Begin Button */}
            <button
              type="submit"
              className="w-full bg-accent-dark hover:bg-accent-dark/90 text-white font-bold py-3 rounded-lg text-xs transition shadow-sm hover:shadow cursor-pointer"
            >
              LAUNCH LEARNING WORKSPACE
            </button>
          </form>
        </div>
      </div>
    );
  }  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-text-primary selection:bg-accent-brand/35 relative">
      <ParticlesBackground />
      
      {/* Sidebar: Concept Map */}
      <aside className="w-60 flex-shrink-0 border-r border-border-default bg-bg-secondary flex flex-col z-10">
        <div className="p-4 border-b border-border-default flex items-center justify-between">
          <span className="text-lg font-extrabold tracking-tight text-text-primary">ConceptTwin</span>
          <span className="text-[10px] bg-bg-card px-2 py-0.5 rounded-full text-text-secondary border border-border-default shadow-sm font-semibold">
            {masteredConcepts.size}/{concepts.length} Mastered
          </span>
        </div>

        {/* subway-line Concept Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-4">Concept Pathway</h2>
          <div className="relative pl-5 border-l border-border-default space-y-5">
            {CONCEPT_ORDER.map((cid, i) => {
              const concept = concepts.find((c) => c.conceptId === cid);
              if (!concept) return null;

              const status = getConceptStatus(cid);
              const isActive = selectedConceptId === cid;

              return (
                <div key={cid} className="relative group">
                  {/* subway connector node */}
                  <div
                    className={`absolute -left-[25px] top-1.5 w-[9px] h-[9px] rounded-full border-2 transition-all duration-300 ${
                      status === 'mastered'
                        ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                        : status === 'remediation'
                          ? 'bg-amber-500 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                          : status === 'active'
                            ? 'bg-bg-card border-accent-dark scale-125 shadow-[0_0_6px_rgba(0,143,140,0.25)] animate-pulse'
                            : status === 'unlocked'
                              ? 'bg-bg-card border-border-hover'
                              : 'bg-border-default border-border-default'
                    }`}
                  />

                  <button
                    disabled={status === 'locked'}
                    onClick={() => handleConceptSelect(cid)}
                    className={`w-full text-left flex flex-col transition-all ${
                      status === 'locked' ? 'opacity-40 cursor-not-allowed' : 'hover:translate-x-0.5'
                    }`}
                  >
                    <span className="text-[9px] font-bold tracking-widest text-text-muted uppercase">
                      0{i + 1} — {status}
                    </span>
                    <span
                      className={`text-xs font-semibold tracking-tight mt-0.5 leading-snug ${
                        isActive ? 'text-accent-dark font-extrabold' : 'text-text-secondary group-hover:text-text-primary'
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
      <main className="flex-1 flex flex-col overflow-hidden relative z-1">
        <header className="bg-bg-secondary border-b border-border-default px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 z-20 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-extrabold tracking-tight text-text-primary uppercase mr-2 border-r border-border-default pr-3">Learning Pathway</span>
            {studentInfo && (
              <div className="flex flex-col space-y-0.5">
                <span className="text-xs font-bold text-text-primary leading-none">{studentInfo.name}</span>
                <div className="flex items-center space-x-1 text-[9px] text-text-secondary font-semibold">
                  <span>Class {studentInfo.classLevel}</span>
                  <span className="text-text-disabled">•</span>
                  <span className="text-accent-dark font-extrabold uppercase">{studentInfo.exam}</span>
                  <span className="text-text-disabled">•</span>
                  <button
                    onClick={() => setOnboarded(false)}
                    className="hover:text-text-secondary transition underline cursor-pointer"
                  >
                    Change Target
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Progression */}
          <div className="flex items-center overflow-x-auto pb-1 lg:pb-0">
            {(['PYQ', 'Solution', 'Eval', 'Gap', 'Twin', 'Transfer', 'Mastery'] as const).map((step, idx) => {
              const status = getStepStatus(step);
              const label =
                step === 'Solution' ? 'Solution' :
                step === 'Eval' ? 'Analysis' :
                step === 'Gap' ? 'Gap' :
                step === 'Twin' ? 'Twin' :
                step === 'Transfer' ? 'Transfer' :
                step === 'Mastery' ? 'Mastery' : 'PYQ';

              return (
                <div key={step} className="flex items-center flex-shrink-0">
                  {idx > 0 && (
                    <div className={`h-[1px] w-3 md:w-5 mx-1 md:mx-1.5 ${
                      status === 'completed'
                        ? 'bg-emerald-300'
                        : status === 'active'
                          ? 'bg-accent-dark/50'
                          : 'bg-border-default'
                    }`} />
                  )}
                  <div className="flex items-center space-x-1">
                    {/* Dot Indicator */}
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-[8px] font-extrabold transition-all duration-300 ${
                      status === 'completed'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : status === 'active'
                          ? 'bg-accent-dark border-accent-dark text-white shadow-[0_0_8px_rgba(0,143,140,0.3)]'
                          : status === 'bypassed'
                            ? 'border-border-hover border-dashed text-text-muted bg-transparent'
                            : 'border-border-default text-text-disabled bg-bg-card/50'
                    }`}>
                      {status === 'completed' ? '✓' : (idx + 1)}
                    </div>
                    {/* Label */}
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider ${
                      status === 'completed'
                        ? 'text-text-muted font-medium'
                        : status === 'active'
                          ? 'text-accent-dark font-extrabold'
                          : status === 'bypassed'
                            ? 'text-text-muted font-medium'
                            : 'text-text-disabled'
                    }`}>
                      {label}
                    </span>
                    {status === 'bypassed' && <span className="text-[7px] bg-bg-secondary border border-border-default px-1 rounded text-text-muted font-medium">Bypassed</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </header>

        {/* Main Content Workspace Split Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Problem Statement & Physics context */}
          <section className="w-[45%] flex-shrink-0 border-r border-border-default bg-bg-secondary/20 flex flex-col overflow-y-auto animate-fadeIn">
            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-text-muted font-extrabold">Concept Module</span>
                <h1 className="text-sm font-extrabold tracking-tight text-text-primary mt-0.5 uppercase max-w-xs truncate">
                  {currentConcept.name}
                </h1>
              </div>
              <span className="text-[10px] bg-bg-card px-2.5 py-1 rounded text-text-secondary border border-border-default shadow-sm uppercase font-extrabold">
                Problem Set
              </span>
            </div>

            <div className="p-6 flex-1 space-y-5">
              {/* CARD 1: Diagnostic PYQ */}
              <div className={`rounded-xl border p-6 space-y-4 transition ${
                activeStage === 'seed'
                  ? 'bg-bg-card border-accent-dark/30 shadow-[0_4px_12px_rgba(0,143,140,0.03)]'
                  : 'bg-bg-card/60 border-border-default opacity-70'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent-dark bg-accent-soft border border-accent-border px-2 py-0.5 rounded animate-transition">
                      Diagnostic PYQ
                    </span>
                    {currentProblem.pyqMetadata && (
                      <span className="text-[9px] text-text-muted font-mono">
                        {currentProblem.pyqMetadata.exam} ({currentProblem.pyqMetadata.year})
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                    activeStage === 'seed' ? 'text-accent-dark animate-pulse' : 'text-text-muted'
                  }`}>
                    {activeStage === 'seed' ? '● ACTIVE' : '✓ SOLVED'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-text-muted">Problem Statement</span>
                    <span className="text-[10px] bg-bg-secondary px-2 py-0.5 rounded text-text-secondary font-mono capitalize">
                      {currentProblem.difficulty}
                    </span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-text-primary mb-3">
                    {currentProblem.question}
                  </p>

                  {activeStage === 'seed' && !apiResult && (
                    <div className="flex items-center space-x-2 bg-bg-secondary/45 p-2 rounded-lg border border-border-default/50">
                      <span className="text-[10px] text-text-secondary font-medium">Presets:</span>
                      <div className="flex-1 flex justify-end space-x-1">
                        {conceptProblems.map((prob, idx) => (
                          <button
                            key={prob.problemId}
                            onClick={() => {
                              setSelectedProblemIndex(idx);
                              resetWorkspace();
                            }}
                            className={`text-[10px] px-2.5 py-0.5 rounded transition cursor-pointer ${
                              selectedProblemIndex === idx
                                ? 'bg-accent-dark text-white shadow-sm font-bold'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                            }`}
                          >
                            {prob.difficulty.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 2: ConceptTwin Challenge */}
              <div className={`rounded-xl border p-6 space-y-4 relative overflow-hidden min-h-[150px] transition ${
                activeStage === 'twin'
                  ? 'bg-bg-card border-warning-border/50 shadow-[0_4px_12px_rgba(245,158,11,0.03)]'
                  : apiResult?.nextAction === 'show_twin'
                    ? 'border-warning-border/30 bg-warning-bg/40'
                    : 'border-border-default bg-bg-card/50 opacity-60'
              }`}>
                {/* Lock Overlay if locked */}
                {activeStage === 'seed' && apiResult?.nextAction !== 'show_twin' && (
                  <div className="absolute inset-0 bg-bg-card/95 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                    <span className="text-2xl animate-bounce">🔒</span>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">ConceptTwin Locked</span>
                      <p className="text-[11px] leading-relaxed text-text-secondary max-w-xs mx-auto">
                        Unlocks dynamically if the AI evaluator detects a surface pattern-matching approach on the PYQ solution.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                    activeStage === 'twin'
                      ? 'text-warning-text bg-warning-bg border border-warning-border/40'
                      : 'text-text-disabled bg-bg-secondary border border-border-default/40'
                  }`}>
                    ConceptTwin Challenge
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                    activeStage === 'twin' ? 'text-warning-text animate-pulse' : 'text-text-disabled'
                  }`}>
                    {activeStage === 'twin' ? '● ACTIVE' : apiResult?.nextAction === 'twin_accepted' ? '✓ VERIFIED' : 'PENDING'}
                  </span>
                </div>

                {activeTwin && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-text-muted">Deep Transfer Task</span>
                        <span className="text-[10px] bg-bg-secondary px-2 py-0.5 rounded text-text-secondary font-mono capitalize">
                          {activeTwin.difficulty}
                        </span>
                      </div>
                      <p className="text-[14px] leading-relaxed text-text-primary">
                        {activeTwin.question}
                      </p>
                    </div>

                    <div className="bg-warning-bg/60 border border-warning-border/30 rounded-lg p-4 space-y-2">
                      <span className="text-[10px] font-bold text-warning-text uppercase tracking-wider">AI Twin Rationale</span>
                      <p className="text-[11px] leading-relaxed text-text-secondary">
                        {activeTwin.twinRationale}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {/* Collapsed Equations Accordion */}
              <div className="border border-border-default rounded-lg overflow-hidden">
                <details className="group">
                  <summary className="p-4 bg-bg-secondary text-[10px] font-semibold tracking-wider text-text-secondary uppercase flex items-center justify-between cursor-pointer hover:bg-bg-secondary/70 select-none">
                    <span>Reference Governing Equations</span>
                    <span className="transition-transform group-open:rotate-180">▼</span>
                  </summary>
                  <div className="p-5 bg-bg-card border-t border-border-default space-y-4 font-mono text-xs">
                    {currentConcept.coreEquations.map((eq) => (
                      <div key={eq.id} className="p-3 bg-bg-secondary/35 rounded border border-border-default">
                        <div className="flex justify-between items-center text-text-primary font-bold mb-1">
                          <span>{eq.label}</span>
                          <span className="text-accent-dark font-sans">{eq.latex}</span>
                        </div>
                        <p className="text-text-muted font-sans">{eq.explanation}</p>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </section>

          {/* Right Panel: Student Workspace */}
          <section className="flex-1 bg-background flex flex-col overflow-y-auto">
            <div className="px-6 py-4 border-b border-border-default flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-text-muted font-extrabold">STUDENT WORKSPACE</span>
                <h2 className="text-sm font-extrabold tracking-tight text-text-primary mt-0.5">Submit Solution</h2>
              </div>

              {/* Tab Selector for input modes */}
              {!apiResult && (
                <div className="flex bg-bg-secondary p-1 rounded-lg border border-border-default">
                  <button
                    type="button"
                    onClick={() => setSubmissionType('text')}
                    className={`text-[10px] px-3 py-1.5 rounded-md font-bold uppercase transition-all cursor-pointer ${
                      submissionType === 'text'
                        ? 'bg-accent-dark text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Type Solution
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionType('image')}
                    className={`text-[10px] px-3 py-1.5 rounded-md font-bold uppercase transition-all cursor-pointer ${
                      submissionType === 'image'
                        ? 'bg-accent-dark text-white shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Upload Image
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col space-y-5">
              {submissionType === 'text' ? (
                /* Working Textarea */
                <div className="flex-1 flex flex-col space-y-2">
                  <label className="text-xs font-semibold tracking-wider text-text-secondary uppercase">
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
                    className="flex-1 min-h-[220px] bg-bg-card border border-border-default rounded-lg p-5 text-sm font-mono text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-active focus:ring-2 focus:ring-accent-brand/20 disabled:opacity-50 resize-none leading-relaxed shadow-inner"
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
                          ? 'border-accent-dark bg-accent-soft/40'
                          : 'border-border-default bg-bg-card hover:border-border-hover'
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
                        <span className="text-sm font-semibold text-text-secondary text-center">
                          Drag & drop your handwritten solution, or <span className="text-accent-dark underline">browse</span>
                        </span>
                        <span className="text-xs text-text-muted">Supports PNG, JPG, JPEG (Max 5MB)</span>
                      </label>
                    </div>
                  ) : (
                    /* Image Selection Metadata + Preview Control */
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-bg-secondary/40 rounded-lg border border-border-default gap-4 shadow-sm">
                        <div className="flex items-center space-x-4">
                          {imageBase64 && (
                            <img
                              src={imageBase64}
                              alt="Handwritten solution preview"
                              className="w-16 h-16 object-contain rounded border border-border-default bg-bg-card"
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-text-primary truncate max-w-xs">{imageFile.name}</span>
                            <span className="text-xs text-text-muted">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</span>
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
                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold border border-rose-200 bg-rose-50 hover:bg-rose-100/50 px-3.5 py-1.5 rounded transition cursor-pointer"
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
                          className="w-full bg-accent-dark hover:bg-accent-dark/95 border border-accent-border text-white font-bold py-3 px-4 rounded-lg text-xs transition cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
                        >
                          <span>✨</span>
                          <span>EXTRACT SOLUTION WITH GEMINI VISION</span>
                        </button>
                      )}

                      {isAnalyzingImage && (
                        <div className="p-8 bg-bg-secondary/40 border border-border-default rounded-lg flex flex-col items-center justify-center space-y-3">
                          <div className="w-6 h-6 border-2 border-accent-dark border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-mono text-text-secondary animate-pulse">Gemini Vision is transcribing steps...</span>
                        </div>
                      )}

                      {extractionError && (
                        <div className="p-4 bg-error-bg border border-error-border text-error-text rounded-lg text-xs space-y-2.5">
                          <p className="font-semibold text-error-text">Extraction Error:</p>
                          <p>{extractionError}</p>
                          <button
                            type="button"
                            onClick={runImageAnalysis}
                            className="bg-error-bg hover:bg-error-border/40 border border-error-border px-3 py-1 rounded font-bold cursor-pointer text-error-text"
                          >
                            Retry Extraction
                          </button>
                        </div>
                      )}

                      {extractionResult && (
                        <div className="space-y-4">
                          {extractionResult.isImageUnclear ? (
                            <div className="p-5 bg-warning-bg border border-warning-border text-warning-text rounded-lg space-y-2">
                              <div className="flex items-center space-x-2 text-warning-text font-bold text-xs uppercase">
                                <span>⚠️</span>
                                <span>Image Unclear or Not Readable</span>
                              </div>
                              <p className="text-xs text-warning-text/90 leading-relaxed">
                                Gemini Vision could not identify a valid, readable handwritten solution. Please verify image lighting and crop.
                              </p>
                              {extractionResult.unclearRegions.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">Identified issues:</span>
                                  <ul className="list-disc pl-4 space-y-1 text-xs text-text-secondary">
                                    {extractionResult.unclearRegions.map((region: string, idx: number) => (
                                      <li key={idx}>{region}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase">
                                  <span>✨ Transcribed Solution Details</span>
                                  <span className="font-mono bg-emerald-100 border border-emerald-250 text-emerald-850 px-2 py-0.5 rounded text-[10px]">
                                    {(extractionResult.confidence * 100).toFixed(0)}% Confidence
                                  </span>
                                </div>
                                <div className="text-xs text-text-secondary font-mono space-y-1.5">
                                  <p className="font-semibold text-text-secondary">Transcribed Working:</p>
                                  <pre className="p-3 bg-bg-card border border-border-default rounded whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto text-text-primary">
                                    {extractionResult.extractedWorking}
                                  </pre>
                                </div>

                                {extractionResult.detectedEquations.length > 0 && (
                                  <div className="text-xs space-y-1">
                                    <span className="font-semibold text-text-secondary">Detected Equations:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {extractionResult.detectedEquations.map((eq: string, idx: number) => (
                                        <span key={idx} className="bg-bg-secondary px-2 py-0.5 rounded text-text-primary font-mono text-[10px] border border-border-default">
                                          {eq}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Student Verification Message */}
                              {!apiResult && (
                                <div className="bg-bg-secondary/40 border border-border-default p-4 rounded-lg text-xs text-text-secondary leading-relaxed">
                                  <p className="font-semibold text-text-primary mb-1">Verify & Refine:</p>
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
                  <label className="text-xs font-semibold tracking-wider text-text-secondary uppercase">
                    Final Answer ({activeStage === 'seed' ? currentProblem.unit : activeTwin?.unit}):
                  </label>
                  <input
                    disabled={isSubmitting || !!apiResult}
                    type="text"
                    value={finalAnswer}
                    onChange={(e) => setFinalAnswer(e.target.value)}
                    placeholder="Value"
                    className="w-full bg-bg-card border border-border-default rounded-lg p-3 text-sm font-mono text-center text-text-primary focus:outline-none focus:border-border-active focus:ring-2 focus:ring-accent-brand/20 disabled:opacity-50 shadow-inner animate-transition"
                  />
                </div>

                <div className="col-span-2">
                  {!apiResult ? (
                    <button
                      disabled={isSubmitting}
                      type="submit"
                      className="w-full bg-accent-dark hover:bg-accent-dark/95 text-white font-bold py-3 px-6 rounded-lg text-sm transition focus:outline-none disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
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
                      className="w-full bg-bg-secondary hover:bg-border-default text-text-primary font-bold py-3 px-6 rounded-lg text-sm transition focus:outline-none cursor-pointer border border-border-default shadow-sm"
                    >
                      RESET WORKSPACE
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-lg text-xs leading-relaxed">
                  {error}
                </div>
              )}
            </form>
          </section>
        </div>

        {/* Ambient Loader Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-bg-secondary/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-40 select-none animate-fadeIn">
            {/* 3D Depth Orbit Visual */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Outer rotating orbit 1 */}
              <div className="absolute inset-0 border border-dashed border-accent-dark/30 rounded-full animate-[spin_8s_linear_infinite]" />
              {/* Outer rotating orbit 2 */}
              <div className="absolute w-28 h-28 border border-accent-dark/20 rounded-full animate-[spin_5s_linear_infinite_reverse]" />
              {/* Orbiting particle point */}
              <div className="absolute w-2 h-2 bg-accent-dark rounded-full animate-[spin_3s_linear_infinite] origin-[68px_68px] shadow-[0_0_8px_rgba(0,143,140,0.8)]" />
              
              {/* Floating Core */}
              <div className="relative w-14 h-14 bg-bg-card rounded-2xl border border-accent-border/40 shadow-xl flex items-center justify-center animate-[floatSlow_3s_ease-in-out_infinite]">
                <div className="w-3.5 h-3.5 rounded-full bg-accent-dark animate-[pulseGlow_2s_ease-in-out_infinite]" />
              </div>
            </div>

            <div className="text-center mt-4 mb-2">
              <span className="text-[10px] tracking-widest uppercase font-extrabold text-accent-dark">Tutor Assessment</span>
              <h4 className="text-sm font-extrabold text-text-primary mt-1 tracking-tight">ConceptTwin is assessing your solution method</h4>
            </div>

            {/* Stages checklist */}
            <div className="flex flex-col items-start space-y-2 mt-4 w-full max-w-[280px]">
              {TUTOR_ANALYSIS_STAGES.map((stage, idx) => {
                const isCompleted = idx < tutorStep;
                const isActive = idx === tutorStep;
                return (
                  <div
                    key={stage}
                    className={`flex items-center space-x-2.5 transition-all duration-300 ${
                      isActive ? 'opacity-100 scale-[1.02]' : isCompleted ? 'opacity-40' : 'opacity-15'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-extrabold border ${
                      isCompleted
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                        : isActive
                          ? 'bg-accent-soft border-accent-dark text-accent-dark animate-pulse shadow-sm'
                          : 'bg-transparent border-border-default text-text-disabled'
                    }`}>
                      {isCompleted ? '✓' : ''}
                    </div>
                    <span className={`text-[11px] tracking-wide ${
                      isActive
                        ? 'text-text-primary font-bold'
                        : isCompleted
                          ? 'text-text-secondary font-medium'
                          : 'text-text-disabled'
                    }`}>
                      {stage}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback Overlay Panel (Slides up when evaluation is ready) */}
        {apiResult && (
          <div className="border-t border-border-default bg-bg-secondary p-8 max-h-[50%] overflow-y-auto space-y-6 z-30 shadow-2xl relative">
            {/* Top evaluation summary strip */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-text-muted font-bold">Evaluation Outcome</span>
                <h3 className="text-xl font-bold tracking-tight text-text-primary flex items-center space-x-2">
                  <span>Score: {apiResult.evaluation?.score}%</span>
                  <span className="text-border-hover">•</span>
                  <span
                    className={
                      apiResult.evaluation?.isCorrect ? 'text-emerald-600' : 'text-rose-600'
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
                    <span className="text-xs text-emerald-800 font-semibold bg-emerald-100 border border-emerald-250 px-3 py-1 rounded">
                      Concept Mastered!
                    </span>
                    <button
                      onClick={proceedToNextConcept}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded text-xs transition cursor-pointer shadow-sm"
                    >
                      PROCEED TO NEXT CONCEPT
                    </button>
                  </div>
                )}

                {apiResult.nextAction === 'show_twin' && activeStage === 'seed' && (
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-amber-800 font-semibold bg-amber-100 border border-amber-250 px-3 py-1 rounded">
                      Rote/Surface Match Detected
                    </span>
                    <button
                      onClick={acceptTwinChallenge}
                      className="bg-accent-dark hover:bg-accent-dark/90 border border-accent-border text-white font-bold py-2.5 px-5 rounded text-xs transition cursor-pointer shadow-sm"
                    >
                      ACCEPT TWIN CHALLENGE
                    </button>
                  </div>
                )}

                {/* Stage B (Twin) Success / Fail Transitions */}
                {apiResult.nextAction === 'twin_accepted' && (
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-emerald-800 font-semibold bg-emerald-100 border border-emerald-250 px-3 py-1 rounded">
                      Transfer Confirmed! Concept Mastered.
                    </span>
                    <button
                      onClick={proceedToNextConcept}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded text-xs transition cursor-pointer shadow-sm"
                    >
                      PROCEED TO NEXT CONCEPT
                    </button>
                  </div>
                )}

                {apiResult.nextAction === 'remediation' && (
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-rose-800 font-semibold bg-rose-100 border border-rose-250 px-3 py-1 rounded">
                      Needs Remediation
                    </span>
                    <button
                      onClick={resetWorkspace}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-5 rounded text-xs transition cursor-pointer shadow-sm"
                    >
                      TRY AGAIN
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Vision Image and Extraction summary row */}
            {submissionType === 'image' && imageBase64 && extractionResult && (
              <div className="bg-bg-card border border-border-default p-5 rounded-lg space-y-4 shadow-sm">
                <span className="text-xs font-bold tracking-wider text-text-muted uppercase">
                  Submitted Image & Extraction Analysis
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1 border border-border-default rounded-lg p-3 bg-bg-secondary/30 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-text-muted uppercase font-bold mb-2">Original Solution Image</span>
                    <img
                      src={imageBase64}
                      alt="Handwritten physics solution"
                      className="max-h-32 object-contain rounded border border-border-default bg-bg-card shadow-sm"
                    />
                  </div>
                  <div className="col-span-2 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-secondary">Extracted Step-by-Step Working:</span>
                      <span className="text-xs text-emerald-800 font-semibold bg-emerald-100 border border-emerald-250 px-2 py-0.5 rounded">
                        {(extractionResult.confidence * 100).toFixed(0)}% Confidence
                      </span>
                    </div>
                    <pre className="p-3 bg-bg-secondary/40 border border-border-default rounded whitespace-pre-wrap font-mono text-text-primary max-h-24 overflow-y-auto leading-relaxed">
                      {extractionResult.extractedWorking}
                    </pre>
                    <div className="flex space-x-6 pt-1">
                      <div>
                        <span className="font-semibold text-text-secondary">Answer Extracted: </span>
                        <span className="text-text-primary font-mono font-bold">{extractionResult.extractedFinalAnswer}</span>
                      </div>
                      {extractionResult.detectedEquations.length > 0 && (
                        <div>
                          <span className="font-semibold text-text-secondary">Formulas Found: </span>
                          <span className="text-accent-dark font-mono font-bold">{extractionResult.detectedEquations.join(', ')}</span>
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
              <div className="bg-bg-card border border-border-default p-5 rounded-lg space-y-4 shadow-sm">
                <span className="text-xs font-bold tracking-wider text-text-muted uppercase">Evaluator Dissection</span>
                <p className="text-sm text-text-primary italic leading-relaxed">&ldquo;{apiResult.evaluation?.summary}&rdquo;</p>
                {apiResult.evaluation?.identifiedMistakes && apiResult.evaluation.identifiedMistakes.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Identified Mistakes:</span>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-text-secondary">
                      {apiResult.evaluation.identifiedMistakes.map((mistake, idx) => (
                        <li key={idx}>{mistake}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right pane: diagnosis / verifier feedback */}
              {activeStage === 'seed' && apiResult.diagnosis && (
                <div className="bg-warning-bg border border-warning-border p-5 rounded-lg space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-warning-text uppercase">Diagnosis Report</span>
                    <span className="text-[10px] bg-warning-bg border border-warning-border text-warning-text font-mono px-2 py-0.5 rounded">
                      {(apiResult.diagnosis.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-warning-text">Misconception: </span>
                      <span className="text-text-primary">{apiResult.diagnosis.misconceptionType}</span>
                    </div>
                    <div>
                      <span className="font-bold text-warning-text">Conceptual Gap: </span>
                      <p className="text-text-secondary mt-0.5">{apiResult.diagnosis.conceptualGap}</p>
                    </div>
                    <div>
                      <span className="font-bold text-warning-text">Deep Principle Failure: </span>
                      <p className="text-text-secondary mt-0.5">{apiResult.diagnosis.deepStructureFailure}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeStage === 'twin' && apiResult.verification && (
                <div className="bg-bg-card border border-border-default p-5 rounded-lg space-y-4 shadow-sm">
                  <span className="text-xs font-bold tracking-wider text-text-muted uppercase">Verifier Report</span>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-text-secondary">Transfer Score: </span>
                      <span className="text-accent-dark font-mono font-bold">{apiResult.verification.twinAttemptScore}%</span>
                    </div>
                    <div>
                      <span className="font-bold text-text-secondary">Feedback: </span>
                      <p className="text-text-secondary mt-0.5 leading-relaxed">{apiResult.verification.transferFeedback}</p>
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
