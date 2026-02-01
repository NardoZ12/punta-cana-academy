'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: string | Date;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [status, setStatus] = useState<{
    text: string;
    isUrgent: boolean;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();

      if (isNaN(target)) {
        return { text: 'Fecha inválida', isUrgent: false, isExpired: true };
      }

      const diff = target - now;

      if (diff <= 0) {
        return { text: '0d 0h 0m', isUrgent: false, isExpired: true };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Urgente si falta menos de 24 horas (86400000 ms)
      const isUrgent = diff < 86400000;

      return {
        text: `${days}d ${hours}h ${minutes}m`,
        isUrgent,
        isExpired: false
      };
    };

    setStatus(calculateTimeLeft());
    const timer = setInterval(() => setStatus(calculateTimeLeft()), 60000); // Actualizar cada minuto

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!status) return null;

  if (status.isExpired) {
    return <span className="text-gray-500 font-medium">Finalizado</span>;
  }

  return (
    <span className={`font-mono font-bold transition-colors duration-300 ${status.isUrgent ? 'text-red-600' : 'text-gray-700'}`}>
      {status.text}
    </span>
  );
}