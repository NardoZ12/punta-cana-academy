'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { supabaseGet, supabasePost, supabasePatch } from '@/utils/supabase/fetch';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  Video,
  FileText,
  Presentation,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Award,
  AlertCircle,
  RotateCcw,
  HelpCircle,
  Play
} from 'lucide-react';
import { getVideoInfo } from '@/utils/videoEmbed';

interface TopicData {
  id: string;
  title: string;
  unit_id: string;
  course_id: string;
  estimated_minutes: number;
  order_index: number;
  resources?: {
    introduction: string;
    introduction_format: string;
    video_url: string | null;
    video_provider: string | null;
    video_duration_seconds: number | null;
    pdf_url: string | null;
    pdf_title: string | null;
    slides_url: string | null;
    slides_provider: string | null;
    additional_resources: any;
  } | null;
  unit_title?: string;
  course_title?: string;
}

interface TopicProgress {
  id?: string;
  introduction_read: boolean;
  video_watched: boolean;
  video_progress_percent: number;
  pdf_downloaded: boolean;
  slides_viewed: boolean;
  completed: boolean;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: { id: string; text: string; is_correct?: boolean }[];
  points: number;
  order_index: number;
}

interface QuizData {
  id: string;
  title: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes: number | null;
  questions: QuizQuestion[];
}

