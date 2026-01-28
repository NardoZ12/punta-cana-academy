'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { createClient } from '@/utils/supabase/client';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  Users,
  Star,
  Trash2,
  AlertCircle,
  CheckCircle,
  PlayCircle
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  price: number;
  level: string;
  modality: string;
  teacher_id: string;
  is_published: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface Enrollment {
  id: string;
  progress: number;
  grade: number | null;
  enrolled_at: string;
  courses: Course;
}

export default function StudentCoursesPage() {
  const [enrolledCourses, setEnrolledCourses] = useState<Enrollment[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'enrolled' | 'available'>('enrolled');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterModality, setFilterModality] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadCoursesData();
  }, []);

  const loadCoursesData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Cargar cursos inscritos
      const { data: enrolled } = await supabase
        .from('enrollments')
        .select(`
          id, progress, grade, enrolled_at,
          courses (
            id, title, description, image_url, price, level, modality, 
            teacher_id, is_published, created_at,
            profiles:teacher_id (full_name)
          )
        `)
        .eq('student_id', user.id)
        .eq('courses.is_published', true);

      if (enrolled) {
        setEnrolledCourses(enrolled);
      }

      // Cargar cursos disponibles (no inscritos)
      const enrolledCourseIds = enrolled?.map(e => e.courses.id) || [];
      
      let availableQuery = supabase
        .from('courses')
        .select(`
          id, title, description, image_url, price, level, modality,
          teacher_id, is_published, created_at,
          profiles:teacher_id (full_name)
        `)
        .eq('is_published', true);

      if (enrolledCourseIds.length > 0) {
        availableQuery = availableQuery.not('id', 'in', `(${enrolledCourseIds.join(',')})`);
      }

      const { data: available } = await availableQuery;

      if (available) {
        setAvailableCourses(available);
      }

    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: courseId,
          progress: 0,
          grade: null,
          enrolled_at: new Date().toISOString()
        });

      if (!error) {
        await loadCoursesData(); // Recargar datos
        setActiveTab('enrolled'); // Cambiar a pestaña de inscritos
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  const unenrollFromCourse = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (!error) {
        await loadCoursesData();
        setShowDeleteModal(false);
        setCourseToDelete(null);
      }
    } catch (error) {
      console.error('Error unenrolling from course:', error);
    }
  };

  const filteredAvailableCourses = availableCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || course.level === filterLevel;
    const matchesModality = filterModality === 'all' || course.modality === filterModality;
    
    return matchesSearch && matchesLevel && matchesModality;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Mis Cursos</h1>
          <p className="text-gray-400">Gestiona tus cursos inscritos y explora nuevos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('enrolled')}
          className={`px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === 'enrolled'
              ? 'bg-cyan-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Mis Cursos ({enrolledCourses.length})
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`px-6 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === 'available'
              ? 'bg-cyan-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          Explorar Cursos ({availableCourses.length})
        </button>
      </div>

      {/* Search and Filters for Available Courses */}
      {activeTab === 'available' && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500"
              >
                <option value="all">Todos los niveles</option>
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
              <select
                value={filterModality}
                onChange={(e) => setFilterModality(e.target.value)}
                className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500"
              >
                <option value="all">Todas las modalidades</option>
                <option value="Online">Online</option>
                <option value="Presencial">Presencial</option>
                <option value="Híbrida">Híbrida</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'enrolled' ? (
        <div className="space-y-6">
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No tienes cursos inscritos</h3>
              <p className="text-gray-400 mb-6">Explora nuestra selección de cursos disponibles</p>
              <Button
                onClick={() => setActiveTab('available')}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Explorar Cursos
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((enrollment) => (
                <div key={enrollment.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-200">
                  {enrollment.courses.image_url && (
                    <div className="aspect-video bg-gray-800">
                      <img
                        src={enrollment.courses.image_url}
                        alt={enrollment.courses.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-white text-lg line-clamp-2">
                        {enrollment.courses.title}
                      </h3>
                      <button
                        onClick={() => {
                          setCourseToDelete(enrollment.id);
                          setShowDeleteModal(true);
                        }}
                        className="text-gray-400 hover:text-red-400 p-1"
                        title="Desinscrirse del curso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {enrollment.courses.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Progreso</span>
                        <span className="text-sm font-medium text-cyan-400">
                          {enrollment.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {enrollment.courses.level}
                      </span>
                      {enrollment.grade && (
                        <span className="flex items-center gap-1 text-green-400">
                          <Star className="w-4 h-4" />
                          {enrollment.grade}%
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/dashboard/student/course/${enrollment.courses.id}`} className="flex-1">
                        <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                          <PlayCircle className="w-4 h-4" />
                          Continuar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAvailableCourses.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No se encontraron cursos</h3>
              <p className="text-gray-400">Intenta ajustar tus filtros de búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailableCourses.map((course) => (
                <div key={course.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-200">
                  {course.image_url && (
                    <div className="aspect-video bg-gray-800">
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-semibold text-white text-lg mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>
                    
                    {/* Course Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Profesor:</span>
                        <span className="text-white">{course.profiles?.full_name || 'No disponible'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Nivel:</span>
                        <span className="text-cyan-400">{course.level}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Modalidad:</span>
                        <span className="text-white">{course.modality}</span>
                      </div>
                      {course.price > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Precio:</span>
                          <span className="text-green-400 font-semibold">${course.price}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => enrollInCourse(course.id)}
                      variant="primary"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Inscribirse
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-2xl max-w-md w-full mx-4 border border-gray-800">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Confirmar Desinscripción</h2>
              <p className="text-gray-300 mb-6">
                ¿Estás seguro de que quieres desinscribirte de este curso? 
                Perderás todo tu progreso.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => courseToDelete && unenrollFromCourse(courseToDelete)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Desinscribirse
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}