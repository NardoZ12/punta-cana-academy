/**
 * Utilidades para convertir URLs de video en URLs embebibles
 */

export interface VideoInfo {
  provider: 'youtube' | 'vimeo' | 'unknown';
  videoId: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
}

/**
 * Detecta el proveedor y extrae el ID del video
 */
export function getVideoInfo(url: string): VideoInfo {
  if (!url || typeof url !== 'string') {
    return { provider: 'unknown', videoId: null, embedUrl: null, thumbnailUrl: null };
  }

  const trimmedUrl = url.trim();

  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Solo el ID
  ];

  for (const pattern of youtubePatterns) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      return {
        provider: 'youtube',
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      };
    }
  }

  // Vimeo patterns
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/
  ];

  for (const pattern of vimeoPatterns) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      const videoId = match[1];
      return {
        provider: 'vimeo',
        videoId,
        embedUrl: `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`,
        thumbnailUrl: null // Vimeo requiere API para thumbnails
      };
    }
  }

  return { provider: 'unknown', videoId: null, embedUrl: null, thumbnailUrl: null };
}

/**
 * Convierte cualquier URL de video a formato embed
 */
export function getEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const info = getVideoInfo(url);
  return info.embedUrl;
}

/**
 * Valida si una URL es un video soportado
 */
export function isValidVideoUrl(url: string): boolean {
  const info = getVideoInfo(url);
  return info.provider !== 'unknown' && info.embedUrl !== null;
}

/**
 * Obtiene el ícono del proveedor
 */
export function getProviderIcon(provider: string): string {
  switch (provider) {
    case 'youtube': return '🔴';
    case 'vimeo': return '🔵';
    default: return '🎬';
  }
}
