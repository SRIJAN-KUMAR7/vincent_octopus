'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, Briefcase, Play, X } from 'lucide-react';

interface FileUpload {
  name: string;
  size: number;
  type: 'resume' | 'jobDescription';
}

interface InterviewSetupProps {
  onStartInterview: (resumeName: string, jobDescName: string) => void;
}

export default function InterviewSetup({ onStartInterview }: InterviewSetupProps) {
  const [resume, setResume] = useState<FileUpload | null>(null);
  const [jobDescription, setJobDescription] = useState<FileUpload | null>(null);
  const [dragActive, setDragActive] = useState<'resume' | 'jobDescription' | null>(null);
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
    if (isComplete && resume && jobDescription) {
      setIsReady(true);
      // Call parent callback with file names
      onStartInterview(resume.name, jobDescription.name);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Interview Preparation</h1>
          <p className="text-slate-600">Upload your resume and job description to begin</p>
        </div>

        {/* Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Resume Upload */}
          <div
            onDragEnter={(e) => handleDrag(e, 'resume')}
            onDragLeave={(e) => handleDrag(e, 'resume')}
            onDragOver={(e) => handleDrag(e, 'resume')}
            onDrop={(e) => handleDrop(e, 'resume')}
            className={`relative p-8 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
              dragActive === 'resume'
                ? 'border-blue-500 bg-blue-50'
                : resume
                  ? 'border-green-300 bg-green-50'
                  : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <input
              type="file"
              id="resume-input"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => handleFileInput(e, 'resume')}
            />
            <label htmlFor="resume-input" className="block cursor-pointer">
              {!resume ? (
                <div className="flex flex-col items-center justify-center">
                  <FileText className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="font-semibold text-slate-700 mb-1">Upload Resume</p>
                  <p className="text-sm text-slate-500">PDF, DOC, DOCX, or TXT</p>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-center flex-1">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-700 truncate">{resume.name}</p>
                      <p className="text-sm text-slate-500">{formatFileSize(resume.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFile('resume');
                    }}
                    className="ml-2 p-1 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-red-500" />
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
            className={`relative p-8 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
              dragActive === 'jobDescription'
                ? 'border-blue-500 bg-blue-50'
                : jobDescription
                  ? 'border-green-300 bg-green-50'
                  : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            <input
              type="file"
              id="job-input"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => handleFileInput(e, 'jobDescription')}
            />
            <label htmlFor="job-input" className="block cursor-pointer">
              {!jobDescription ? (
                <div className="flex flex-col items-center justify-center">
                  <Briefcase className="w-12 h-12 text-slate-400 mb-3" />
                  <p className="font-semibold text-slate-700 mb-1">Job Description</p>
                  <p className="text-sm text-slate-500">PDF, DOC, DOCX, or TXT</p>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-center flex-1">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <Briefcase className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-700 truncate">{jobDescription.name}</p>
                      <p className="text-sm text-slate-500">{formatFileSize(jobDescription.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFile('jobDescription');
                    }}
                    className="ml-2 p-1 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Start Interview Button */}
        <div className="flex justify-center">
          <button
            onClick={handleStartInterview}
            disabled={!isComplete}
            className={`group relative px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 flex items-center gap-3 ${
              isComplete
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-2xl cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play className={`w-5 h-5 ${isComplete ? 'group-hover:translate-x-1' : ''} transition-transform`} />
            Start Interview
          </button>
        </div>

        {/* Status */}
        <div className="mt-8 text-center">
          {isComplete ? (
            <p className="text-sm text-green-600 font-medium">✓ Ready to begin interview</p>
          ) : (
            <p className="text-sm text-slate-500">
              {!resume && !jobDescription
                ? 'Upload both files to continue'
                : !resume
                  ? 'Please upload your resume'
                  : 'Please upload job description'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
