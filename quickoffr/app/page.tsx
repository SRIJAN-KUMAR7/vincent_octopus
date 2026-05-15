'use client';

import { useState } from 'react';
import InterviewSetup from './components/InterviewSetup';
import InterviewRoom from './components/InterviewRoom';
import { Loader2, Sparkles } from 'lucide-react';
import { ConversationProvider } from '@elevenlabs/react';

type PageState = 'setup' | 'interview' | 'complete';

interface InterviewSession {
  resumeText: string;
  jdText: string;
  jobTitle: string;
  persona: string;
  mode: string;
}

export default function Home() {
  const [pageState, setPageState] = useState<PageState>('setup');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleStartInterview = async (
    resumeFile: File, 
    jobDescFile: File, 
    persona: string, 
    mode: string
  ) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('jobDescription', jobDescFile);

      const response = await fetch('/api/analyze-documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Analysis failed');

      const { resumeText, jdText } = await response.json();
      
      startActualInterview(resumeText, jdText, persona, mode);
    } catch (error) {
      console.error('Analysis failed', error);
      alert('Failed to analyze documents. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startActualInterview = (
    resumeText: string, 
    jdText: string, 
    persona: string, 
    mode: string
  ) => {
    setSession({
      resumeText,
      jdText,
      jobTitle: 'Senior Software Developer',
      persona,
      mode
    });
    setPageState('interview');
  };

  const handleExitInterview = () => {
    setPageState('complete');
  };

  const handleReset = () => {
    setSession(null);
    setPageState('setup');
  };

  return (
    <main>
      <ConversationProvider>
        {isAnalyzing && (
          <div className="fixed inset-0 bg-[#06060A]/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-white font-medium text-lg">Analyzing your documents with AI...</p>
            <p className="text-slate-400 text-sm mt-2">Preparing your custom interview space</p>
          </div>
        )}

        {pageState === 'setup' && (
          <InterviewSetup onStartInterview={handleStartInterview} />
        )}
        {pageState === 'interview' && session && (
          <InterviewRoom
            resumeText={session.resumeText}
            jdText={session.jdText}
            jobTitle={session.jobTitle}
            persona={session.persona}
            mode={session.mode}
            onExit={handleExitInterview}
          />
        )}
        {pageState === 'complete' && (
          <div className="min-h-screen bg-[#06060A] flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <Sparkles className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Interview Complete!</h1>
              <p className="text-slate-400 mb-10 leading-relaxed">
                Great job! Your session has been recorded. AI feedback and scores will be available shortly in your dashboard.
              </p>
              <button
                onClick={handleReset}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-slate-200 transition-all duration-300"
              >
                Start New Session
              </button>
            </div>
          </div>
        )}
      </ConversationProvider>
    </main>
  );
}
