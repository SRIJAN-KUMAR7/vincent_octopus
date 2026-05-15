'use client';

import React, { useState } from 'react';
import { Upload, FileText, Briefcase, Play, X, User, Code, MessageSquare, Layout, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FileUpload {
  name: string;
  size: number;
  type: 'resume' | 'jobDescription';
  file?: File;
}

interface InterviewSetupProps {
  onStartInterview: (resume: File, jobDesc: File, persona: string, mode: string) => void;
}

const PERSONAS = [
  { id: 'faang', name: 'FAANG Recruiter', icon: User, desc: 'Sets a high bar, focuses on scale and leadership.' },
  { id: 'startup', name: 'Startup Founder', icon: Sparkles, desc: 'Looks for builders, scrappiness, and ownership.' },
  { id: 'hr', name: 'HR Interviewer', icon: MessageSquare, desc: 'Focuses on cultural fit and behavioral alignment.' },
  { id: 'engineer', name: 'Senior Engineer', icon: Code, desc: 'Deep dive into tech, trade-offs, and architecture.' },
];

const MODES = [
  { id: 'technical', name: 'Technical', icon: Code },
  { id: 'behavioral', name: 'Behavioral', icon: MessageSquare },
  { id: 'system_design', name: 'System Design', icon: Layout },
];

export default function InterviewSetup({ onStartInterview }: InterviewSetupProps) {
  const [resume, setResume] = useState<FileUpload | null>(null);
  const [jobDescription, setJobDescription] = useState<FileUpload | null>(null);
  const [dragActive, setDragActive] = useState<'resume' | 'jobDescription' | null>(null);
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0].id);
  const [selectedMode, setSelectedMode] = useState(MODES[0].id);
  const [isReady, setIsReady] = useState(false);

  const isComplete = resume && jobDescription;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDrag = (e: React.DragEvent, type: 'resume' | 'jobDescription') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(type);
    } else if (e.type === 'dragleave') {
      setDragActive(null);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'resume' | 'jobDescription') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const fileData: FileUpload = {
        name: file.name,
        size: file.size,
        type,
        file: file,
      };

      if (type === 'resume') {
        setResume(fileData);
      } else {
        setJobDescription(fileData);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'jobDescription') => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const fileData: FileUpload = {
        name: file.name,
        size: file.size,
        type,
        file: file,
      };

      if (type === 'resume') {
        setResume(fileData);
      } else {
        setJobDescription(fileData);
      }
    }
  };

  const removeFile = (type: 'resume' | 'jobDescription') => {
    if (type === 'resume') {
      setResume(null);
    } else {
      setJobDescription(null);
    }
  };

  const handleStartInterview = () => {
    if (isComplete && resume.file && jobDescription.file) {
      setIsReady(true);
      onStartInterview(resume.file, jobDescription.file, selectedPersona, selectedMode);
    }
  };

  return (
    <div className="min-h-screen bg-[#06060A] text-slate-200 flex items-center justify-center p-4 sm:p-8 font-sans overflow-x-hidden">
      {/* Background ambient blobs */}
      <div className="fixed top-[-10%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-900/10 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Interview Preparation</h1>
          <p className="text-slate-400 text-lg">Configure your persona and upload documents to begin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Config */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Persona Selection */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Interviewer Persona
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersona(p.id)}
                    className={cn(
                      "p-5 rounded-2xl border transition-all duration-300 text-left group",
                      selectedPersona === p.id 
                        ? "bg-purple-500/10 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]" 
                        : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        selectedPersona === p.id ? "bg-purple-500 text-white" : "bg-white/5 text-slate-400 group-hover:text-white"
                      )}>
                        <p.icon className="w-5 h-5" />
                      </div>
                      <span className={cn("font-bold", selectedPersona === p.id ? "text-white" : "text-slate-300")}>{p.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Mode Selection */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Layout className="w-5 h-5 text-indigo-400" />
                Interview Mode
              </h2>
              <div className="flex flex-wrap gap-3">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMode(m.id)}
                    className={cn(
                      "px-6 py-3 rounded-full border transition-all duration-300 flex items-center gap-2 font-medium",
                      selectedMode === m.id 
                        ? "bg-indigo-500 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                        : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                    )}
                  >
                    <m.icon className="w-4 h-4" />
                    {m.name}
                  </button>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column: Uploads */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              Documents
            </h2>

            {/* Resume Upload */}
            <div
              onDragEnter={(e) => handleDrag(e, 'resume')}
              onDragLeave={(e) => handleDrag(e, 'resume')}
              onDragOver={(e) => handleDrag(e, 'resume')}
              onDrop={(e) => handleDrop(e, 'resume')}
              className={cn(
                "relative p-6 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer",
                dragActive === 'resume' ? "border-purple-500 bg-purple-500/5" : 
                resume ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"
              )}
            >
              <input type="file" id="resume-input" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileInput(e, 'resume')} />
              <label htmlFor="resume-input" className="block cursor-pointer">
                {!resume ? (
                  <div className="flex flex-col items-center py-2">
                    <FileText className="w-10 h-10 text-slate-500 mb-3" />
                    <p className="font-semibold text-slate-300 mb-1 text-sm">Upload Resume</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">PDF, DOCX, TXT</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3">
                        <FileText className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-xs truncate">{resume.name}</p>
                        <p className="text-[10px] text-slate-500">{formatFileSize(resume.size)}</p>
                      </div>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); removeFile('resume'); }} className="p-1 hover:bg-white/10 rounded-md transition-colors ml-2">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                )}
              </label>
            </div>

            {/* Job Description Upload */}
            <div
              onDragEnter={(e) => handleDrag(e, 'jobDescription')}
              onDragLeave={(e) => handleDrag(e, 'jobDescription')}
              onDragOver={(e) => handleDrag(e, 'jobDescription')}
              onDrop={(e) => handleDrop(e, 'jobDescription')}
              className={cn(
                "relative p-6 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer",
                dragActive === 'jobDescription' ? "border-purple-500 bg-purple-500/5" : 
                jobDescription ? "border-emerald-500/50 bg-emerald-500/5" : "border-white/10 bg-white/[0.02] hover:border-white/20"
              )}
            >
              <input type="file" id="job-input" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileInput(e, 'jobDescription')} />
              <label htmlFor="job-input" className="block cursor-pointer">
                {!jobDescription ? (
                  <div className="flex flex-col items-center py-2">
                    <Briefcase className="w-10 h-10 text-slate-500 mb-3" />
                    <p className="font-semibold text-slate-300 mb-1 text-sm">Job Description</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">PDF, DOCX, TXT</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Briefcase className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-xs truncate">{jobDescription.name}</p>
                        <p className="text-[10px] text-slate-500">{formatFileSize(jobDescription.size)}</p>
                      </div>
                    </div>
                    <button onClick={(e) => { e.preventDefault(); removeFile('jobDescription'); }} className="p-1 hover:bg-white/10 rounded-md transition-colors ml-2">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                )}
              </label>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartInterview}
              disabled={!isComplete}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-lg transition-all duration-500 flex items-center justify-center gap-3 overflow-hidden relative group",
                isComplete
                  ? "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-white/5 text-slate-600 cursor-not-allowed border border-white/5"
              )}
            >
              <Play className={cn("w-5 h-5", isComplete && "group-hover:translate-x-1 transition-transform duration-300")} />
              <span>Start Interview</span>
              {isComplete && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              )}
            </button>

            <p className="text-[10px] text-center text-slate-500 italic">
              *By clicking Start, you agree to allow ElevenLabs to process your voice for this mock interview session.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
