// src/components/organisms/ContactForm.tsx
'use client';

import { Button } from '../atoms/Button';

export const ContactForm = () => {
  return (
    <form className="space-y-6 bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Nombre */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-300">Nombre completo</label>
          <input 
            type="text" 
            id="name"
            placeholder="Juan Pérez"
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-pca-blue focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-300">Correo electrónico</label>
          <input 
            type="email" 
            id="email"
            placeholder="juan@ejemplo.com"
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-pca-blue focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Interés */}
      <div className="space-y-2">
        <label htmlFor="interest" className="text-sm font-medium text-gray-300">¿Qué te interesa estudiar?</label>
        <select 
          id="interest"
          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-pca-blue focus:border-transparent outline-none transition-all"
        >
          <option value="ingles">Inglés Intensivo</option>
          <option value="tecnologia">Desarrollo Web / Tecnología</option>
          <option value="frances">Francés</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      {/* Mensaje */}
      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium text-gray-300">Mensaje</label>
        <textarea 
          id="message"
          rows={4}
          placeholder="Hola, me gustaría saber los precios y horarios..."
          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-pca-blue focus:border-transparent outline-none transition-all resize-none"
        ></textarea>
      </div>

      <Button variant="primary" fullWidth onClick={() => alert('¡Mensaje enviado!')}>
        Enviar Mensaje
      </Button>
    </form>
  );
};