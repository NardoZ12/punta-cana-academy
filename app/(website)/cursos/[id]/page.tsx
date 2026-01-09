// app/cursos/[id]/page.tsx
import { use } from 'react';
import { CourseHero } from '@/components/organisms/CourseHero';

// 1. SIMULAMOS TU BASE DE DATOS DE CURSOS
interface Course {
  title: string;
  description: string;
  image: string;
  price: string;
  duration: string;
  modality: string;
  syllabus: string[];
}

const coursesDB: Record<string, Course> = {
  'ingles-intensivo': {
    title: "Inglés Intensivo para el Trabajo",
    description: "Domina el inglés de negocios y turismo. Diseñado específicamente para profesionales en Punta Cana que buscan ascender en su carrera.",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1200",
    price: "$49 USD/mes",
    duration: "6 Meses",
    modality: "Híbrido (Friusa + Online)",
    syllabus: [
      "Módulo 1: Fundamentos y Conversación Básica",
      "Módulo 2: Inglés para Servicio al Cliente",
      "Módulo 3: Vocabulario Técnico de Hotelería",
      "Módulo 4: Negociación y Ventas",
    ]
  },
  'desarrollo-web': {
    title: "Desarrollo Web Full Stack",
    description: "Conviértete en programador desde cero. Aprende HTML, CSS, JavaScript, React y Node.js para trabajar remoto.",
    image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=1200",
    price: "$199 USD (Pago Único)",
    duration: "12 Semanas",
    modality: "100% Online",
    syllabus: [
      "Semana 1-4: Fundamentos de la Web",
      "Semana 5-8: React y Frontend Moderno",
      "Semana 9-12: Backend y Bases de Datos",
    ]
  },
  'frances-hoteleria': {
    title: "Francés para Hotelería",
    description: "Perfecciona tu francés para brindar un servicio de excelencia en hoteles y resorts de lujo en Punta Cana.",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200",
    price: "$59 USD/mes",
    duration: "4 Meses",
    modality: "Presencial (Friusa)",
    syllabus: [
      "Módulo 1: Vocabulario de Hotelería en Francés",
      "Módulo 2: Atención al Cliente Francófono", 
      "Módulo 3: Servicios Premium y Protocolo",
      "Módulo 4: Conversación Avanzada",
    ]
  }
};

// 2. COMPONENTE DE PÁGINA
export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const course = coursesDB[resolvedParams.id];

  // Si el curso no existe (ej: /cursos/cocina), mostramos un error simple
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pca-black text-white">
        <h1 className="text-3xl">Curso no encontrado 😕</h1>
      </div>
    );
  }

  return (
    <main className="bg-pca-black min-h-screen pb-20">
      
      {/* HÉROE DINÁMICO */}
      <CourseHero 
        title={course.title}
        description={course.description}
        image={course.image}
        price={course.price}
        duration={course.duration}
        modality={course.modality}
      />

      {/* CONTENIDO DEL CURSO (TEMARIO) */}
      <div className="max-w-4xl mx-auto px-4 mt-20">
        <h2 className="text-3xl font-bold text-white mb-8 border-l-4 border-pca-blue pl-4">
          Lo que aprenderás
        </h2>
        
        <div className="grid gap-4">
          {course.syllabus.map((item: string, index: number) => (
            <div key={index} className="bg-gray-900 p-6 rounded-xl border border-gray-800 flex items-center gap-4 hover:border-pca-blue/30 transition-colors">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-pca-blue/20 text-pca-blue flex items-center justify-center font-bold text-sm">
                {index + 1}
              </span>
              <span className="text-gray-300 font-medium">{item}</span>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}