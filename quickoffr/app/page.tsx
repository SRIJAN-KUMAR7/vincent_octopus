'use client';

import { useState } from 'react';
import InterviewSetup from './components/InterviewSetup';
import InterviewRoom from './components/InterviewRoom';

type PageState = 'setup' | 'interview' | 'complete';

interface InterviewSession {
  resume: string;
  jobDescription: string;
  jobTitle: string;
}

export default function Home() {
  const [pageState, setPageState] = useState<PageState>('setup');
  const [session, setSession] = useState<InterviewSession | null>(null);

  const handleStartInterview = (resumeName: string, jobDescName: string) => {
    setSession({
      resume: resumeName,
      jobDescription: jobDescName,
      jobTitle: 'Senior Software Engineer',
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
      {pageState === 'setup' && (
        <InterviewSetup onStartInterview={handleStartInterview} />
      )}
      {pageState === 'interview' && session && (
        <InterviewRoom
          resumeName={session.resume}
          jobTitle={session.jobTitle}
          onExit={handleExitInterview}
        />
      )}
      {pageState === 'complete' && (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Interview Complete</h1>
            <p className="text-slate-600 mb-8">Thank you for participating in the interview</p>
            <button
              onClick={handleReset}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start New Interview
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