export default function StudentTopicPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const topicId = params.topicId as string;
  const { profile } = useAuthContext();

  const [topic, setTopic] = useState<TopicData | null>(null);
  const [progress, setProgress] = useState<TopicProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevTopic, setPrevTopic] = useState<{ id: string; title: string } | null>(null);
  const [nextTopic, setNextTopic] = useState<{ id: string; title: string } | null>(null);
  const [marking, setMarking] = useState(false);

  // Quiz state
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizPassed, setQuizPassed] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [previousAttempts, setPreviousAttempts] = useState(0);

  const loadTopicData = useCallback(async () => {
    if (!topicId || !profile?.id) return;

    setLoading(true);
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizAnswers({});
    setShowQuiz(false);

    try {
      console.log('[TopicViewer] Loading topic:', topicId);

      // Load topic data
      const topicArr = await supabaseGet(
        `unit_topics?id=eq.${topicId}&select=*`
      );
      const topicData = topicArr?.[0];
      if (!topicData) {
        setLoading(false);
        return;
      }

      // Load unit title
      const unitArr = await supabaseGet(
        `course_units?id=eq.${topicData.unit_id}&select=title`
      );

      // Load course title
      const courseArr = await supabaseGet(
        `courses?id=eq.${topicData.course_id || courseId}&select=title`
      );

      // Load resources
      const resources = await supabaseGet(
        `topic_resources?topic_id=eq.${topicId}&select=*`
      ).catch(() => []);

      const transformedTopic: TopicData = {
        ...topicData,
        course_id: topicData.course_id || courseId,
        resources: resources?.[0] || null,
        unit_title: unitArr?.[0]?.title || '',
        course_title: courseArr?.[0]?.title || '',
      };
      setTopic(transformedTopic);

      // Load progress
      const progressArr = await supabaseGet(
        `topic_progress?topic_id=eq.${topicId}&student_id=eq.${profile.id}&select=*`
      ).catch(() => []);
      setProgress(progressArr?.[0] || null);

      // Load prev/next topics in same unit
      const allTopics = await supabaseGet(
        `unit_topics?unit_id=eq.${topicData.unit_id}&order=order_index.asc&select=id,title,order_index`
      ).catch(() => []);

      if (allTopics && allTopics.length > 0) {
        const currentIndex = allTopics.findIndex((t: any) => t.id === topicId);
        setPrevTopic(currentIndex > 0 ? allTopics[currentIndex - 1] : null);
        setNextTopic(currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null);
      }

      // Load quiz (evaluation linked to this topic)
      try {
        const evaluations = await supabaseGet(
          `evaluations?topic_id=eq.${topicId}&scope=eq.topic_quiz&is_published=eq.true&select=*`
        ).catch(() => []);

        if (evaluations && evaluations.length > 0) {
          const evalData = evaluations[0];
          
          // PARSEO SEGURO DE PREGUNTAS
          let rawQuestions: any[] = [];
          if (Array.isArray(evalData.questions)) {
            rawQuestions = evalData.questions;
          } else if (typeof evalData.questions === 'string') {
            try { rawQuestions = JSON.parse(evalData.questions); } catch(e) {}
          }

          if (rawQuestions.length > 0) {
            setQuiz({
              id: evalData.id,
              title: evalData.title || 'Quiz del Tema',
              passing_score: evalData.passing_score || 70,
              max_attempts: evalData.max_attempts || 3,
              time_limit_minutes: evalData.time_limit_minutes,
              questions: rawQuestions.map((q: any, idx: number) => {
                
                // PARSEO SEGURO DE OPCIONES (Para evitar crash e invisibilidad)
                let rawOptions: any[] = [];
                if (Array.isArray(q.options)) {
                  rawOptions = q.options;
                } else if (typeof q.options === 'string') {
                  try { rawOptions = JSON.parse(q.options); } catch(e) {}
                }

                const safeOptions = rawOptions.map((opt: any, oIdx: number) => {
                  // Si la opción es solo un string (ej. "Verdadero")
                  if (typeof opt === 'string') {
                    return {
                      id: `opt-${idx}-${oIdx}`,
                      text: opt,
                      is_correct: q.correct_answer === opt || false
                    };
                  }
                  // Si la opción es un objeto
                  return {
                    id: opt?.id || `opt-${idx}-${oIdx}`,
                    text: opt?.text || opt?.label || opt?.value || 'Opción sin texto',
                    is_correct: !!(opt?.is_correct || opt?.isCorrect || opt?.correct)
                  };
                });

                return {
                  id: q.id || `q-${idx}`,
                  question_text: q.question_text || q.text || q.question || 'Pregunta sin texto',
                  question_type: q.question_type || q.type || 'multiple_choice',
                  options: safeOptions,
                  points: q.points || 1,
                  order_index: q.order_index ?? idx,
                };
              }),
            });

            // Check previous attempts
            const attempts = await supabaseGet(
              `evaluation_attempts?evaluation_id=eq.${evalData.id}&student_id=eq.${profile.id}&select=*`
            ).catch(() => []);
            setPreviousAttempts((attempts || []).length);

            // If already passed, show results
            const passed = (attempts || []).find((a: any) => a.passed);
            if (passed) {
              setQuizScore(passed.score);
              setQuizPassed(true);
              setQuizSubmitted(true);
            }
          }
        }
      } catch (e) {
        console.log('[TopicViewer] No quiz for this topic');
      }

      // Register topic access
      await updateProgressField({
        last_accessed_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('[TopicViewer] Error loading topic:', error);
    }

    setLoading(false);
  }, [topicId, profile?.id, courseId]);

  useEffect(() => {
    loadTopicData();
  }, [loadTopicData]);

  const updateProgressField = async (updates: Record<string, any>) => {
    if (!profile?.id || !topicId || !topic) return;

    try {
      // Check if progress record exists
      const existing = await supabaseGet(
        `topic_progress?topic_id=eq.${topicId}&student_id=eq.${profile.id}&select=id`
      ).catch(() => []);

      if (existing && existing.length > 0) {
        await supabasePatch(
          `topic_progress?id=eq.${existing[0].id}`,
          { ...updates, updated_at: new Date().toISOString() }
        );
      } else {
        await supabasePost('topic_progress', {
          student_id: profile.id,
          topic_id: topicId,
          unit_id: topic.unit_id,
          course_id: topic.course_id || courseId,
          ...updates,
        });
      }

      // Reload progress
      const newProgress = await supabaseGet(
        `topic_progress?topic_id=eq.${topicId}&student_id=eq.${profile.id}&select=*`
      ).catch(() => []);
      setProgress(newProgress?.[0] || null);
    } catch (error) {
      console.error('[TopicViewer] Error updating progress:', error);
    }
  };

  const markAsRead = () => updateProgressField({
    introduction_read: true,
    introduction_read_at: new Date().toISOString(),
  });

  const markVideoWatched = () => updateProgressField({
    video_watched: true,
    video_watched_at: new Date().toISOString(),
    video_progress_percent: 100,
  });

  const markPdfDownloaded = () => updateProgressField({
    pdf_downloaded: true,
  });

  const markSlidesViewed = () => updateProgressField({
    slides_viewed: true,
  });

  const markCompleted = async () => {
    setMarking(true);
    await updateProgressField({
      completed: true,
      completed_at: new Date().toISOString(),
      completion_percent: 100,
    });
    setMarking(false);
  };

  // Quiz handlers
  const handleQuizAnswer = (questionId: string, optionId: string) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const submitQuiz = async () => {
    if (!quiz || !profile?.id) return;

    let totalPoints = 0;
    let earnedPoints = 0;

    quiz.questions.forEach(q => {
      totalPoints += q.points;
      const selected = quizAnswers[q.id];
      if (selected) {
        const correctOption = q.options.find(o => o.is_correct);
        if (correctOption && selected === correctOption.id) {
          earnedPoints += q.points;
        }
      }
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passing_score;

    setQuizScore(score);
    setQuizPassed(passed);
    setQuizSubmitted(true);

    // Save attempt
    try {
      await supabasePost('evaluation_attempts', {
        evaluation_id: quiz.id,
        student_id: profile.id,
        attempt_number: previousAttempts + 1,
        score,
        passed,
        answers: quizAnswers,
        status: 'graded',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
      setPreviousAttempts(prev => prev + 1);

      // If passed, update progress
      if (passed) {
        await updateProgressField({
          completed: true,
          completed_at: new Date().toISOString(),
          completion_percent: 100,
        });
      }
    } catch (error) {
      console.error('[TopicViewer] Error saving quiz attempt:', error);
    }
  };

  const retryQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizPassed(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin"></div>
          </div>
          <p className="text-gray-400 text-sm">Cargando contenido...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Tema no encontrado</h2>
          <Link href={`/dashboard/student/course/${courseId}/overview`} className="text-cyan-400 hover:text-cyan-300">
            Volver al curso
          </Link>
        </div>
      </div>
    );
  }

  const videoInfo = topic.resources?.video_url ? getVideoInfo(topic.resources.video_url) : null;
  const hasResources = topic.resources && (
    topic.resources.introduction ||
    topic.resources.video_url ||
    topic.resources.pdf_url ||
    topic.resources.slides_url
  );

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#030712]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={`/dashboard/student/course/${courseId}/overview`}
                className="text-gray-400 hover:text-white flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">
                  {topic.course_title} / {topic.unit_title}
                </p>
                <h1 className="text-base sm:text-lg font-bold text-white truncate">{topic.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {progress?.completed ? (
                <span className="flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full text-xs font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Completado</span>
                </span>
              ) : (
                <button
                  onClick={markCompleted}
                  disabled={marking}
                  className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {marking ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Marcar completado</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {topic.estimated_minutes || 30} min
          </span>
          {topic.resources?.video_url && (() => {
            let extraCount = 0;
            try {
              const ar = topic.resources!.additional_resources;
              const parsed = ar ? (typeof ar === 'string' ? JSON.parse(ar) : ar) : {};
              extraCount = (parsed.videos || []).length;
            } catch { /* ignore */ }
            return (
              <span className="flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                {extraCount > 0 ? `${1 + extraCount} Videos` : 'Video'}
              </span>
            );
          })()}
          {topic.resources?.pdf_url && (
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              PDF
            </span>
          )}
          {topic.resources?.slides_url && (
            <span className="flex items-center gap-1.5">
              <Presentation className="w-4 h-4" />
              Diapositivas
            </span>
          )}
          {quiz && (
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              Quiz
            </span>
          )}
        </div>

        {/* No resources message */}
        {!hasResources && !quiz && (
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Contenido en preparación</h3>
            <p className="text-gray-500 text-sm">El profesor aún no ha agregado recursos a este tema.</p>
          </div>
        )}

        {/* === INTRODUCTION === */}
        {topic.resources?.introduction && (
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Introducción
              </h2>
              {progress?.introduction_read && (
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Leído
                </span>
              )}
            </div>
            <div
              className="prose prose-invert max-w-none text-gray-300 prose-headings:text-white prose-a:text-cyan-400 prose-strong:text-white prose-code:text-cyan-300 prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700"
              dangerouslySetInnerHTML={{ __html: topic.resources.introduction }}
            />
            {!progress?.introduction_read && (
              <button
                onClick={markAsRead}
                className="mt-4 flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar como leído
              </button>
            )}
          </div>
        )}

        {/* === VIDEO === */}
        {videoInfo?.embedUrl && (
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-400" />
                Video Explicativo
              </h2>
              {progress?.video_watched && (
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Visto
                </span>
              )}
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
              <iframe
                src={videoInfo.embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {topic.resources?.video_duration_seconds && (
              <p className="text-xs text-gray-500 mt-2">
                Duración: {Math.floor(topic.resources.video_duration_seconds / 60)}:{String(topic.resources.video_duration_seconds % 60).padStart(2, '0')} min
              </p>
            )}
            {!progress?.video_watched && (
              <button
                onClick={markVideoWatched}
                className="mt-3 flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar video como visto
              </button>
            )}
          </div>
        )}

        {/* === PDF DOCUMENT === */}
        {topic.resources?.pdf_url && (
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-400" />
                Material de Estudio (PDF)
              </h2>
              {progress?.pdf_downloaded && (
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Descargado
                </span>
              )}
            </div>

            {/* PDF Embed */}
            <div className="mb-4 rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
              <iframe
                src={topic.resources.pdf_url.includes('drive.google.com')
                  ? topic.resources.pdf_url.replace('/view', '/preview')
                  : `${topic.resources.pdf_url}#toolbar=1&navpanes=0`
                }
                className="w-full h-[500px] sm:h-[600px]"
                title={topic.resources.pdf_title || 'Documento PDF'}
              />
            </div>

            <a
              href={topic.resources.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => markPdfDownloaded()}
              className="inline-flex items-center gap-3 bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 hover:border-red-500/30 transition-colors"
            >
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">{topic.resources.pdf_title || 'Documento PDF'}</p>
                <p className="text-xs text-gray-500">Abrir en nueva pestaña</p>
              </div>
              <Download className="w-4 h-4 text-gray-400 ml-2" />
            </a>
          </div>
        )}

        {/* === SLIDES === */}
        {topic.resources?.slides_url && (
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Presentation className="w-5 h-5 text-orange-400" />
                Diapositivas
              </h2>
              {progress?.slides_viewed && (
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Visto
                </span>
              )}
            </div>

            {/* Slides Embed */}
            {topic.resources.slides_provider === 'google_slides' || topic.resources.slides_url.includes('docs.google.com') ? (
              <div className="mb-4 rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
                <iframe
                  src={(() => {
                    const url = topic.resources.slides_url!;
                    if (url.includes('/embed')) return url;
                    // Extract presentation ID and build proper embed URL
                    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (match) return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`;
                    // Fallback: replace /edit or /pub with /embed
                    return url.replace(/\/(edit|pub).*$/, '/embed?start=false&loop=false&delayms=3000');
                  })()}
                  className="w-full h-[400px] sm:h-[500px]"
                  allowFullScreen
                  title="Presentación"
                />
              </div>
            ) : topic.resources.slides_provider === 'canva' || topic.resources.slides_url.includes('canva.com') ? (
              <div className="mb-4 rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
                <iframe
                  src={topic.resources.slides_url}
                  className="w-full h-[400px] sm:h-[500px]"
                  allowFullScreen
                  title="Presentación Canva"
                />
              </div>
            ) : null}

            <a
              href={topic.resources.slides_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => markSlidesViewed()}
              className="inline-flex items-center gap-3 bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 hover:border-orange-500/30 transition-colors"
            >
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Presentation className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">
                  {topic.resources.slides_provider === 'google_slides' ? 'Google Slides' :
                   topic.resources.slides_provider === 'canva' ? 'Canva' : 'Ver presentación'}
                </p>
                <p className="text-xs text-gray-500">Abrir en nueva pestaña</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-2" />
            </a>
          </div>
        )}

        {/* === ADDITIONAL VIDEOS === */}
        {(() => {
          // additional_resources is JSONB: { videos: [...], quiz: [...] } or may be a string
          const ar = topic.resources?.additional_resources;
          if (!ar) return null;
          let parsed: { videos?: any[]; quiz?: any[] } = {};
          try { parsed = typeof ar === 'string' ? JSON.parse(ar) : ar; } catch { /* ignore */ }
          const extraVideos = parsed?.videos || [];
          if (extraVideos.length === 0) return null;
          return (
            <div className="space-y-6 mb-6">
              {extraVideos.map((vid: any, i: number) => {
                const info = vid.url ? getVideoInfo(vid.url) : null;
                if (!info?.embedUrl) return null;
                return (
                  <div key={i} className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Video className="w-5 h-5 text-purple-400" />
                      {vid.title || `Video ${i + 2}`}
                    </h2>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
                      <iframe
                        src={info.embedUrl}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    {vid.duration_seconds && vid.duration_seconds > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Duración: {Math.floor(vid.duration_seconds / 60)}:{String(vid.duration_seconds % 60).padStart(2, '0')} min
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* === QUIZ SECTION === */}
        {quiz && quiz.questions.length > 0 && (
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-yellow-400" />
                {quiz.title}
              </h2>
              {quizSubmitted && quizPassed && (
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Aprobado
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                {quiz.passing_score}% para aprobar
              </span>
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" />
                {previousAttempts}/{quiz.max_attempts} intentos
              </span>
              {quiz.time_limit_minutes && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {quiz.time_limit_minutes} min
                </span>
              )}
            </div>

            {/* Quiz Results */}
            {quizSubmitted && (
              <div className={`rounded-xl p-5 mb-6 border ${
                quizPassed
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-red-500/5 border-red-500/20'
              }`}>
                <div className="flex items-center gap-3">
                  {quizPassed ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  )}
                  <div>
                    <p className={`text-lg font-bold ${quizPassed ? 'text-green-400' : 'text-red-400'}`}>
                      {quizScore}% — {quizPassed ? '¡Aprobado!' : 'No aprobado'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {quizPassed
                        ? '¡Excelente trabajo! Has completado este quiz.'
                        : `Necesitas ${quiz.passing_score}% para aprobar.`}
                    </p>
                  </div>
                </div>
                {!quizPassed && previousAttempts < quiz.max_attempts && (
                  <button
                    onClick={retryQuiz}
                    className="mt-4 flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Intentar de nuevo ({quiz.max_attempts - previousAttempts} restante{quiz.max_attempts - previousAttempts !== 1 ? 's' : ''})
                  </button>
                )}
              </div>
            )}

            {/* Quiz Start Button / Questions */}
            {!showQuiz && !quizSubmitted && (
              <button
                onClick={() => setShowQuiz(true)}
                disabled={previousAttempts >= quiz.max_attempts}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black rounded-xl px-6 py-4 font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {previousAttempts >= quiz.max_attempts
                  ? 'Sin intentos restantes'
                  : 'Comenzar Quiz'}
              </button>
            )}

            {showQuiz && !quizSubmitted && (
              <div className="space-y-6">
                {quiz.questions.map((question, qIndex) => (
                  <div key={question.id} className="bg-[#030712] border border-gray-800 rounded-xl p-5">
                    <p className="font-medium text-white mb-4">
                      <span className="text-cyan-400 mr-2">{qIndex + 1}.</span>
                      {question.question_text}
                    </p>
                    <div className="space-y-3">
                      {question.options.map((option) => (
                        <button
                          type="button"
                          key={option.id}
                          onClick={() => handleQuizAnswer(question.id, option.id)}
                          className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                            quizAnswers[question.id] === option.id
                              ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500'
                              : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            quizAnswers[question.id] === option.id
                              ? 'border-cyan-500 bg-cyan-500'
                              : 'border-gray-600'
                          }`}>
                            {quizAnswers[question.id] === option.id && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="text-sm text-gray-300 font-medium">{option.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={submitQuiz}
                  disabled={Object.keys(quizAnswers).length < quiz.questions.length}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl px-6 py-4 font-bold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  Enviar respuestas ({Object.keys(quizAnswers).length}/{quiz.questions.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* === PROGRESS SUMMARY === */}
        <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Tu Progreso</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {topic.resources?.introduction && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                progress?.introduction_read ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'
              }`}>
                <BookOpen className="w-4 h-4" />
                <span>Lectura</span>
              </div>
            )}
            {topic.resources?.video_url && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                progress?.video_watched ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'
              }`}>
                <Video className="w-4 h-4" />
                <span>Video</span>
              </div>
            )}
            {topic.resources?.pdf_url && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                progress?.pdf_downloaded ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'
              }`}>
                <FileText className="w-4 h-4" />
                <span>PDF</span>
              </div>
            )}
            {topic.resources?.slides_url && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                progress?.slides_viewed ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'
              }`}>
                <Presentation className="w-4 h-4" />
                <span>Diapositivas</span>
              </div>
            )}
            {quiz && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                quizPassed ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'
              }`}>
                <HelpCircle className="w-4 h-4" />
                <span>Quiz</span>
              </div>
            )}
          </div>
        </div>

        {/* === NAVIGATION === */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-800">
          {prevTopic ? (
            <Link
              href={`/dashboard/student/course/${courseId}/topic/${prevTopic.id}`}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <div>
                <p className="text-xs text-gray-500">Anterior</p>
                <p className="text-sm font-medium">{prevTopic.title}</p>
              </div>
            </Link>
          ) : <div />}

          {nextTopic ? (
            <Link
              href={`/dashboard/student/course/${courseId}/topic/${nextTopic.id}`}
              className="flex items-center gap-2 text-right text-gray-400 hover:text-white transition-colors"
            >
              <div>
                <p className="text-xs text-gray-500">Siguiente</p>
                <p className="text-sm font-medium">{nextTopic.title}</p>
              </div>
              <ChevronRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              href={`/dashboard/student/course/${courseId}/overview`}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Volver al curso
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
