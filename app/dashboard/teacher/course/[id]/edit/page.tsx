'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { 
  ArrowLeft, Save, Eye, EyeOff, Settings, Image as ImageIcon, 
  BookOpen, Video, FileText, Presentation, Plus, Trash2, Edit2, 
  ChevronDown, ChevronRight, GripVertical, X, Upload, Clock, File
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
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{unit.topics?.length || 0} temas · {unit.estimated_hours || 0}h</p>
                    </div>
                    <div className="flex items-center gap-2">
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

                      {/* Add Topic */}
                      {addingTopicToUnit === unit.id ? (
                        <div className="flex gap-2 mt-3">
                          <input type="text" value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} 
                            placeholder="Título del tema..." 
                            className="flex-1 bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none" 
                            autoFocus onKeyPress={e => e.key === 'Enter' && handleAddTopic(unit.id)} />
                          <button onClick={() => handleAddTopic(unit.id)} className="px-3 py-2 bg-cyan-500 text-black rounded-lg text-sm font-medium">Agregar</button>
                          <button onClick={() => { setAddingTopicToUnit(null); setNewTopicTitle(''); }} className="px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm">Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingTopicToUnit(unit.id)} 
                          className="w-full mt-3 py-2.5 border border-dashed border-gray-700 text-gray-400 rounded-lg hover:border-gray-600 text-sm flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4" />Agregar tema
                        </button>
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
    </div>
  );
}
