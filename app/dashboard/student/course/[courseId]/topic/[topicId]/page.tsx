'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Video,
  FileText,
  Presentation,
  Download,
  ExternalLink,
  Play,
  ChevronLeft,
  ChevronRight
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
    additional_resources: any[];
  };
  unit?: {
    title: string;
    course?: {
      title: string;
    };
  };
}

interface TopicProgress {
  introduction_read: boolean;
  video_watched: boolean;
  video_progress_percent: number;
  pdf_downloaded: boolean;
  slides_viewed: boolean;
  completed: boolean;
}

export default function StudentTopicPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const topicId = params.topicId as string;
  const { profile } = useAuthContext();
  
  const [topic, setTopic] = useState<TopicData | null>(null);
  const [progress, setProgress] = useState<TopicProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [prevTopic, setPrevTopic] = useState<TopicData | null>(null);
  const [nextTopic, setNextTopic] = useState<TopicData | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    loadTopicData();
  }, [topicId, profile?.id]);

  const loadTopicData = async () => {
    if (!topicId || !profile?.id) return;
    
    setLoading(true);
    
    // Cargar tema con recursos
    const { data: topicData, error: topicError } = await supabase
      .from('unit_topics')
      .select(`
        *,
        unit:course_units(title, course:courses(title)),
        resources:topic_resources(*)
      `)
      .eq('id', topicId)
      .single();

    if (topicError) {
      console.error('Error loading topic:', topicError);
      setLoading(false);
      return;
    }

    // Transformar datos
    const transformedTopic: TopicData = {
      ...topicData,
      unit: topicData.unit,
      resources: topicData.resources?.[0] || null
    };
    setTopic(transformedTopic);

    // Cargar progreso del estudiante
    const { data: progressData } = await supabase
      .from('topic_progress')
      .select('*')
      .eq('topic_id', topicId)
      .eq('student_id', profile.id)
      .single();

    setProgress(progressData);

    // Cargar temas anterior y siguiente
    const { data: allTopics } = await supabase
      .from('unit_topics')
      .select('id, title, order_index, unit_id')
      .eq('unit_id', topicData.unit_id)
      .eq('is_published', true)
      .order('order_index', { ascending: true });

    if (allTopics) {
      const currentIndex = allTopics.findIndex(t => t.id === topicId);
      if (currentIndex > 0) setPrevTopic(allTopics[currentIndex - 1] as any);
      if (currentIndex < allTopics.length - 1) setNextTopic(allTopics[currentIndex + 1] as any);
    }

    // Registrar acceso al tema
    await updateProgress({ first_accessed_at: new Date().toISOString(), last_accessed_at: new Date().toISOString() });

    setLoading(false);
  };

  const updateProgress = async (updates: Partial<TopicProgress & { first_accessed_at?: string; last_accessed_at?: string }>) => {
    if (!profile?.id || !topicId) return;

    const { data: existing } = await supabase
      .from('topic_progress')
      .select('id')
      .eq('topic_id', topicId)
      .eq('student_id', profile.id)
      .single();

    if (existing) {
      await supabase
        .from('topic_progress')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('topic_progress')
        .insert({
          student_id: profile.id,
          topic_id: topicId,
          unit_id: topic?.unit_id,
          course_id: courseId,
          ...updates
        });
    }

    // Recargar progreso
    const { data: newProgress } = await supabase
      .from('topic_progress')
      .select('*')
      .eq('topic_id', topicId)
      .eq('student_id', profile.id)
      .single();
    
    setProgress(newProgress);
  };

  const markAsRead = async () => {
    await updateProgress({ introduction_read: true, introduction_read_at: new Date().toISOString() } as any);
  };

  const markVideoWatched = async () => {
    await updateProgress({ video_watched: true, video_watched_at: new Date().toISOString(), video_progress_percent: 100 } as any);
  };

  const markCompleted = async () => {
    await updateProgress({ 
      completed: true, 
      completed_at: new Date().toISOString(),
      completion_percent: 100 
    } as any);
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

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#030712]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href={`/dashboard/student/course/${courseId}/overview`} 
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{topic.unit?.course?.title} / {topic.unit?.title}</p>
                <h1 className="text-lg font-bold text-white truncate">{topic.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {progress?.completed ? (
                <span className="flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full text-xs font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Completado
                </span>
              ) : (
                <button
                  onClick={markCompleted}
                  className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Marcar como completado
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Meta info */}
        <div className="flex items-center gap-4 mb-8 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {topic.estimated_minutes || 30} min
          </span>
          {topic.resources?.video_url && (
            <span className="flex items-center gap-1.5">
              <Video className="w-4 h-4" />
              Video incluido
            </span>
          )}
          {topic.resources?.pdf_url && (
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Material PDF
            </span>
          )}
        </div>

        {/* Introduction */}
        {topic.resources?.introduction && (
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              Introducción
            </h2>
            <div 
              className="prose prose-invert max-w-none text-gray-300"
              dangerouslySetInnerHTML={{ __html: topic.resources.introduction }}
            />
            {!progress?.introduction_read && (
              <button
                onClick={markAsRead}
                className="mt-4 text-sm text-cyan-400 hover:text-cyan-300"
              >
                ✓ Marcar como leído
              </button>
            )}
          </div>
        )}

        {/* Video */}
        {videoInfo?.embedUrl && (
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-400" />
              Video Explicativo
              {progress?.video_watched && (
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">
                  Visto
                </span>
              )}
            </h2>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
              <iframe
                src={videoInfo.embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {!progress?.video_watched && (
              <button
                onClick={markVideoWatched}
                className="mt-4 text-sm text-purple-400 hover:text-purple-300"
              >
                ✓ Marcar video como visto
              </button>
            )}
          </div>
        )}

        {/* PDF Document */}
        {topic.resources?.pdf_url && (
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-400" />
              Material de Estudio
            </h2>
            <a
              href={topic.resources.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-[#030712] border border-gray-800 rounded-xl p-4 hover:border-red-500/30 transition-colors"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{topic.resources.pdf_title || 'Documento PDF'}</p>
                <p className="text-xs text-gray-500 mt-0.5">Haz clic para ver o descargar</p>
              </div>
              <Download className="w-5 h-5 text-gray-400" />
            </a>
          </div>
        )}

        {/* Slides */}
        {topic.resources?.slides_url && (
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Presentation className="w-5 h-5 text-orange-400" />
              Presentación
            </h2>
            <a
              href={topic.resources.slides_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-[#030712] border border-gray-800 rounded-xl p-4 hover:border-orange-500/30 transition-colors"
            >
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <Presentation className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">Ver presentación</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {topic.resources.slides_provider === 'google_slides' ? 'Google Slides' : 'Presentación'}
                </p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </a>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-800 mt-8">
          {prevTopic ? (
            <Link
              href={`/dashboard/student/course/${courseId}/topic/${prevTopic.id}`}
              className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors"
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
              className="flex items-center gap-3 text-right text-gray-400 hover:text-white transition-colors"
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
