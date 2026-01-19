'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/atoms/Button';

const TABS = [
  { id: 'general', label: '✏️ General' },
  { id: 'media', label: '📸 Multimedia' },
  { id: 'curriculum', label: '📚 Temario' },
  { id: 'settings', label: '⚙️ Ajustes' },
];

export default function EditCoursePage() {
  const params = useParams();
  const supabase = createClient();
  const courseId = params?.id as string;

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Estados
  const [modules, setModules] = useState<any[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [addingLessonToModuleId, setAddingLessonToModuleId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  // AGREGAMOS 'is_published' AL ESTADO
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', level: '', modality: '', schedule: '', 
    image_url: '', is_published: false 
  });

  // --- 1. CARGA DE DATOS ---
  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  async function fetchCourseData() {
    const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).single();
    if (courseData) {
      setFormData({
        title: courseData.title || '',
        description: courseData.description || '',
        price: courseData.price || '',
        level: courseData.level || 'Principiante',
        modality: courseData.modality || 'Online',
        schedule: courseData.schedule || '',
        image_url: courseData.image_url || '',
        is_published: courseData.is_published || false // Cargamos el estado real
      });
    }

    const { data: modulesData } = await supabase
      .from('course_modules')
      .select(`*, course_lessons(*)`)
      .eq('course_id', courseId)
      .order('sort_order', { ascending: true });

    if (modulesData) {
      const sortedModules = modulesData.map((mod: any) => ({
        ...mod,
        course_lessons: mod.course_lessons.sort((a: any, b: any) => a.sort_order - b.sort_order)
      }));
      setModules(sortedModules);
    }
    setLoading(false);
  }

  // --- NUEVA FUNCIÓN: PUBLICAR/OCULTAR CURSO ---
  const handleTogglePublish = async () => {
    const newStatus = !formData.is_published;
    
    const { error } = await supabase
      .from('courses')
      .update({ is_published: newStatus })
      .eq('id', courseId);

    if (!error) {
      setFormData({ ...formData, is_published: newStatus });
      alert(newStatus ? '¡Curso PUBLICADO! 🚀' : 'Curso ocultado (Borrador) 🔒');
    } else {
      alert('Error al cambiar estado. Verifica que la columna "is_published" exista en Supabase.');
    }
  };

  // --- OTRAS FUNCIONES (Guardar, Subir imagen, etc) ---
  const handleSaveGeneral = async () => {
    const { error } = await supabase.from('courses').update(formData).eq('id', courseId);
    if (!error) alert('¡Información actualizada! ✅');
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${courseId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    setUploading(true);

    try {
      const { error: uploadError } = await supabase.storage.from('Courses').upload(filePath, file); // Revisa si tu bucket es 'courses' o 'Courses'
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('Courses').getPublicUrl(filePath);
      
      await supabase.from('courses').update({ image_url: publicUrl }).eq('id', courseId);
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      alert('¡Imagen actualizada!');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    const { error } = await supabase.from('course_modules').insert({
      course_id: courseId, title: newModuleTitle, sort_order: modules.length + 1
    });
    if (!error) { setNewModuleTitle(''); fetchCourseData(); }
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) return;
    const currentModule = modules.find(m => m.id === moduleId);
    const order = currentModule ? currentModule.course_lessons.length + 1 : 1;
    const { error } = await supabase.from('course_lessons').insert({
      module_id: moduleId, title: newLessonTitle, sort_order: order
    });
    if (!error) { setNewLessonTitle(''); setAddingLessonToModuleId(null); fetchCourseData(); }
  };

  if (loading) return <div className="p-10 text-white bg-gray-900 min-h-screen">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      {/* HEADER CON BADGE DE ESTADO */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/dashboard/teacher" className="text-gray-400 hover:text-white text-sm">← Volver</Link>
          <div className="flex items-center gap-3 mt-2">
             <h1 className="text-3xl font-bold">Editar Curso</h1>
             {/* Badge Visual */}
             <span className={`px-3 py-1 rounded-full text-xs font-bold ${formData.is_published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {formData.is_published ? '🟢 PUBLICADO' : '🟡 BORRADOR'}
             </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveGeneral}>💾 Guardar Todo</Button>
        </div>
      </div>

      <div className="flex border-b border-gray-800 mb-8 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-black border border-gray-800 rounded-2xl p-8 shadow-xl min-h-[500px]">
        
        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
          <div className="space-y-6 max-w-3xl">
            <div className="grid gap-6">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Título</label>
                <input name="title" value={formData.title} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3" />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Descripción</label>
                <textarea name="description" rows={4} value={formData.description} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MULTIMEDIA */}
        {activeTab === 'media' && (
          <div className="text-center py-10">
            {formData.image_url ? (
              <img src={formData.image_url} alt="Portada" className="w-full max-w-md mx-auto rounded-xl border border-gray-700 mb-6" />
            ) : <div className="text-4xl mb-4">📸</div>}
            <label className="bg-blue-600 px-4 py-2 rounded cursor-pointer">
               {uploading ? 'Subiendo...' : 'Cambiar Imagen'}
               <input type="file" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        )}

        {/* TAB 3: TEMARIO */}
        {activeTab === 'curriculum' && (
          <div className="max-w-4xl mx-auto space-y-6">
             {modules.map((module) => (
               <div key={module.id} className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                 <h3 className="font-bold">{module.title}</h3>
                 <div className="mt-2 pl-4 border-l-2 border-gray-700">
                    {module.course_lessons.map((lesson: any) => (
                      <div key={lesson.id} className="py-2 text-sm text-gray-400">📄 {lesson.title}</div>
                    ))}
                    <div className="mt-2 flex gap-2">
                       <input placeholder="Nueva lección..." className="bg-black border border-gray-700 px-2 py-1 text-sm rounded"
                         onChange={e => setNewLessonTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && setAddingLessonToModuleId(module.id)} />
                       <button onClick={() => { setAddingLessonToModuleId(module.id); handleAddLesson(module.id); }} className="text-xs bg-blue-600 px-2 py-1 rounded">Add</button>
                    </div>
                 </div>
               </div>
             ))}
             <div className="flex gap-2">
               <input placeholder="Nuevo Módulo" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} className="bg-gray-900 p-2 rounded border border-gray-700" />
               <Button onClick={handleAddModule}>Crear</Button>
             </div>
          </div>
        )}

        {/* --- AQUÍ ESTÁ EL ARREGLO --- */}
        {/* TAB 4: AJUSTES (AHORA CON BOTÓN) */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-6">Configuración de Publicación</h2>
            
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-bold text-white">Estado del Curso</h3>
                   <p className="text-gray-400 text-sm mt-1">
                      {formData.is_published 
                        ? "Este curso es público y visible para todos los estudiantes." 
                        : "Este curso está oculto. Solo tú puedes verlo."}
                   </p>
                </div>
                
                <button
                  onClick={handleTogglePublish}
                  className={`px-6 py-3 rounded-lg font-bold transition-transform active:scale-95 ${
                    formData.is_published
                      ? "bg-red-900/30 text-red-400 border border-red-800 hover:bg-red-900/50"
                      : "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-900/20"
                  }`}
                >
                  {formData.is_published ? "🔴 Ocultar Curso" : "🚀 Publicar Curso"}
                </button>
            </div>
            
            <p className="text-gray-500 text-xs mt-4 text-center">
              Nota: Asegúrate de tener la columna <code className="text-gray-300">is_published</code> (boolean) en tu tabla de Supabase.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}