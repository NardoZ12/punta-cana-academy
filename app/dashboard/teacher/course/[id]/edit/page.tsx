'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { 
  ArrowLeft, Save, Eye, EyeOff, Settings, Image as ImageIcon, 
  BookOpen, Video, FileText, Presentation, Plus, Trash2, Edit2, 
  ChevronDown, ChevronRight, GripVertical, X, Upload, Clock, File,
  Check, AlertCircle, ClipboardList, FileUp, PenTool, Settings2, ExternalLink, Users
} from 'lucide-react';
import TopicResourceEditor, { TopicResourceData } from '@/components/teacher/TopicResourceEditor';
import { getVideoInfo } from '@/utils/videoEmbed';

// Tipos
interface CourseUnit {
  id: string;
  course_id: string;
  title: string;
  description: string;
  learning_objectives: string[];
  order_index: number;
  is_published: boolean;
  estimated_hours: number;
  topics?: UnitTopic[];
  assessment?: UnitAssessment | null;
}

// Evaluación de unidad
interface UnitAssessment {
  id: string;
  unit_id: string;
  course_id: string;
  title: string;
  description: string;
  type: 'quiz' | 'file_upload' | 'mixed';
  time_limit_minutes: number | null;
  passing_score: number;
  max_attempts: number;
  is_published: boolean;
  file_url: string | null;
  file_type: string | null;
  questions: AssessmentQuestion[];
  created_at?: string;
}

interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: number | string;
  points: number;
  explanation?: string;
}

interface UnitTopic {
  id: string;
  unit_id: string;
  course_id: string;
  title: string;
  order_index: number;
  is_published: boolean;
  estimated_minutes: number;
  resources?: TopicResources;
}

interface TopicResources {
  id: string;
  topic_id: string;
  introduction: string;
  introduction_format: string;
  video_url: string;
  video_provider: string;
  video_duration_seconds: number;
  pdf_url: string;
  pdf_title: string;
  slides_url: string;
  slides_provider: string;
  is_published: boolean;
  additional_resources?: string;
}

// Estado para crear tema con recursos
interface NewTopicWithResources {
  unitId: string;
  title: string;
  estimated_minutes: number;
  is_published: boolean;
  introduction: string;
  videos: Array<{
    id: string;
    url: string;
    title: string;
    provider: 'youtube' | 'vimeo' | 'unknown';
    embedUrl: string | null;
    duration_seconds?: number;
  }>;
  documents: Array<{
    type: 'pdf' | 'slides' | 'other';
    url: string;
    title: string;
    provider?: string;
  }>;
  quiz: Array<{
    id: string;
    text: string;
    type: 'multiple_choice' | 'true_false';
    options: string[];
    correctAnswer: number;
    points: number;
  }>;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  price: number;
  level: string;
  category: string;
  image_url: string;
  is_published: boolean;
  max_students: number;
  duration_hours: number;
  start_date: string;
  end_date: string;
}

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'media', label: 'Multimedia', icon: ImageIcon },
  { id: 'curriculum', label: 'Temario', icon: BookOpen },
  { id: 'settings', label: 'Ajustes', icon: Clock },
];

const VIDEO_PROVIDERS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'cloudflare', label: 'Cloudflare Stream' },
  { value: 'bunny', label: 'Bunny.net' },
  { value: 'custom', label: 'URL Directa' },
];

const SLIDES_PROVIDERS = [
  { value: 'google_slides', label: 'Google Slides' },
  { value: 'canva', label: 'Canva' },
  { value: 'pdf', label: 'PDF' },
  { value: 'custom', label: 'URL Directa' },
];

