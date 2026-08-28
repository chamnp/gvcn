"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Award,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  Send,
  HelpCircle,
  Smile,
} from 'lucide-react';
import { HomeworkAssignment, Student, QuizSubmission } from '@/types';
import { ExamQuestion } from '@/lib/question-bank-data';
import { useAppStore } from '@/lib/store';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface StudentQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  homework: HomeworkAssignment;
  students: Student[];
  initialSubmission?: QuizSubmission;
}

export function StudentQuizModal({
  isOpen,
  onClose,
  homework,
  students,
  initialSubmission,
}: StudentQuizModalProps) {
  const { submitQuiz } = useAppStore();

  const questions: ExamQuestion[] = useMemo(() => {
    return homework.quizQuestions || [];
  }, [homework]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialSubmission?.studentId || students[0]?.id || ''
  );
  const [answers, setAnswers] = useState<Record<string, string>>(
    initialSubmission?.answers || {}
  );
  const [isSubmitted, setIsSubmitted] = useState(Boolean(initialSubmission));
  const [submissionResult, setSubmissionResult] = useState<QuizSubmission | null>(
    initialSubmission || null
  );

  // Timer State (Countdown in seconds)
  const totalSeconds = (homework.timeLimitMinutes || 15) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalSeconds);
  const [isTimerActive, setIsTimerActive] = useState(false);

  useEffect(() => {
    if (isOpen && !isSubmitted && homework.timeLimitMinutes && homework.timeLimitMinutes > 0) {
      setIsTimerActive(true);
      setSecondsRemaining(homework.timeLimitMinutes * 60);
    }
  }, [isOpen, isSubmitted, homework]);

  useEffect(() => {
    if (!isTimerActive || secondsRemaining <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, secondsRemaining, isSubmitted]);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  const handleSelectOption = (questionId: string, optionKey: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = () => {
    if (questions.length === 0) return;

    // Check unanswered questions
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length && !confirm(`Em mới làm ${answeredCount}/${questions.length} câu. Em có chắc chắn muốn nộp bài luôn không?`)) {
      return;
    }

    // Auto grading
    let correctCount = 0;
    let earnedPoints = 0;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1.0), 0);

    questions.forEach((q) => {
      const studentAns = (answers[q.id] || '').trim().toUpperCase();
      if (q.type === 'MULTIPLE_CHOICE') {
        const correctOpt = (q.correctAnswer || 'A').trim().toUpperCase();
        if (studentAns === correctOpt || studentAns.startsWith(correctOpt)) {
          correctCount += 1;
          earnedPoints += q.points || 1.0;
        }
      } else {
        // Essay gets full or partial base credit on auto submit
        if (studentAns.length > 5) {
          correctCount += 1;
          earnedPoints += q.points || 1.0;
        }
      }
    });

    const scaledScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) / 10 : 10;

    const sub = submitQuiz({
      homeworkId: homework.id,
      classId: homework.classId,
      studentId: selectedStudentId,
      studentName: currentStudent?.fullName || 'Học sinh',
      answers,
      score: scaledScore,
      totalPoints: 10.0,
      correctCount,
      totalCount: questions.length,
      timeSpentSeconds: totalSeconds - secondsRemaining,
    });

    setSubmissionResult(sub);
    setIsSubmitted(true);
    setIsTimerActive(false);

    // Fire Confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    toast.success(`Đã nộp bài thành công! Điểm của em là ${scaledScore}/10 điểm 🌟`);
  };

  const handleRetake = () => {
    setAnswers({});
    setIsSubmitted(false);
    setSubmissionResult(null);
    setSecondsRemaining(totalSeconds);
    setIsTimerActive(true);
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              📝
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
                  {homework.subjectName}
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                  {homework.className}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black truncate mt-0.5">
                {homework.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {homework.timeLimitMinutes && homework.timeLimitMinutes > 0 && !isSubmitted && (
              <div
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl font-mono text-xs font-black ${
                  secondsRemaining < 120
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-white/20 text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {minutes < 10 ? '0' : ''}{minutes}:{seconds < 10 ? '0' : ''}{seconds}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Student Selector Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-600">Học sinh làm bài:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={isSubmitted}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.fullName} ({st.studentCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-bold">
              Tiến độ: {Object.keys(answers).length}/{questions.length} câu
            </span>
          </div>
        </div>

        {/* Quiz Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs font-sans">
          {/* RESULTS BANNER WHEN SUBMITTED */}
          {isSubmitted && submissionResult && (
            <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 rounded-3xl p-6 text-white text-center space-y-3 shadow-lg animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-3xl shadow-inner">
                {submissionResult.score >= 9 ? '🏆' : submissionResult.score >= 7 ? '🌟' : '💪'}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                  Kết Quả: {submissionResult.score} / 10 Điểm
                </h3>
                <p className="text-xs text-emerald-100">
                  Đúng {submissionResult.correctCount}/{submissionResult.totalCount} câu hỏi • Thời gian làm bài: {Math.round((submissionResult.timeSpentSeconds || 0) / 60)} phút
                </p>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-900 font-black px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-md"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Làm Lại Bài Thi</span>
                </button>
              </div>
            </div>
          )}

          {/* QUESTIONS LIST */}
          {questions.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-slate-500">
              <div className="text-3xl">📄</div>
              <p className="font-bold">Bài tập này không có câu hỏi trắc nghiệm đính kèm.</p>
            </div>
          ) : (
            questions.map((q, idx) => {
              const selectedOpt = answers[q.id];
              const isCorrectAnswer =
                isSubmitted &&
                selectedOpt &&
                (selectedOpt === q.correctAnswer || selectedOpt.startsWith(q.correctAnswer));

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-3xl p-5 sm:p-6 border shadow-xs transition-all space-y-4 ${
                    isSubmitted
                      ? isCorrectAnswer
                        ? 'border-emerald-300 bg-emerald-50/10'
                        : 'border-rose-300 bg-rose-50/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-black text-slate-900 text-xs">Câu {idx + 1}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {q.strand}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {q.points || 1.0} điểm
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-900 font-semibold leading-relaxed whitespace-pre-line">
                    {q.content}
                  </p>

                  {/* Multiple Choice Options */}
                  {q.type === 'MULTIPLE_CHOICE' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const optKey = ['A', 'B', 'C', 'D'][oIdx];
                        const isSelected = selectedOpt === optKey;
                        const isTheCorrectOption = q.correctAnswer.toUpperCase().includes(optKey);

                        let cardStyle = 'bg-slate-50/80 border-slate-200 text-slate-800 hover:bg-indigo-50/50 hover:border-indigo-200';
                        if (isSelected) {
                          cardStyle = 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-black';
                        }
                        if (isSubmitted) {
                          if (isTheCorrectOption) {
                            cardStyle = 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-black';
                          } else if (isSelected && !isTheCorrectOption) {
                            cardStyle = 'bg-rose-500 text-white border-rose-500 shadow-sm line-through';
                          } else {
                            cardStyle = 'bg-slate-100 text-slate-400 border-slate-200';
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => handleSelectOption(q.id, optKey)}
                            className={`p-3.5 rounded-2xl border text-xs text-left transition-all flex items-center space-x-3 cursor-pointer disabled:cursor-default ${cardStyle}`}
                          >
                            <span
                              className={`w-6 h-6 rounded-xl font-bold flex items-center justify-center shrink-0 ${
                                isSelected || (isSubmitted && isTheCorrectOption)
                                  ? 'bg-white/25 text-white'
                                  : 'bg-white text-slate-700 border border-slate-200 shadow-xs'
                              }`}
                            >
                              {optKey}
                            </span>
                            <span className="flex-1">{opt.replace(/^[A-D][.)\s]*/, '')}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay Response Box */}
                  {q.type === 'ESSAY' && (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        disabled={isSubmitted}
                        value={answers[q.id] || ''}
                        onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                        placeholder="Nhập câu trả lời chi tiết của em..."
                        className="w-full p-3 rounded-2xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                      />
                    </div>
                  )}

                  {/* Explanation after submission */}
                  {isSubmitted && q.explanation && (
                    <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-[11px] space-y-0.5">
                      <div className="font-bold flex items-center gap-1 text-amber-800">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Lời giải & Hướng dẫn:</span>
                      </div>
                      <p className="italic text-slate-700">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Submit Footer */}
        {!isSubmitted && questions.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-600 font-bold">
              {Object.keys(answers).length === questions.length ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Đã trả lời đầy đủ {questions.length} câu
                </span>
              ) : (
                <span>Còn {questions.length - Object.keys(answers).length} câu chưa chọn</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs px-6 py-2.5 rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Nộp Bài Thi Ngay</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
