// app/contacto/page.tsx 
import { ContactForm } from '@/components/organisms/ContactForm';

export default function ContactPage() {
  return (
    <main className="min-h-screen pt-10 pb-20 px-4 bg-pca-black">
      
      {/* 1. ENCABEZADO */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Hablemos de tu <span className="text-pca-blue">Futuro</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          ¿Tienes dudas sobre los cursos? ¿Quieres visitar nuestras instalaciones en Friusa?
          Estamos aquí para ayudarte.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* 2. IZQUIERDA: Información y Mapa */}
        <div className="space-y-8">
          
          {/* Tarjetas de Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h3 className="text-pca-blue font-bold mb-2">Visítanos</h3>
              <p className="text-gray-300 text-sm">
                Av. Estados Unidos 41201<br/>
                Plaza Doña Belgica, Local L5<br/>
                Segundo Nivel<br/>
                Punta Cana 23000
              </p>
            </div>
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h3 className="text-pca-blue font-bold mb-2">Contacto Directo</h3>
              <p className="text-gray-300 text-sm">
                +1 (829) 270-7821<br/>
                puntacanaacademy.info@gmail.com<br/>
                Lun - Vie: 9AM - 8PM
              </p>
            </div>
          </div>

          {/* Mapa de Google (Embed de Friusa) */}
          <div className="w-full h-64 md:h-80 bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-lg">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d969.1!2d-68.457209!3d18.692683!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTjCsDQxJzMzLjciTiA2OMKwMjcnMjYuMCJX!5e0!3m2!1ses!2sdo!4v1637000000000!5m2!1ses!2sdo&q=Av.+Estados+Unidos+41201+Punta+Cana" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

        {/* 3. DERECHA: El Formulario */}
        <div>
           <ContactForm />
        </div>

      </div>
    </main>
  );
}