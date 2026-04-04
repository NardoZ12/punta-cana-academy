// app/(marketing)/privacidad/page.tsx

export const metadata = {
  title: 'Política de Privacidad | Punta Cana Academy',
  description:
    'Conoce cómo Punta Cana Academy recopila, usa y protege tu información personal.',
};

const sections = [
  { id: 'introduccion', title: '1. Introducción' },
  { id: 'informacion-recopilada', title: '2. Información que Recopilamos' },
  { id: 'tipos-de-datos', title: '3. Tipos de Datos' },
  { id: 'google-analytics', title: '4. Google Analytics y Rastreo' },
  { id: 'uso-de-datos', title: '5. Uso de los Datos' },
  { id: 'seguridad', title: '6. Seguridad de los Datos' },
  { id: 'derechos', title: '7. Tus Derechos' },
  { id: 'cookies', title: '8. Gestión de Cookies' },
  { id: 'terceros', title: '9. Servicios de Terceros' },
  { id: 'retencion', title: '10. Retención de Datos' },
  { id: 'contacto', title: '11. Contacto' },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-pca-black pt-10 pb-24 px-4">
      <div className="max-w-7xl mx-auto">

        {/* ENCABEZADO */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Política de <span className="text-cyan-400">Privacidad</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            En Punta Cana Academy nos comprometemos a proteger tu privacidad y a ser
            transparentes sobre cómo usamos tu información.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Última actualización: 4 de abril de 2025
          </p>
        </div>

        {/* LAYOUT: TOC (izquierda) + Contenido (derecha) */}
        <div className="flex flex-col lg:flex-row gap-10">

          {/* TABLA DE CONTENIDOS — sticky en escritorio */}
          <aside className="lg:w-72 shrink-0">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 lg:sticky lg:top-28">
              <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Contenido
              </h2>
              <nav>
                <ul className="space-y-2">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="block text-sm text-gray-400 hover:text-cyan-400 transition-colors py-1 border-l-2 border-transparent hover:border-cyan-400 pl-3"
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* CONTENIDO PRINCIPAL */}
          <div className="flex-1 space-y-12 text-gray-300 leading-relaxed">

            {/* 1. INTRODUCCIÓN */}
            <section id="introduccion" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 text-sm font-bold shrink-0">1</span>
                Introducción
              </h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
                <p>
                  Bienvenido a <strong className="text-white">Punta Cana Academy</strong>. Esta Política de
                  Privacidad explica cómo recopilamos, usamos, divulgamos y salvaguardamos tu información
                  cuando visitas nuestro sitio web o utilizas nuestros servicios educativos de idiomas y
                  tecnología.
                </p>
                <p>
                  Al acceder o usar nuestros servicios, aceptas las prácticas descritas en esta política. Si
                  no estás de acuerdo con alguno de los términos, te pedimos que no utilices nuestro sitio.
                </p>
                <p>
                  Esta política aplica a toda la información recopilada a través de nuestro sitio web
                  (<strong className="text-white">puntacanaacademy.com</strong>), aplicaciones y cualquier
                  comunicación relacionada.
                </p>
              </div>
            </section>

            {/* 2. INFORMACIÓN QUE RECOPILAMOS */}
            <section id="informacion-recopilada" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 text-sm font-bold shrink-0">2</span>
                Información que Recopilamos
              </h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
                <p>Recopilamos información en las siguientes situaciones:</p>
                <ul className="list-none space-y-3">
                  {[
                    'Cuando te registras en nuestra plataforma o creas una cuenta.',
                    'Cuando te inscribes en uno de nuestros cursos de idiomas o tecnología.',
                    'Cuando nos contactas a través del formulario, correo electrónico o WhatsApp.',
                    'Cuando navegas por nuestro sitio web (datos de uso automáticos).',
                    'Cuando participas en encuestas, concursos o promociones.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-cyan-400/20 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 3. TIPOS DE DATOS */}
            <section id="tipos-de-datos" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 text-sm font-bold shrink-0">3</span>
                Tipos de Datos
              </h2>
              <div className="space-y-4">
                {[
                  {
                    title: 'Información Personal',
                    items: [
                      'Nombre completo',
                      'Dirección de correo electrónico',
                      'Número de teléfono',
                      'País o región de residencia',
                    ],
                  },
                  {
                    title: 'Datos de Uso',
                    items: [
                      'Dirección IP y ubicación aproximada',
                      'Tipo y versión del navegador',
                      'Páginas visitadas y tiempo de permanencia',
                      'Fecha y hora de acceso',
                    ],
                  },
                  {
                    title: 'Cookies y Tecnologías de Seguimiento',
                    items: [
                      'Cookies de sesión (temporales, se eliminan al cerrar el navegador)',
                      'Cookies persistentes (almacenadas por un período determinado)',
                      'Píxeles de seguimiento para análisis de comportamiento',
                      'Almacenamiento local del navegador (localStorage)',
                    ],
                  },
                ].map((group) => (
                  <div key={group.title} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-cyan-400 font-semibold mb-3">{group.title}</h3>
                    <ul className="space-y-2 text-sm">
                      {group.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. GOOGLE ANALYTICS */}
            <section id="google-analytics" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 text-sm font-bold shrink-0">4</span>
                Google Analytics y Rastreo
              </h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
                <p>
                  Utilizamos <strong className="text-white">Google Analytics</strong> (ID: G-5QMFTBP765) para
                  comprender cómo los visitantes interactúan con nuestro sitio. Este servicio recopila datos
                  de forma anónima y agregada, incluyendo:
                </p>
                <ul className="space-y-2 text-sm">
                  {[
                    'Número de visitantes y sesiones',
                    'Duración promedio de las sesiones',
                    'Páginas más visitadas y flujo de navegación',
                    'Fuentes de tráfico (búsqueda orgánica, redes sociales, etc.)',
                    'Datos demográficos generales (país, idioma del navegador)',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p>
                  Google Analytics puede colocar cookies en tu dispositivo. Puedes optar por no participar
                  instalando el{' '}
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    complemento de inhabilitación del navegador de Google Analytics
                  </a>
                  .
                </p>
                <p>
                  Para más información sobre las prácticas de privacidad de Google, visita la{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    Política de Privacidad de Google
                  </a>
                  .
                </p>
              </div>
            </section>

            {/* 5. USO DE LOS DATOS */}
            <section id="uso-de-datos" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 text-sm font-bold shrink-0">5</span>
                Uso de los Datos
              </h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
                <p>Usamos la información recopilada para los siguientes fines:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  {[
                    { icon: '📚', text: 'Proporcionar, operar y mejorar nuestros cursos y servicios educativos.' },
                    { icon: '📧', text: 'Enviarte confirmaciones de inscripción y comunicaciones relevantes.' },
                    { icon: '🛡️', text: 'Prevenir actividades fraudulentas y garantizar la seguridad de la plataforma.' },
                    { icon: '📊', text: 'Analizar el uso del sitio web para mejorar la experiencia de usuario.' },
                    { icon: '🎓', text: 'Personalizar el contenido educativo según tus preferencias e historial.' },
                    { icon: '⚖️', text: 'Cumplir con obligaciones legales y regulatorias aplicables.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-800/50 p-4 rounded-lg">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 6. SEGURIDAD */}
            <section id="seguridad" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 text-sm font-bold shrink-0">6</span>
                Seguridad de los Datos
              </h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
                <p>
                  Implementamos medidas técnicas y organizativas razonables para proteger tu información
                  personal contra acceso no autorizado, alteración, divulgación o destrucción.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Cifrado SSL/TLS', desc: 'Toda la comunicación entre tu navegador y nuestros servidores está cifrada.' },
                    { label: 'Autenticación segura', desc: 'Contraseñas almacenadas con hashing bcrypt. Autenticación gestionada por Supabase.' },
                    { label: 'Acceso restringido', desc: 'Solo el personal autorizado tiene acceso a los datos personales.' },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-800/60 p-4 rounded-lg border border-gray-700">
                      <p className="text-cyan-400 font-semibold text-sm mb-2">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  Aunque aplicamos medidas de seguridad estrictas, ningún sistema de transmisión por Internet
                  es 100 % seguro. Te recomendamos mantener tu contraseña confidencial y notificarnos
                  inmediatamente si sospechas de algún acceso no autorizado a tu cuenta.
                </p>
              </div>
            </section>

            {/* 7. TUS DERECHOS */}
            <section id="derechos" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 text-sm font-bold shrink-0">7</span>
                Tus Derechos
              </h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
                <p>
                  Dependiendo de tu ubicación, puedes tener los siguientes derechos respecto a tus datos
                  personales:
                </p>
                <ul className="space-y-3">
                  {[
                    { right: 'Acceso', desc: 'Solicitar una copia de los datos personales que tenemos sobre ti.' },
                    { right: 'Rectificación', desc: 'Solicitar la corrección de datos inexactos o incompletos.' },
                    { right: 'Eliminación', desc: 'Solicitar la eliminación de tus datos personales (derecho al olvido).' },
                    { right: 'Portabilidad', desc: 'Recibir tus datos en un formato estructurado y de uso común.' },
                    { right: 'Oposición', desc: 'Oponerte al procesamiento de tus datos para fines de marketing directo.' },
                    { right: 'Cancelar suscripciones', desc: 'Darte de baja de nuestras comunicaciones en cualquier momento.' },
                  ].map((item) => (
                    <li key={item.right} className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-2" />
                      <span>
                        <strong className="text-white">{item.right}:</strong> {item.desc}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-400">
                  Para ejercer cualquiera de estos derechos, contáctanos en{' '}
                  <a href="mailto:puntacanaacademy.info@gmail.com" className="text-cyan-400 hover:underline">
                    puntacanaacademy.info@gmail.com
                  </a>
                  . Responderemos a tu solicitud en un plazo de 30 días.
                </p>
              </div>
            </section>

            {/* 8. COOKIES */}
            <section id="cookies" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 text-sm font-bold shrink-0">8</span>
                Gestión de Cookies
              </h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
                <p>
                  Las cookies son pequeños archivos de texto almacenados en tu dispositivo. Usamos los
                  siguientes tipos:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left text-gray-400 font-medium py-2 pr-4">Tipo</th>
                        <th className="text-left text-gray-400 font-medium py-2 pr-4">Propósito</th>
                        <th className="text-left text-gray-400 font-medium py-2">Duración</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {[
                        { type: 'Esenciales', purpose: 'Autenticación de sesión y seguridad', duration: 'Sesión' },
                        { type: 'Analíticas', purpose: 'Google Analytics (comportamiento de usuarios)', duration: '2 años' },
                        { type: 'Funcionales', purpose: 'Preferencias del usuario (idioma, tema)', duration: '1 año' },
                      ].map((row) => (
                        <tr key={row.type}>
                          <td className="py-3 pr-4 text-cyan-400 font-medium">{row.type}</td>
                          <td className="py-3 pr-4 text-gray-300">{row.purpose}</td>
                          <td className="py-3 text-gray-400">{row.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-400">
                  Puedes controlar o eliminar las cookies desde la configuración de tu navegador. Ten en cuenta
                  que deshabilitar ciertas cookies puede afectar la funcionalidad del sitio.
                </p>
              </div>
            </section>

            {/* 9. TERCEROS */}
            <section id="terceros" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 text-sm font-bold shrink-0">9</span>
                Servicios de Terceros
              </h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
                <p>
                  Podemos compartir tu información con terceros de confianza únicamente cuando sea necesario
                  para prestarte el servicio:
                </p>
                <div className="space-y-3">
                  {[
                    {
                      name: 'Supabase',
                      role: 'Proveedor de base de datos y autenticación',
                      link: 'https://supabase.com/privacy',
                    },
                    {
                      name: 'Google Analytics',
                      role: 'Análisis de tráfico web (datos anónimos y agregados)',
                      link: 'https://policies.google.com/privacy',
                    },
                    {
                      name: 'Google Maps',
                      role: 'Integración de mapas para mostrar nuestra ubicación',
                      link: 'https://policies.google.com/privacy',
                    },
                    {
                      name: 'WhatsApp / Meta',
                      role: 'Canal de comunicación directa con estudiantes',
                      link: 'https://www.whatsapp.com/legal/privacy-policy',
                    },
                  ].map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-700"
                    >
                      <div>
                        <p className="text-white font-medium text-sm">{service.name}</p>
                        <p className="text-gray-400 text-xs">{service.role}</p>
                      </div>
                      <a
                        href={service.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:underline shrink-0 ml-4"
                      >
                        Ver política
                      </a>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  No vendemos ni alquilamos tu información personal a terceros con fines publicitarios.
                </p>
              </div>
            </section>

            {/* 10. RETENCIÓN */}
            <section id="retencion" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 text-sm font-bold shrink-0">10</span>
                Retención de Datos
              </h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
                <p>
                  Conservamos tus datos personales durante el tiempo necesario para cumplir los fines
                  descritos en esta política, a menos que la ley exija un período de retención más largo.
                </p>
                <ul className="space-y-3 text-sm">
                  {[
                    'Datos de cuenta activa: mientras tu cuenta permanezca activa.',
                    'Datos de cursos completados: hasta 3 años para emitir certificados y mantener registros académicos.',
                    'Datos de contacto y comunicaciones: hasta 2 años desde el último contacto.',
                    'Datos de Analytics: según la política de retención de Google Analytics (26 meses por defecto).',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-400">
                  Puedes solicitar la eliminación de tu cuenta y datos en cualquier momento escribiéndonos a
                  nuestro correo de contacto.
                </p>
              </div>
            </section>

            {/* 11. CONTACTO */}
            <section id="contacto" className="scroll-mt-28">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 text-sm font-bold shrink-0">11</span>
                Contacto
              </h2>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <p className="mb-6">
                  Si tienes preguntas, dudas o solicitudes relacionadas con esta Política de Privacidad,
                  contáctanos por cualquiera de los siguientes medios:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700">
                    <p className="text-cyan-400 font-semibold text-sm mb-2">Correo Electrónico</p>
                    <a
                      href="mailto:puntacanaacademy.info@gmail.com"
                      className="text-gray-300 text-sm hover:text-cyan-400 transition-colors break-all"
                    >
                      puntacanaacademy.info@gmail.com
                    </a>
                  </div>
                  <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700">
                    <p className="text-cyan-400 font-semibold text-sm mb-2">Teléfono / WhatsApp</p>
                    <p className="text-gray-300 text-sm">+1 (829) 270-7821</p>
                  </div>
                  <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700">
                    <p className="text-cyan-400 font-semibold text-sm mb-2">Dirección Física</p>
                    <p className="text-gray-300 text-sm">
                      Av. Estados Unidos 41201<br />
                      Plaza Doña Belgica, Local L5<br />
                      Punta Cana, República Dominicana
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* NOTA FINAL */}
            <div className="border border-cyan-400/20 bg-cyan-400/5 rounded-xl p-6 text-center">
              <p className="text-gray-400 text-sm">
                Punta Cana Academy se reserva el derecho de actualizar esta Política de Privacidad en
                cualquier momento. Te notificaremos de cambios significativos por correo electrónico o
                mediante un aviso destacado en nuestro sitio web.
              </p>
              <p className="text-gray-500 text-xs mt-3">
                © {new Date().getFullYear()} Punta Cana Academy. Todos los derechos reservados.
              </p>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