export default function EditCoursePage() {
  const params = useParams();
  const supabase = createClient();
  const courseId = params?.id as string;

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [courseData, setCourseData] = useState<CourseData>({
    id: '', title: '', description: '', price: 0, level: 'beginner',
    category: '', image_url: '', is_published: false, max_students: 30,
    duration_hours: 10, start_date: '', end_date: ''
  });

  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [editingUnit, setEditingUnit] = useState<CourseUnit | null>(null);
  const [editingTopic, setEditingTopic] = useState<UnitTopic | null>(null);
  const [editingResources, setEditingResources] = useState<{topic: UnitTopic, resources: Partial<TopicResources>} | null>(null);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [addingTopicToUnit, setAddingTopicToUnit] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  
  // NUEVO: Estado para crear tema con recursos completos
  const [creatingTopicWithResources, setCreatingTopicWithResources] = useState<string | null>(null);
  const [newTopicData, setNewTopicData] = useState<NewTopicWithResources | null>(null);

  // NUEVO: Estado para evaluación de unidad
  const [editingAssessment, setEditingAssessment] = useState<{ unit: CourseUnit; assessment: Partial<UnitAssessment> } | null>(null);

  useEffect(() => { fetchCourseData(); }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    const { data: course } = await supabase.from('courses').select('*').eq('id', courseId).single();
    if (course) {
      setCourseData({
        id: course.id, title: course.title || '', description: course.description || '',
        price: course.price || 0, level: course.level || 'beginner', category: course.category || '',
        image_url: course.image_url || '', is_published: course.is_published || false,
        max_students: course.max_students || 30, duration_hours: course.duration_hours || 10,
        start_date: course.start_date || '', end_date: course.end_date || ''
      });
    }
    const { data: unitsData } = await supabase.from('course_units')
      .select(`*, topics:unit_topics(*, resources:topic_resources(*))`)
      .eq('course_id', courseId).order('order_index', { ascending: true });
    if (unitsData) {
      const processed = unitsData.map(u => ({
        ...u, topics: u.topics?.sort((a: any, b: any) => a.order_index - b.order_index)
          .map((t: any) => ({ ...t, resources: t.resources?.[0] || null })) || []
      }));
      setUnits(processed);
      if (processed.length > 0) setExpandedUnits(new Set([processed[0].id]));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('courses').update({
      title: courseData.title, description: courseData.description, price: courseData.price,
      level: courseData.level, category: courseData.category, max_students: courseData.max_students,
      duration_hours: courseData.duration_hours, start_date: courseData.start_date || null, end_date: courseData.end_date || null
    }).eq('id', courseId);
    setSaving(false);
    alert(error ? 'Error: ' + error.message : '✓ Cambios guardados');
  };

  const handleTogglePublish = async () => {
    const newStatus = !courseData.is_published;
    const { error } = await supabase.from('courses').update({ is_published: newStatus }).eq('id', courseId);
    if (!error) setCourseData(prev => ({ ...prev, is_published: newStatus }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const fileName = `course-${courseId}-${Date.now()}.${file.name.split('.').pop()}`;
    setUploading(true);
    const { error } = await supabase.storage.from('Courses').upload(fileName, file);
    if (error) { alert('Error: ' + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('Courses').getPublicUrl(fileName);
    await supabase.from('courses').update({ image_url: publicUrl }).eq('id', courseId);
    setCourseData(prev => ({ ...prev, image_url: publicUrl }));
    setUploading(false);
  };

  const handleAddUnit = async () => {
    if (!newUnitTitle.trim()) return;
    const { data, error } = await supabase.from('course_units').insert({
      course_id: courseId, title: newUnitTitle, order_index: units.length, is_published: false
    }).select().single();
    if (!error && data) {
      setUnits([...units, { ...data, topics: [] }]);
      setNewUnitTitle('');
      setExpandedUnits(prev => new Set([...prev, data.id]));
    }
  };

  const handleUpdateUnit = async (unit: CourseUnit) => {
    const { error } = await supabase.from('course_units').update({
      title: unit.title, description: unit.description, learning_objectives: unit.learning_objectives,
      estimated_hours: unit.estimated_hours, is_published: unit.is_published
    }).eq('id', unit.id);
    if (!error) { setUnits(units.map(u => u.id === unit.id ? unit : u)); setEditingUnit(null); }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('¿Eliminar esta unidad y todo su contenido?')) return;
    const { error } = await supabase.from('course_units').delete().eq('id', unitId);
    if (!error) setUnits(units.filter(u => u.id !== unitId));
  };

  const handleAddTopic = async (unitId: string) => {
    if (!newTopicTitle.trim()) return;
    const unit = units.find(u => u.id === unitId);
    const { data, error } = await supabase.from('unit_topics').insert({
      unit_id: unitId, course_id: courseId, title: newTopicTitle,
      order_index: unit?.topics?.length || 0, is_published: false
    }).select().single();
    if (!error && data) {
      setUnits(units.map(u => u.id === unitId ? { ...u, topics: [...(u.topics || []), { ...data, resources: null }] } : u));
      setNewTopicTitle(''); setAddingTopicToUnit(null);
    }
  };

  const handleUpdateTopic = async (topic: UnitTopic) => {
    const { error } = await supabase.from('unit_topics').update({
      title: topic.title, estimated_minutes: topic.estimated_minutes, is_published: topic.is_published
    }).eq('id', topic.id);
    if (!error) {
      setUnits(units.map(u => ({ ...u, topics: u.topics?.map(t => t.id === topic.id ? topic : t) })));
      setEditingTopic(null);
    }
  };

  const handleDeleteTopic = async (topicId: string, unitId: string) => {
    if (!confirm('¿Eliminar este tema?')) return;
    const { error } = await supabase.from('unit_topics').delete().eq('id', topicId);
    if (!error) setUnits(units.map(u => u.id === unitId ? { ...u, topics: u.topics?.filter(t => t.id !== topicId) } : u));
  };

  // NUEVO: Iniciar creación de tema con recursos
  const handleStartCreateTopicWithResources = (unitId: string) => {
    setCreatingTopicWithResources(unitId);
    setNewTopicData({
      unitId,
      title: '',
      estimated_minutes: 30,
      is_published: false,
      introduction: '',
      videos: [],
      documents: [],
      quiz: []
    });
  };

  // NUEVO: Crear tema con todos sus recursos
  const handleCreateTopicWithResources = async () => {
    if (!newTopicData || !newTopicData.title.trim()) {
      alert('Por favor ingresa un título para el tema');
      return;
    }

    const unit = units.find(u => u.id === newTopicData.unitId);
    if (!unit) return;

    // 1. Crear el tema
    const { data: topicData, error: topicError } = await supabase.from('unit_topics').insert({
      unit_id: newTopicData.unitId,
      course_id: courseId,
      title: newTopicData.title,
      order_index: unit.topics?.length || 0,
      is_published: newTopicData.is_published,
      estimated_minutes: newTopicData.estimated_minutes
    }).select().single();

    if (topicError || !topicData) {
      alert('Error al crear el tema: ' + topicError?.message);
      return;
    }

    // 2. Crear los recursos del tema
    const mainVideo = newTopicData.videos[0];
    const additionalVideos = newTopicData.videos.slice(1);
    const pdfDoc = newTopicData.documents.find(d => d.type === 'pdf');
    const slidesDoc = newTopicData.documents.find(d => d.type === 'slides');

    const resourcePayload = {
      topic_id: topicData.id,
      unit_id: newTopicData.unitId,
      course_id: courseId,
      introduction: newTopicData.introduction || '',
      introduction_format: 'markdown',
      video_url: mainVideo?.url || null,
      video_provider: mainVideo?.provider || null,
      video_duration_seconds: mainVideo?.duration_seconds || null,
      pdf_url: pdfDoc?.url || null,
      pdf_title: pdfDoc?.title || null,
      slides_url: slidesDoc?.url || null,
      slides_provider: slidesDoc?.provider || null,
      is_published: newTopicData.is_published,
      additional_resources: JSON.stringify({
        videos: additionalVideos,
        quiz: newTopicData.quiz
      })
    };

    const { data: resourceData } = await supabase
      .from('topic_resources')
      .insert(resourcePayload)
      .select()
      .single();

    // 3. Actualizar estado local
    setUnits(units.map(u => u.id === newTopicData.unitId ? {
      ...u,
      topics: [...(u.topics || []), { ...topicData, resources: resourceData || null }]
    } : u));

    // 4. Limpiar estados
    setCreatingTopicWithResources(null);
    setNewTopicData(null);
  };

  const handleSaveResources = async (topicId: string, data: TopicResourceData) => {
    const topic = editingResources?.topic;
    if (!topic) return;
    
    // Extraer video principal y adicionales
    const mainVideo = data.videos[0];
    const additionalVideos = data.videos.slice(1);
    const pdfDoc = data.documents.find(d => d.type === 'pdf');
    const slidesDoc = data.documents.find(d => d.type === 'slides');
    
    const { data: existing } = await supabase.from('topic_resources').select('id').eq('topic_id', topicId).single();
    
    const payload = {
      introduction: data.introduction || '',
      introduction_format: data.introduction_format || 'markdown',
      video_url: mainVideo?.url || null,
      video_provider: mainVideo?.provider || null,
      video_duration_seconds: mainVideo?.duration_seconds || null,
      pdf_url: pdfDoc?.url || null,
      pdf_title: pdfDoc?.title || null,
      slides_url: slidesDoc?.url || null,
      slides_provider: slidesDoc?.provider || null,
      is_published: data.is_published || false,
      // Guardar videos adicionales y quiz como JSON
      additional_resources: JSON.stringify({
        videos: additionalVideos,
        quiz: data.quiz
      })
    };
    
    let result;
    if (existing) {
      result = await supabase.from('topic_resources').update(payload).eq('id', existing.id).select().single();
    } else {
      result = await supabase.from('topic_resources').insert({ topic_id: topicId, unit_id: topic.unit_id, course_id: courseId, ...payload }).select().single();
    }
    
    if (!result.error && result.data) {
      setUnits(units.map(u => ({ ...u, topics: u.topics?.map(t => t.id === topicId ? { ...t, resources: result.data as TopicResources } : t) })));
      setEditingResources(null);
    } else {
      throw new Error(result.error?.message || 'Error al guardar');
    }
  };

  const toggleUnit = (unitId: string) => {
    const n = new Set(expandedUnits);
    if (n.has(unitId)) n.delete(unitId); else n.add(unitId);
    setExpandedUnits(n);
  };

  // NUEVO: Abrir editor de evaluación de unidad
  const handleOpenAssessment = (unit: CourseUnit) => {
    setEditingAssessment({
      unit,
      assessment: unit.assessment || {
        unit_id: unit.id,
        course_id: courseId,
        title: `Evaluación: ${unit.title}`,
        description: '',
        type: 'quiz',
        time_limit_minutes: 30,
        passing_score: 70,
        max_attempts: 3,
        is_published: false,
        file_url: null,
        file_type: null,
        questions: []
      }
    });
  };

  // NUEVO: Guardar evaluación de unidad
  const handleSaveAssessment = async (assessmentData: Partial<UnitAssessment>) => {
    if (!editingAssessment) return;
    
    const { unit } = editingAssessment;
    
    const payload = {
      unit_id: unit.id,
      course_id: courseId,
      title: assessmentData.title || `Evaluación: ${unit.title}`,
      description: assessmentData.description || '',
      type: assessmentData.type || 'quiz',
      time_limit_minutes: assessmentData.time_limit_minutes || null,
      passing_score: assessmentData.passing_score || 70,
      max_attempts: assessmentData.max_attempts || 3,
      is_published: assessmentData.is_published || false,
      file_url: assessmentData.file_url || null,
      file_type: assessmentData.file_type || null,
      questions: JSON.stringify(assessmentData.questions || [])
    };

    let result;
    if (unit.assessment?.id) {
      result = await supabase.from('unit_assessments').update(payload).eq('id', unit.assessment.id).select().single();
    } else {
      result = await supabase.from('unit_assessments').insert(payload).select().single();
    }

    if (!result.error && result.data) {
      const savedAssessment = {
        ...result.data,
        questions: assessmentData.questions || []
      } as UnitAssessment;
      
      setUnits(units.map(u => u.id === unit.id ? { ...u, assessment: savedAssessment } : u));
      setEditingAssessment(null);
    } else {
      alert('Error al guardar: ' + result.error?.message);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#030712] flex items-center justify-center"><div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#030712]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/teacher" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
              <div>
                <h1 className="text-xl font-bold text-white truncate max-w-md">{courseData.title || 'Editar Curso'}</h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${courseData.is_published ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {courseData.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  {courseData.is_published ? 'Publicado' : 'Borrador'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href={`/dashboard/teacher/course/${courseId}/progress`}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Users className="w-4 h-4" />
                Ver Progreso
              </Link>
              <button onClick={handleTogglePublish} className={`px-4 py-2 rounded-lg text-sm font-medium ${courseData.is_published ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
                {courseData.is_published ? 'Despublicar' : 'Publicar'}
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-medium px-4 py-2 rounded-lg text-sm">
                <Save className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto py-2">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap ${activeTab === tab.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tab: General */}
        {activeTab === 'general' && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-6">Información del Curso</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Título *</label>
                  <input type="text" value={courseData.title} onChange={e => setCourseData({ ...courseData, title: e.target.value })} 
                    className="w-full bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Descripción</label>
                  <textarea value={courseData.description} onChange={e => setCourseData({ ...courseData, description: e.target.value })} rows={4} 
                    className="w-full bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Nivel</label>
                    <select value={courseData.level} onChange={e => setCourseData({ ...courseData, level: e.target.value })} 
                      className="w-full bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none">
                      <option value="beginner">Principiante</option>
                      <option value="intermediate">Intermedio</option>
                      <option value="advanced">Avanzado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Categoría</label>
                    <input type="text" value={courseData.category} onChange={e => setCourseData({ ...courseData, category: e.target.value })} 
                      className="w-full bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Precio (USD)</label>
                    <input type="number" value={courseData.price} onChange={e => setCourseData({ ...courseData, price: parseFloat(e.target.value) || 0 })} 
                      className="w-full bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Duración (horas)</label>
                    <input type="number" value={courseData.duration_hours} onChange={e => setCourseData({ ...courseData, duration_hours: parseInt(e.target.value) || 0 })} 
                      className="w-full bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Media */}
        {activeTab === 'media' && (
          <div className="max-w-3xl">
            <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-6">Imagen de Portada</h2>
              <div className="flex flex-col items-center justify-center">
                {courseData.image_url ? (
                  <div className="relative w-full max-w-md">
                    <img src={courseData.image_url} alt="Portada" className="w-full aspect-video object-cover rounded-xl" />
                    <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-xl">
                      <div className="text-center"><Upload className="w-8 h-8 mx-auto mb-2" /><span className="text-sm">Cambiar</span></div>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="w-full max-w-md aspect-video bg-[#030712] border-2 border-dashed border-gray-700 hover:border-cyan-500 rounded-xl flex flex-col items-center justify-center cursor-pointer">
                    <ImageIcon className="w-12 h-12 text-gray-600 mb-3" />
                    <span className="text-gray-400 text-sm">{uploading ? 'Subiendo...' : 'Subir imagen'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Curriculum */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Estructura del Curso</h2>
                <p className="text-sm text-gray-400 mt-1">Organiza el contenido en unidades y temas</p>
              </div>
              <div className="text-sm text-gray-400">
                {units.length} unidades · {units.reduce((acc, u) => acc + (u.topics?.length || 0), 0)} temas
              </div>
            </div>

            <div className="space-y-4">
              {units.map((unit, ui) => (
                <div key={unit.id} className="bg-[#0a0f1a] border border-gray-800 rounded-2xl overflow-hidden">
                  {/* Unit Header */}
                  <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-800/30" onClick={() => toggleUnit(unit.id)}>
                    <GripVertical className="w-5 h-5 text-gray-500" />
                    <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400 font-bold text-sm">{ui + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">{unit.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${unit.is_published ? 'bg-green-500/10 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                          {unit.is_published ? 'Publicada' : 'Borrador'}
                        </span>
                        {unit.assessment && (
                          <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                            <ClipboardList className="w-3 h-3" /> Evaluación
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{unit.topics?.length || 0} temas · {unit.estimated_hours || 0}h</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenAssessment(unit); }} 
                        className={`p-2 rounded-lg ${unit.assessment ? 'text-purple-400 hover:bg-purple-500/10' : 'text-gray-400 hover:text-purple-400 hover:bg-purple-500/10'}`}
                        title="Evaluación de unidad"
                      >
                        <ClipboardList className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingUnit(unit); }} className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteUnit(unit.id); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedUnits.has(unit.id) ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  {/* Topics (expanded) */}
                  {expandedUnits.has(unit.id) && (
                    <div className="border-t border-gray-800 p-4 bg-[#030712]/50">
                      <div className="space-y-2">
                        {unit.topics?.map((topic, ti) => (
                          <div key={topic.id} className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-3 hover:border-gray-700">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500 text-sm font-medium w-6">{ui + 1}.{ti + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm truncate">{topic.title}</span>
                                  {topic.resources && (
                                    <div className="flex items-center gap-1">
                                      {topic.resources.video_url && <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded text-xs">Video</span>}
                                      {topic.resources.pdf_url && <span className="bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded text-xs">PDF</span>}
                                      {topic.resources.slides_url && <span className="bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded text-xs">Slides</span>}
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{topic.estimated_minutes || 30} min</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => setEditingResources({ topic, resources: topic.resources || { introduction: '', introduction_format: 'markdown', video_url: '', video_provider: 'youtube', pdf_url: '', pdf_title: '', slides_url: '', slides_provider: 'google_slides', is_published: false } })} 
                                  className="px-3 py-1.5 text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-lg">
                                  Recursos
                                </button>
                                <button onClick={() => setEditingTopic(topic)} className="p-1.5 text-gray-400 hover:text-white rounded-lg">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteTopic(topic.id, unit.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Topic - Botones */}
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={() => handleStartCreateTopicWithResources(unit.id)} 
                          className="flex-1 py-3 border border-dashed border-cyan-500/50 text-cyan-400 rounded-xl hover:bg-cyan-500/10 text-sm flex items-center justify-center gap-2 transition-colors">
                          <Plus className="w-4 h-4" />
                          Agregar tema con recursos
                        </button>
                        <button 
                          onClick={() => setAddingTopicToUnit(unit.id)} 
                          className="px-4 py-3 border border-dashed border-gray-700 text-gray-400 rounded-xl hover:border-gray-600 text-sm flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Solo título
                        </button>
                      </div>
                      
                      {/* Input rápido para agregar solo título */}
                      {addingTopicToUnit === unit.id && (
                        <div className="flex gap-2 mt-3">
                          <input type="text" value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} 
                            placeholder="Título del tema..." 
                            className="flex-1 bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" 
                            autoFocus onKeyPress={e => e.key === 'Enter' && handleAddTopic(unit.id)} />
                          <button onClick={() => handleAddTopic(unit.id)} className="px-3 py-2 bg-cyan-500 text-black rounded-lg text-sm font-medium">Agregar</button>
                          <button onClick={() => { setAddingTopicToUnit(null); setNewTopicTitle(''); }} className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm">Cancelar</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Unit */}
            <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-4">
              <div className="flex gap-3">
                <input type="text" value={newUnitTitle} onChange={e => setNewUnitTitle(e.target.value)} 
                  placeholder="Nueva unidad..." 
                  className="flex-1 bg-[#030712] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none" 
                  onKeyPress={e => e.key === 'Enter' && handleAddUnit()} />
                <button onClick={handleAddUnit} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-xl flex items-center gap-2">
                  <Plus className="w-4 h-4" />Crear Unidad
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Settings */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-6">Configuración</h2>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Máximo estudiantes</label>
                    <input type="number" value={courseData.max_students} onChange={e => setCourseData({ ...courseData, max_students: parseInt(e.target.value) || 30 })} 
                      className="w-full bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Fecha inicio</label>
                    <input type="date" value={courseData.start_date?.split('T')[0] || ''} onChange={e => setCourseData({ ...courseData, start_date: e.target.value })} 
                      className="w-full bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Fecha fin</label>
                    <input type="date" value={courseData.end_date?.split('T')[0] || ''} onChange={e => setCourseData({ ...courseData, end_date: e.target.value })} 
                      className="w-full bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Estado del Curso</h3>
                  <p className="text-sm text-gray-400 mt-1">{courseData.is_published ? 'Visible para estudiantes' : 'Oculto'}</p>
                </div>
                <button onClick={handleTogglePublish} className={`px-6 py-3 rounded-xl font-medium ${courseData.is_published ? 'bg-red-500/10 text-red-400' : 'bg-green-500 text-white'}`}>
                  {courseData.is_published ? 'Despublicar' : 'Publicar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Edit Unit */}
      {editingUnit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Editar Unidad</h2>
              <button onClick={() => setEditingUnit(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Título</label>
                <input type="text" value={editingUnit.title} onChange={e => setEditingUnit({ ...editingUnit, title: e.target.value })} 
                  className="w-full bg-[#030712] border border-gray-800 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Descripción</label>
                <textarea value={editingUnit.description || ''} onChange={e => setEditingUnit({ ...editingUnit, description: e.target.value })} rows={3} 
                  className="w-full bg-[#030712] border border-gray-800 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Horas estimadas</label>
                <input type="number" step="0.5" value={editingUnit.estimated_hours || 0} onChange={e => setEditingUnit({ ...editingUnit, estimated_hours: parseFloat(e.target.value) || 0 })} 
                  className="w-full bg-[#030712] border border-gray-800 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="unit-pub" checked={editingUnit.is_published} onChange={e => setEditingUnit({ ...editingUnit, is_published: e.target.checked })} className="w-4 h-4 accent-cyan-500" />
                <label htmlFor="unit-pub" className="text-sm text-gray-300">Publicar unidad</label>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-800">
              <button onClick={() => setEditingUnit(null)} className="flex-1 bg-gray-800 text-white py-2.5 rounded-lg font-medium">Cancelar</button>
              <button onClick={() => handleUpdateUnit(editingUnit)} className="flex-1 bg-cyan-500 text-black py-2.5 rounded-lg font-medium">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Topic */}
      {editingTopic && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Editar Tema</h2>
              <button onClick={() => setEditingTopic(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Título</label>
                <input type="text" value={editingTopic.title} onChange={e => setEditingTopic({ ...editingTopic, title: e.target.value })} 
                  className="w-full bg-[#030712] border border-gray-800 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Duración (min)</label>
                <input type="number" value={editingTopic.estimated_minutes || 30} onChange={e => setEditingTopic({ ...editingTopic, estimated_minutes: parseInt(e.target.value) || 30 })} 
                  className="w-full bg-[#030712] border border-gray-800 rounded-lg p-3 text-white focus:border-cyan-500 focus:outline-none" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="topic-pub" checked={editingTopic.is_published} onChange={e => setEditingTopic({ ...editingTopic, is_published: e.target.checked })} className="w-4 h-4 accent-cyan-500" />
                <label htmlFor="topic-pub" className="text-sm text-gray-300">Publicar tema</label>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-800">
              <button onClick={() => setEditingTopic(null)} className="flex-1 bg-gray-800 text-white py-2.5 rounded-lg font-medium">Cancelar</button>
              <button onClick={() => handleUpdateTopic(editingTopic)} className="flex-1 bg-cyan-500 text-black py-2.5 rounded-lg font-medium">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Resources - Nuevo Editor Rico */}
      {editingResources && (
        <TopicResourceEditor
          topicId={editingResources.topic.id}
          topicTitle={editingResources.topic.title}
          unitId={editingResources.topic.unit_id}
          courseId={courseId}
          initialData={{
            introduction: editingResources.resources.introduction || '',
            introduction_format: (editingResources.resources.introduction_format as 'markdown' | 'html' | 'plain') || 'markdown',
            videos: editingResources.resources.video_url ? [{
              id: 'main',
              url: editingResources.resources.video_url,
              title: 'Video principal',
              provider: (editingResources.resources.video_provider as 'youtube' | 'vimeo' | 'unknown') || 'youtube',
              embedUrl: getVideoInfo(editingResources.resources.video_url || '').embedUrl,
              duration_seconds: editingResources.resources.video_duration_seconds
            }] : [],
            documents: [
              editingResources.resources.pdf_url ? {
                type: 'pdf' as const,
                url: editingResources.resources.pdf_url,
                title: editingResources.resources.pdf_title || ''
              } : null,
              editingResources.resources.slides_url ? {
                type: 'slides' as const,
                url: editingResources.resources.slides_url,
                title: '',
                provider: (editingResources.resources.slides_provider as 'google_slides' | 'canva' | 'pdf' | 'custom') || 'google_slides'
              } : null
            ].filter(Boolean) as any[],
            quiz: [],
            is_published: editingResources.resources.is_published || false
          }}
          onSave={(data) => handleSaveResources(editingResources.topic.id, data)}
          onClose={() => setEditingResources(null)}
        />
      )}

      {/* NUEVO: Modal para crear tema con recursos completos */}
      {creatingTopicWithResources && newTopicData && (
        <CreateTopicWithResourcesModal
          data={newTopicData}
          onChange={setNewTopicData}
          onSave={handleCreateTopicWithResources}
          onClose={() => {
            setCreatingTopicWithResources(null);
            setNewTopicData(null);
          }}
        />
      )}

      {/* Modal: Evaluación de Unidad */}
      {editingAssessment && (
        <UnitAssessmentEditorModal
          unit={editingAssessment}
          existingAssessment={editingAssessment.assessment || null}
          courseId={courseId}
          onSave={handleSaveAssessment}
          onClose={() => setEditingAssessment(null)}
        />
      )}
    </div>
  );
}

// Unit Assessment Editor Modal
function UnitAssessmentEditorModal({
  unit,
  existingAssessment,
  courseId,
  onSave,
  onClose
}: {
  unit: CourseUnit;
  existingAssessment: UnitAssessment | null;
  courseId: string;
  onSave: (assessment: Partial<UnitAssessment>) => Promise<void>;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'settings' | 'upload' | 'create'>('settings');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [data, setData] = useState<{
    title: string;
    description: string;
    type: 'quiz' | 'file_upload' | 'mixed';
    time_limit_minutes: number | null;
    passing_score: number;
    max_attempts: number;
    is_published: boolean;
    file_url: string | null;
    file_type: string | null;
    questions: AssessmentQuestion[];
  }>({
    title: existingAssessment?.title || `Evaluación: ${unit.title}`,
    description: existingAssessment?.description || '',
    type: existingAssessment?.type || 'quiz',
    time_limit_minutes: existingAssessment?.time_limit_minutes || 30,
    passing_score: existingAssessment?.passing_score || 70,
    max_attempts: existingAssessment?.max_attempts || 3,
    is_published: existingAssessment?.is_published || false,
    file_url: existingAssessment?.file_url || null,
    file_type: existingAssessment?.file_type || null,
    questions: existingAssessment?.questions || []
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten archivos PDF o Word');
      return;
    }

    setUploading(true);
    try {
      const fileName = `${courseId}/assessments/${unit.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error } = await supabase.storage
        .from('Courses')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('Courses')
        .getPublicUrl(fileName);

      setData(prev => ({
        ...prev,
        file_url: publicUrl,
        file_type: file.type,
        type: prev.questions.length > 0 ? 'mixed' : 'file_upload'
      }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: AssessmentQuestion = {
      id: Date.now().toString(),
      text: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10,
      explanation: ''
    };
    setData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
      type: prev.file_url ? 'mixed' : 'quiz'
    }));
  };

  const updateQuestion = (id: string, updates: Partial<AssessmentQuestion>) => {
    setData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }));
  };

  const removeQuestion = (id: string) => {
    setData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id),
      type: prev.questions.length <= 1 && prev.file_url ? 'file_upload' : prev.type
    }));
  };

  const handleSave = async () => {
    if (!data.title.trim()) {
      alert('El título es requerido');
      return;
    }
    if (data.type === 'quiz' && data.questions.length === 0) {
      alert('Debe agregar al menos una pregunta');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        unit_id: unit.id,
        course_id: courseId,
        ...data
      });
      onClose();
    } catch (error) {
      console.error('Error saving assessment:', error);
      alert('Error al guardar la evaluación');
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = data.questions.reduce((sum, q) => sum + q.points, 0);

  const tabs = [
    { id: 'settings' as const, label: 'Configuración', icon: Settings2 },
    { id: 'upload' as const, label: 'Subir archivo', icon: FileUp },
    { id: 'create' as const, label: 'Crear preguntas', icon: PenTool }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#030712] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-400" />
              Evaluación de Unidad
            </h2>
            <p className="text-sm text-gray-400 mt-1">Unidad: {unit.title}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-purple-400 text-purple-400' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Título de la evaluación *</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                  placeholder="Ej: Evaluación Final - Módulo 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descripción / Instrucciones</label>
                <textarea
                  value={data.description}
                  onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors resize-none"
                  placeholder="Instrucciones para los estudiantes..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tiempo límite (minutos)</label>
                  <input
                    type="number"
                    value={data.time_limit_minutes || ''}
                    onChange={(e) => setData(prev => ({ ...prev, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                    placeholder="Sin límite"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Puntaje para aprobar (%)</label>
                  <input
                    type="number"
                    value={data.passing_score}
                    onChange={(e) => setData(prev => ({ ...prev, passing_score: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Intentos máximos</label>
                  <input
                    type="number"
                    value={data.max_attempts}
                    onChange={(e) => setData(prev => ({ ...prev, max_attempts: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={data.is_published}
                  onChange={(e) => setData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-600 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="is_published" className="text-gray-300">
                  <span className="font-medium">Publicar evaluación</span>
                  <p className="text-sm text-gray-500">Los estudiantes podrán ver y realizar esta evaluación</p>
                </label>
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors">
                {data.file_url ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-12 h-12 text-purple-400" />
                      <div className="text-left">
                        <p className="text-white font-medium">Archivo cargado</p>
                        <p className="text-sm text-gray-400">{data.file_type === 'application/pdf' ? 'Documento PDF' : 'Documento Word'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <a 
                        href={data.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver archivo
                      </a>
                      <button
                        onClick={() => setData(prev => ({ ...prev, file_url: null, file_type: null, type: prev.questions.length > 0 ? 'quiz' : 'quiz' }))}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-300 mb-2">Arrastra un archivo o haz clic para seleccionar</p>
                    <p className="text-sm text-gray-500 mb-4">PDF o Word (máx. 10MB)</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      Seleccionar archivo
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {uploading && (
                      <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
                        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        Subiendo...
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  💡 <strong>Tip:</strong> Puedes subir un archivo de evaluación Y también crear preguntas adicionales. 
                  Los estudiantes tendrán acceso a ambos.
                </p>
              </div>
            </div>
          )}

          {/* Create Questions Tab */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              {data.questions.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <span className="text-purple-400 text-sm">
                    {data.questions.length} pregunta(s) · {totalPoints} puntos totales
                  </span>
                </div>
              )}

              {data.questions.map((question, qIndex) => (
                <div key={question.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                      Pregunta {qIndex + 1}
                    </span>
                    <button
                      onClick={() => removeQuestion(question.id)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <textarea
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                    placeholder="Escribe la pregunta..."
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-colors resize-none"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Tipo de pregunta</label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(question.id, { 
                          type: e.target.value as 'multiple_choice' | 'true_false' | 'short_answer',
                          options: e.target.value === 'true_false' ? ['Verdadero', 'Falso'] : 
                                   e.target.value === 'short_answer' ? [] : ['', '', '', ''],
                          correctAnswer: e.target.value === 'short_answer' ? '' : 0
                        })}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-400"
                      >
                        <option value="multiple_choice">Opción múltiple</option>
                        <option value="true_false">Verdadero/Falso</option>
                        <option value="short_answer">Respuesta corta</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Puntos</label>
                      <input
                        type="number"
                        value={question.points}
                        onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
                        min="1"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {question.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <label className="block text-xs text-gray-400">Opciones (marca la correcta)</label>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() => updateQuestion(question.id, { correctAnswer: oIndex })}
                            className="w-4 h-4 text-purple-500 focus:ring-purple-500"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...question.options];
                              newOptions[oIndex] = e.target.value;
                              updateQuestion(question.id, { options: newOptions });
                            }}
                            placeholder={`Opción ${oIndex + 1}`}
                            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-400"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'true_false' && (
                    <div className="space-y-2">
                      <label className="block text-xs text-gray-400">Respuesta correcta</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`tf-${question.id}`}
                            checked={question.correctAnswer === 0}
                            onChange={() => updateQuestion(question.id, { correctAnswer: 0 })}
                            className="w-4 h-4 text-purple-500 focus:ring-purple-500"
                          />
                          <span className="text-gray-300">Verdadero</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`tf-${question.id}`}
                            checked={question.correctAnswer === 1}
                            onChange={() => updateQuestion(question.id, { correctAnswer: 1 })}
                            className="w-4 h-4 text-purple-500 focus:ring-purple-500"
                          />
                          <span className="text-gray-300">Falso</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {question.type === 'short_answer' && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Respuesta esperada</label>
                      <input
                        type="text"
                        value={question.correctAnswer as string}
                        onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                        placeholder="Respuesta correcta..."
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-400"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Explicación (opcional)</label>
                    <input
                      type="text"
                      value={question.explanation || ''}
                      onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                      placeholder="Se muestra después de responder..."
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:border-purple-400"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={addQuestion}
                className="w-full py-4 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 hover:text-purple-400 hover:border-purple-500/50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar pregunta
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-800 bg-[#0a0f1a] flex-shrink-0">
          <div className="text-sm text-gray-400">
            {data.file_url ? '📎 Archivo adjunto · ' : ''}
            {data.questions.length} pregunta(s) · {totalPoints} pts
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !data.title.trim()}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Evaluación
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: Modal para crear tema con recursos
// ============================================

interface CreateTopicModalProps {
  data: NewTopicWithResources;
  onChange: (data: NewTopicWithResources) => void;
  onSave: () => void;
  onClose: () => void;
}

function CreateTopicWithResourcesModal({ data, onChange, onSave, onClose }: CreateTopicModalProps) {
  const [activeSection, setActiveSection] = useState<'info' | 'videos' | 'docs' | 'quiz'>('info');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  const addVideo = () => {
    onChange({
      ...data,
      videos: [...data.videos, { id: `vid_${Date.now()}`, url: '', title: '', provider: 'unknown', embedUrl: null }]
    });
  };

  const updateVideo = (index: number, field: string, value: any) => {
    const newVideos = [...data.videos];
    newVideos[index] = { ...newVideos[index], [field]: value };
    if (field === 'url') {
      const info = getVideoInfo(value);
      newVideos[index].provider = info.provider;
      newVideos[index].embedUrl = info.embedUrl;
    }
    onChange({ ...data, videos: newVideos });
  };

  const removeVideo = (index: number) => {
    onChange({ ...data, videos: data.videos.filter((_, i) => i !== index) });
  };

  const updateDocument = (type: 'pdf' | 'slides', field: string, value: string) => {
    const existing = data.documents.find(d => d.type === type);
    const updated = existing ? { ...existing, [field]: value } : { type, url: '', title: '', [field]: value };
    onChange({ ...data, documents: [...data.documents.filter(d => d.type !== type), updated] });
  };

  const addQuizQuestion = () => {
    onChange({
      ...data,
      quiz: [...data.quiz, {
        id: `q_${Date.now()}`,
        text: '',
        type: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 10
      }]
    });
  };

  const updateQuestion = (index: number, updates: Partial<typeof data.quiz[0]>) => {
    const newQuiz = [...data.quiz];
    newQuiz[index] = { ...newQuiz[index], ...updates };
    onChange({ ...data, quiz: newQuiz });
  };

  const removeQuestion = (index: number) => {
    onChange({ ...data, quiz: data.quiz.filter((_, i) => i !== index) });
  };

  const pdfDoc = data.documents.find(d => d.type === 'pdf');
  const slidesDoc = data.documents.find(d => d.type === 'slides');

  const sections = [
    { id: 'info', label: 'Información', icon: FileText },
    { id: 'videos', label: 'Videos', icon: Video, count: data.videos.length },
    { id: 'docs', label: 'Documentos', icon: Presentation, count: data.documents.filter(d => d.url).length },
    { id: 'quiz', label: 'Quiz', icon: Check, count: data.quiz.length },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1419] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Crear Nuevo Tema
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Configura el contenido completo del tema</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-5">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeSection === section.id ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
              {section.count !== undefined && section.count > 0 && (
                <span className="bg-cyan-500/20 text-cyan-400 text-xs px-1.5 py-0.5 rounded-full">{section.count}</span>
              )}
              {activeSection === section.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* Sección: Información Básica */}
          {activeSection === 'info' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título del Tema <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => onChange({ ...data, title: e.target.value })}
                  placeholder="Ej: Introducción a la gramática básica"
                  className="w-full bg-[#030712] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duración estimada</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={data.estimated_minutes}
                      onChange={(e) => onChange({ ...data, estimated_minutes: parseInt(e.target.value) || 30 })}
                      className="w-24 bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                    <span className="text-gray-400">minutos</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.is_published}
                      onChange={(e) => onChange({ ...data, is_published: e.target.checked })}
                      className="w-4 h-4 accent-cyan-500"
                    />
                    <span className="text-sm text-gray-300">Publicar inmediatamente</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Introducción al tema</label>
                <textarea
                  value={data.introduction}
                  onChange={(e) => onChange({ ...data, introduction: e.target.value })}
                  placeholder="Escribe una breve introducción que prepare al estudiante..."
                  rows={4}
                  className="w-full bg-[#030712] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">Soporta formato Markdown</p>
              </div>
            </div>
          )}

          {/* Sección: Videos */}
          {activeSection === 'videos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Videos Explicativos</h3>
                  <p className="text-xs text-gray-400 mt-1">Agrega hasta 3 videos (YouTube o Vimeo)</p>
                </div>
              </div>

              {data.videos.map((video, idx) => (
                <div key={video.id} className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Video {idx + 1}</span>
                    <button onClick={() => removeVideo(idx)} className="text-gray-400 hover:text-red-400 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={video.title}
                      onChange={(e) => updateVideo(idx, 'title', e.target.value)}
                      placeholder="Título del video"
                      className="bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={video.duration_seconds || ''}
                      onChange={(e) => updateVideo(idx, 'duration_seconds', parseInt(e.target.value) || 0)}
                      placeholder="Duración (seg)"
                      className="bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  
                  <div className="relative">
                    <input
                      type="url"
                      value={video.url}
                      onChange={(e) => updateVideo(idx, 'url', e.target.value)}
                      placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                      className={`w-full bg-[#030712] border rounded-lg px-3 py-2 pr-10 text-sm text-white focus:outline-none ${
                        video.url && video.provider === 'unknown' 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-gray-700 focus:border-cyan-500'
                      }`}
                    />
                    {video.url && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {video.provider !== 'unknown' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Preview del video */}
                  {video.embedUrl && (
                    <div className="aspect-video rounded-lg overflow-hidden border border-gray-700">
                      <iframe
                        src={video.embedUrl}
                        title={video.title || 'Video Preview'}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              ))}

              {data.videos.length < 3 && (
                <button
                  onClick={addVideo}
                  className="w-full py-3 border border-dashed border-gray-700 text-gray-400 rounded-xl hover:border-cyan-500/50 hover:text-cyan-400 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar video ({data.videos.length}/3)
                </button>
              )}
            </div>
          )}

          {/* Sección: Documentos */}
          {activeSection === 'docs' && (
            <div className="space-y-6">
              {/* PDF */}
              <div className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <h3 className="font-medium text-white">Documento PDF</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Título</label>
                    <input
                      type="text"
                      value={pdfDoc?.title || ''}
                      onChange={(e) => updateDocument('pdf', 'title', e.target.value)}
                      placeholder="Ej: Guía de estudio"
                      className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">URL del PDF</label>
                    <input
                      type="url"
                      value={pdfDoc?.url || ''}
                      onChange={(e) => updateDocument('pdf', 'url', e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Slides */}
              <div className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Presentation className="w-5 h-5 text-purple-400" />
                  <h3 className="font-medium text-white">Diapositivas</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Título</label>
                      <input
                        type="text"
                        value={slidesDoc?.title || ''}
                        onChange={(e) => updateDocument('slides', 'title', e.target.value)}
                        placeholder="Ej: Presentación del tema"
                        className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Proveedor</label>
                      <select
                        value={slidesDoc?.provider || 'google_slides'}
                        onChange={(e) => updateDocument('slides', 'provider', e.target.value)}
                        className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="google_slides">Google Slides</option>
                        <option value="canva">Canva</option>
                        <option value="pdf">PDF</option>
                        <option value="custom">URL Directa</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">URL de las diapositivas</label>
                    <input
                      type="url"
                      value={slidesDoc?.url || ''}
                      onChange={(e) => updateDocument('slides', 'url', e.target.value)}
                      placeholder="https://docs.google.com/presentation/..."
                      className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sección: Quiz */}
          {activeSection === 'quiz' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Cuestionario del Tema</h3>
                  <p className="text-xs text-gray-400 mt-1">Preguntas de repaso para evaluar comprensión</p>
                </div>
              </div>

              {data.quiz.map((q, idx) => (
                <div key={q.id} className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-cyan-400">Pregunta {idx + 1}</span>
                    <button onClick={() => removeQuestion(idx)} className="text-gray-400 hover:text-red-400 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <textarea
                    value={q.text}
                    onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                    placeholder="Escribe la pregunta..."
                    rows={2}
                    className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none resize-none"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(idx, { 
                        type: e.target.value as 'multiple_choice' | 'true_false',
                        options: e.target.value === 'true_false' ? ['Verdadero', 'Falso'] : q.options
                      })}
                      className="bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="multiple_choice">Opción múltiple</option>
                      <option value="true_false">Verdadero/Falso</option>
                    </select>
                    <input
                      type="number"
                      value={q.points}
                      onChange={(e) => updateQuestion(idx, { points: parseInt(e.target.value) || 10 })}
                      placeholder="Puntos"
                      className="bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400">Opciones (marca la correcta)</label>
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuestion(idx, { correctAnswer: optIdx })}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            q.correctAnswer === optIdx 
                              ? 'border-green-500 bg-green-500/20' 
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          {q.correctAnswer === optIdx && <Check className="w-3 h-3 text-green-400" />}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...q.options];
                            newOptions[optIdx] = e.target.value;
                            updateQuestion(idx, { options: newOptions });
                          }}
                          placeholder={`Opción ${String.fromCharCode(65 + optIdx)}`}
                          disabled={q.type === 'true_false'}
                          className="flex-1 bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={addQuizQuestion}
                className="w-full py-3 border border-dashed border-gray-700 text-gray-400 rounded-xl hover:border-purple-500/50 hover:text-purple-400 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar pregunta
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-800 bg-[#0a0f1a] flex-shrink-0">
          <div className="text-sm text-gray-400">
            {data.videos.filter(v => v.embedUrl).length} video(s) · 
            {data.documents.filter(d => d.url).length} documento(s) · 
            {data.quiz.length} pregunta(s)
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !data.title.trim()}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Crear Tema
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
