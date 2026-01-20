'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  
  // Estados Datos Curso
  const [modules, setModules] = useState<any[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [addingLessonToModuleId, setAddingLessonToModuleId] = useState<string | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState('');

  const [formData, setFormData] = useState({
    title: '', description: '', price: '', level: '', modality: '', schedule: '', 
    image_url: '', is_published: false 
  });

  // --- ESTADOS PARA EDITAR LECCIÓN (MODAL) ---
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: '', video_url: '', description: '', duration: 0 });

  // --- 1. CARGA DE DATOS ---
  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  async function fetchCourseData() {
    // Cargar Curso
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
        is_published: courseData.is_published || false 
      });
    }

    // Cargar Módulos y Lecciones
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

  // --- FUNCIONES CURSO ---
  const handleTogglePublish = async () => {
    const newStatus = !formData.is_published;
    const { error } = await supabase.from('courses').update({ is_published: newStatus }).eq('id', courseId);
    if (!error) {
      setFormData({ ...formData, is_published: newStatus });
      alert(newStatus ? '¡Curso PUBLICADO! 🚀' : 'Curso ocultado (Borrador) 🔒');
    }
  };

  const handleSaveGeneral = async () => {
    const { error } = await supabase.from('courses').update(formData).eq('id', courseId);
    if (!error) alert('¡Información actualizada! ✅');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${courseId}-${Date.now()}.${fileExt}`;
    
    setUploading(true);
    try {
      const { error } = await supabase.storage.from('Courses').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('Courses').getPublicUrl(fileName);
      await supabase.from('courses').update({ image_url: publicUrl }).eq('id', courseId);
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      alert('¡Imagen actualizada!');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- FUNCIONES MÓDULOS ---
  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    const { error } = await supabase.from('course_modules').insert({
      course_id: courseId, title: newModuleTitle, sort_order: modules.length + 1
    });
    if (!error) { setNewModuleTitle(''); fetchCourseData(); }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('¿Estás seguro de eliminar este módulo? Esto también eliminará todas las lecciones asociadas.')) return;
    
    // Primero eliminar todas las lecciones del módulo
    const { error: lessonsError } = await supabase
      .from('course_lessons')
      .delete()
      .eq('module_id', moduleId);

    if (lessonsError) {
      alert('Error eliminando lecciones: ' + lessonsError.message);
      return;
    }

    // Luego eliminar el módulo
    const { error: moduleError } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', moduleId);

    if (moduleError) {
      alert('Error eliminando módulo: ' + moduleError.message);
    } else {
      alert('Módulo eliminado correctamente');
      fetchCourseData();
    }
  };

  const handleEditModuleTitle = async (moduleId: string, newTitle: string) => {
    const { error } = await supabase
      .from('course_modules')
      .update({ title: newTitle })
      .eq('id', moduleId);

    if (error) {
      alert('Error actualizando módulo: ' + error.message);
    } else {
      fetchCourseData();
    }
  };

  // --- FUNCIONES LECCIONES ---
  const handleAddLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) return;
    const currentModule = modules.find(m => m.id === moduleId);
    const order = currentModule ? currentModule.course_lessons.length + 1 : 1;
    
    const { error } = await supabase.from('course_lessons').insert({
      module_id: moduleId, title: newLessonTitle, sort_order: order
    });
    if (!error) { setNewLessonTitle(''); setAddingLessonToModuleId(null); fetchCourseData(); }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta lección?')) return;
    
    const { error } = await supabase
      .from('course_lessons')
      .delete()
      .eq('id', lessonId);

    if (error) {
      alert('Error eliminando lección: ' + error.message);
    } else {
      alert('Lección eliminada correctamente');
      fetchCourseData();
    }
  };

  // --- NUEVO: GUARDAR EDICIÓN DE LECCIÓN (VIDEO) ---
  const handleUpdateLesson = async () => {
    if (!editingLesson) return;
    
    const { error } = await supabase
      .from('course_lessons')
      .update({
        title: lessonForm.title,
        video_url: lessonForm.video_url,
        description: lessonForm.description, // Asegúrate que esta columna exista en tu DB (ver SQL)
        duration: lessonForm.duration
      })
      .eq('id', editingLesson.id);

    if (error) {
      alert('Error actualizando lección: ' + error.message);
    } else {
      alert('¡Lección guardada con video! 🎥');
      setEditingLesson(null); // Cerrar modal
      fetchCourseData(); // Recargar datos
    }
  };

  const openLessonModal = (lesson: any) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      video_url: lesson.video_url || '',
      description: lesson.description || '', // Cambia 'content' por 'description' si así lo llamaste en DB
      duration: lesson.duration || 0
    });
  };

  if (loading) return <div className="p-10 text-white bg-gray-900 min-h-screen">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/dashboard/teacher" className="text-gray-400 hover:text-white text-sm">← Volver</Link>
          <div className="flex items-center gap-3 mt-2">
             <h1 className="text-3xl font-bold">Editar Curso</h1>
             <span className={`px-3 py-1 rounded-full text-xs font-bold ${formData.is_published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {formData.is_published ? '🟢 PUBLICADO' : '🟡 BORRADOR'}
             </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveGeneral}>💾 Guardar Cambios</Button>
        </div>
      </div>

      {/* TABS */}
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
             <div><label className="text-gray-400 block mb-2">Título</label><input name="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-900 border-gray-700 rounded p-3" /></div>
             <div><label className="text-gray-400 block mb-2">Descripción</label><textarea name="description" rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-900 border-gray-700 rounded p-3" /></div>
          </div>
        )}

        {/* TAB 2: MULTIMEDIA */}
        {activeTab === 'media' && (
          <div className="text-center py-10">
            {formData.image_url ? <img src={formData.image_url} className="w-full max-w-md mx-auto rounded-xl mb-6" /> : <div className="text-4xl mb-4">📸</div>}
            <label className="bg-blue-600 px-4 py-2 rounded cursor-pointer">{uploading ? 'Subiendo...' : 'Cambiar Imagen'}<input type="file" className="hidden" onChange={handleImageUpload} /></label>
          </div>
        )}

        {/* TAB 3: TEMARIO (AQUÍ ESTÁ LA MAGIA 🎥) */}
        {activeTab === 'curriculum' && (
          <div className="max-w-4xl mx-auto space-y-6">
             {modules.map((module) => (
               <div key={module.id} className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                 <div className="flex justify-between items-center mb-3">
                   {editingModuleId === module.id ? (
                     <div className="flex gap-2 flex-1">
                       <input 
                         value={editingModuleTitle}
                         onChange={(e) => setEditingModuleTitle(e.target.value)}
                         className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1 text-lg font-bold"
                         onKeyPress={(e) => {
                           if (e.key === 'Enter') {
                             handleEditModuleTitle(module.id, editingModuleTitle);
                             setEditingModuleId(null);
                           }
                         }}
                       />
                       <button 
                         onClick={() => {
                           handleEditModuleTitle(module.id, editingModuleTitle);
                           setEditingModuleId(null);
                         }}
                         className="text-green-400 hover:text-green-300 px-2"
                       >
                         ✅
                       </button>
                       <button 
                         onClick={() => setEditingModuleId(null)}
                         className="text-red-400 hover:text-red-300 px-2"
                       >
                         ❌
                       </button>
                     </div>
                   ) : (
                     <>
                       <h3 className="font-bold text-lg">{module.title}</h3>
                       <div className="flex gap-2">
                         <button 
                           onClick={() => {
                             setEditingModuleId(module.id);
                             setEditingModuleTitle(module.title);
                           }}
                           className="text-gray-400 hover:text-cyan-400 text-sm px-2 py-1 rounded border border-gray-700"
                         >
                           ✏️ Editar
                         </button>
                         <button 
                           onClick={() => handleDeleteModule(module.id)}
                           className="text-gray-400 hover:text-red-400 text-sm px-2 py-1 rounded border border-gray-700"
                         >
                           🗑️ Eliminar
                         </button>
                       </div>
                     </>
                   )}
                 </div>
                 <div className="space-y-2">
                    {module.course_lessons.map((lesson: any) => (
                      <div key={lesson.id} className="flex justify-between items-center bg-black/40 p-3 rounded border border-gray-800 hover:border-gray-600 transition">
                         <div className="flex items-center gap-3">
                            <span className="text-gray-400">📄</span>
                            <span>{lesson.title}</span>
                            {lesson.video_url && <span className="text-xs bg-green-900 text-green-300 px-2 rounded">Video OK</span>}
                         </div>
                         <div className="flex gap-2">
                           <button 
                             onClick={() => openLessonModal(lesson)}
                             className="text-xs bg-gray-800 hover:bg-cyan-900 text-cyan-400 border border-gray-700 px-3 py-1.5 rounded transition"
                           >
                             ⚙️ Configurar
                           </button>
                           <button 
                             onClick={() => handleDeleteLesson(lesson.id)}
                             className="text-xs bg-gray-800 hover:bg-red-900 text-red-400 border border-gray-700 px-3 py-1.5 rounded transition"
                           >
                             🗑️ Eliminar
                           </button>
                         </div>
                      </div>
                    ))}
                 </div>
                 <div className="mt-4 flex gap-2">
                    <input placeholder="Nueva lección..." className="bg-black border border-gray-700 px-3 py-2 text-sm rounded flex-1"
                      value={addingLessonToModuleId === module.id ? newLessonTitle : ''}
                      onChange={e => { setNewLessonTitle(e.target.value); setAddingLessonToModuleId(module.id); }} 
                    />
                    <Button size="sm" onClick={() => handleAddLesson(module.id)}>+ Agregar</Button>
                 </div>
               </div>
             ))}
             
             <div className="mt-8 pt-6 border-t border-gray-800 flex gap-2">
               <input placeholder="Nuevo Módulo" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} className="bg-gray-900 p-2 rounded border border-gray-700" />
               <Button onClick={handleAddModule}>Crear Módulo</Button>
             </div>
          </div>
        )}

        {/* TAB 4: AJUSTES */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto mt-10 bg-gray-900 border border-gray-700 rounded-xl p-6 flex justify-between items-center">
             <div>
                <h3 className="text-xl font-bold">Estado del Curso</h3>
                <p className="text-gray-400 text-sm">{formData.is_published ? "Visible para todos." : "Oculto (Borrador)."}</p>
             </div>
             <button onClick={handleTogglePublish} className={`px-6 py-3 rounded-lg font-bold ${formData.is_published ? "bg-red-900/30 text-red-400" : "bg-green-600 text-white"}`}>
                {formData.is_published ? "🔴 Ocultar" : "🚀 Publicar"}
             </button>
          </div>
        )}
      </div>

      {/* --- MODAL PARA EDITAR LECCIÓN (VIDEO) --- */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4">🎬 Editar Lección</h2>
            
            <div className="space-y-4">
               <div>
                  <label className="block text-sm text-gray-400 mb-1">Título de la Lección</label>
                  <input className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                    value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} />
               </div>

               <div>
                  <label className="block text-sm text-cyan-400 mb-1 font-bold">🔗 URL del Video (YouTube / Vimeo)</label>
                  <input className="w-full bg-gray-900 border border-cyan-900/50 rounded p-2 text-white placeholder-gray-600"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={lessonForm.video_url} onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})} />
                  <p className="text-xs text-gray-500 mt-1">Copia y pega el link directo del video.</p>
               </div>

               <div>
                  <label className="block text-sm text-gray-400 mb-1">Descripción / Notas de Clase</label>
                  <textarea rows={4} className="w-full bg-gray-900 border border-gray-600 rounded p-2"
                    value={lessonForm.description} onChange={e => setLessonForm({...lessonForm, description: e.target.value})} />
               </div>
               
               <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setEditingLesson(null)}>Cancelar</Button>
                  <Button onClick={handleUpdateLesson}>💾 Guardar Lección</Button>
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}