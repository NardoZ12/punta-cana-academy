'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  X, Video, FileText, Presentation, HelpCircle, Plus, Trash2, 
  Eye, EyeOff, Save, Check, AlertCircle, ExternalLink, Play,
  ChevronDown, ChevronUp, GripVertical
} from 'lucide-react';
import { getVideoInfo, getEmbedUrl, isValidVideoUrl, getProviderIcon, VideoInfo } from '@/utils/videoEmbed';

// ============================================
// TIPOS
// ============================================

interface VideoResource {
  id: string;
  url: string;
  title: string;
  provider: 'youtube' | 'vimeo' | 'unknown';
  embedUrl: string | null;
  duration_seconds?: number;
}

interface DocumentResource {
  type: 'pdf' | 'slides' | 'other';
  url: string;
  title: string;
  provider?: 'google_slides' | 'canva' | 'pdf' | 'custom';
}

interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswer: number;
  points: number;
}

export interface TopicResourceData {
  introduction: string;
  introduction_format: 'markdown' | 'html' | 'plain';
  videos: VideoResource[];
  documents: DocumentResource[];
  quiz: QuizQuestion[];
  is_published: boolean;
}

interface TopicResourceEditorProps {
  topicId: string;
  topicTitle: string;
  unitId: string;
  courseId: string;
  initialData?: Partial<TopicResourceData>;
  onSave: (data: TopicResourceData) => Promise<void>;
  onClose: () => void;
}

// ============================================
// SUB-COMPONENTES
// ============================================

// Vista previa de video embebido
function VideoPreview({ url, title }: { url: string; title: string }) {
  const [error, setError] = useState(false);
  const info = getVideoInfo(url);

  if (!info.embedUrl || error) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center border border-red-500/30">
        <div className="text-center text-gray-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
          <p className="text-sm">URL de video no válida</p>
          <p className="text-xs text-gray-500 mt-1">Soportamos YouTube y Vimeo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="aspect-video rounded-lg overflow-hidden border border-gray-700">
        <iframe
          src={info.embedUrl}
          title={title || 'Video Preview'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={() => setError(true)}
        />
      </div>
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded text-xs">
        <span>{getProviderIcon(info.provider)}</span>
        <span className="capitalize">{info.provider}</span>
      </div>
    </div>
  );
}

// Editor de un video individual
function VideoEditor({ 
  video, 
  index, 
  onUpdate, 
  onRemove 
}: { 
  video: VideoResource; 
  index: number;
  onUpdate: (video: VideoResource) => void;
  onRemove: () => void;
}) {
  const [showPreview, setShowPreview] = useState(true);
  const [localUrl, setLocalUrl] = useState(video.url);

  const handleUrlChange = useCallback((newUrl: string) => {
    setLocalUrl(newUrl);
    const info = getVideoInfo(newUrl);
    onUpdate({
      ...video,
      url: newUrl,
      provider: info.provider,
      embedUrl: info.embedUrl
    });
  }, [video, onUpdate]);

  const isValid = isValidVideoUrl(localUrl);

  return (
    <div className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-600 cursor-grab" />
          <span className="text-sm font-medium text-gray-300">Video {index + 1}</span>
          {isValid && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              ✓ Válido
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
            title={showPreview ? 'Ocultar preview' : 'Mostrar preview'}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10"
            title="Eliminar video"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Título del video</label>
          <input
            type="text"
            value={video.title}
            onChange={(e) => onUpdate({ ...video, title: e.target.value })}
            placeholder="Ej: Introducción al tema"
            className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Duración (segundos)</label>
          <input
            type="number"
            value={video.duration_seconds || ''}
            onChange={(e) => onUpdate({ ...video, duration_seconds: parseInt(e.target.value) || 0 })}
            placeholder="Ej: 600"
            className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">
          URL del video (YouTube o Vimeo)
        </label>
        <div className="relative">
          <input
            type="url"
            value={localUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
            className={`w-full bg-[#030712] border rounded-lg px-3 py-2 pr-10 text-sm text-white focus:outline-none ${
              localUrl && !isValid 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-700 focus:border-cyan-500'
            }`}
          />
          {localUrl && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValid ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
            </span>
          )}
        </div>
        {localUrl && !isValid && (
          <p className="text-xs text-red-400 mt-1">
            URL no reconocida. Usa links de YouTube o Vimeo.
          </p>
        )}
      </div>

      {/* Preview */}
      {showPreview && localUrl && isValid && (
        <div className="pt-2">
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <Eye className="w-3 h-3" /> Vista previa (así lo verán los estudiantes)
          </p>
          <VideoPreview url={localUrl} title={video.title} />
        </div>
      )}
    </div>
  );
}

// Editor de Quiz
function QuizEditor({
  questions,
  onChange
}: {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q_${Date.now()}`,
      text: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10
    };
    onChange([...questions, newQuestion]);
    setExpanded(newQuestion.id);
  };

  const updateQuestion = (index: number, updated: QuizQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updated;
    onChange(newQuestions);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            Cuestionario del Tema
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            Agrega preguntas de repaso para este tema
          </p>
        </div>
        <span className="text-sm text-gray-400">
          {questions.length} pregunta{questions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista de preguntas */}
      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-[#0a0f1a] border border-gray-800 rounded-xl overflow-hidden">
            {/* Header colapsable */}
            <button
              onClick={() => setExpanded(expanded === q.id ? null : q.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-cyan-400">#{idx + 1}</span>
                <span className="text-sm text-white truncate max-w-md">
                  {q.text || 'Nueva pregunta...'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                  {q.points} pts
                </span>
                {expanded === q.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {/* Contenido expandido */}
            {expanded === q.id && (
              <div className="p-4 pt-0 space-y-4 border-t border-gray-800">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Pregunta</label>
                  <textarea
                    value={q.text}
                    onChange={(e) => updateQuestion(idx, { ...q, text: e.target.value })}
                    placeholder="Escribe la pregunta..."
                    rows={2}
                    className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(idx, { 
                        ...q, 
                        type: e.target.value as 'multiple_choice' | 'true_false',
                        options: e.target.value === 'true_false' ? ['Verdadero', 'Falso'] : q.options
                      })}
                      className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="multiple_choice">Opción múltiple</option>
                      <option value="true_false">Verdadero/Falso</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Puntos</label>
                    <input
                      type="number"
                      value={q.points}
                      onChange={(e) => updateQuestion(idx, { ...q, points: parseInt(e.target.value) || 10 })}
                      className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Opciones */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    Opciones (marca la correcta)
                  </label>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuestion(idx, { ...q, correctAnswer: optIdx })}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            q.correctAnswer === optIdx
                              ? 'border-green-500 bg-green-500/20'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          {q.correctAnswer === optIdx && (
                            <Check className="w-3 h-3 text-green-400" />
                          )}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...q.options];
                            newOptions[optIdx] = e.target.value;
                            updateQuestion(idx, { ...q, options: newOptions });
                          }}
                          placeholder={`Opción ${String.fromCharCode(65 + optIdx)}`}
                          disabled={q.type === 'true_false'}
                          className="flex-1 bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => removeQuestion(idx)}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Eliminar pregunta
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botón agregar */}
      <button
        onClick={addQuestion}
        className="w-full py-3 border border-dashed border-gray-700 text-gray-400 rounded-xl hover:border-purple-500/50 hover:text-purple-400 transition-colors text-sm flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Agregar pregunta
      </button>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function TopicResourceEditor({
  topicId,
  topicTitle,
  unitId,
  courseId,
  initialData,
  onSave,
  onClose
}: TopicResourceEditorProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'videos' | 'docs' | 'quiz'>('content');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Estado del formulario
  const [data, setData] = useState<TopicResourceData>({
    introduction: initialData?.introduction || '',
    introduction_format: initialData?.introduction_format || 'markdown',
    videos: initialData?.videos || [],
    documents: initialData?.documents || [],
    quiz: initialData?.quiz || [],
    is_published: initialData?.is_published || false
  });

  // Detectar cambios
  useEffect(() => {
    setHasChanges(true);
  }, [data]);

  // Handlers de videos
  const addVideo = () => {
    const newVideo: VideoResource = {
      id: `vid_${Date.now()}`,
      url: '',
      title: '',
      provider: 'unknown',
      embedUrl: null
    };
    setData({ ...data, videos: [...data.videos, newVideo] });
  };

  const updateVideo = (index: number, updated: VideoResource) => {
    const newVideos = [...data.videos];
    newVideos[index] = updated;
    setData({ ...data, videos: newVideos });
  };

  const removeVideo = (index: number) => {
    setData({ ...data, videos: data.videos.filter((_, i) => i !== index) });
  };

  // Handler de documentos
  const updateDocument = (type: 'pdf' | 'slides', field: string, value: string) => {
    const existing = data.documents.find(d => d.type === type);
    const updated: DocumentResource = existing 
      ? { ...existing, [field]: value }
      : { type, url: '', title: '', [field]: value };
    
    setData({
      ...data,
      documents: [
        ...data.documents.filter(d => d.type !== type),
        updated
      ]
    });
  };

  // Guardar
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(data);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar los recursos');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'content', label: 'Contenido', icon: FileText, count: null },
    { id: 'videos', label: 'Videos', icon: Video, count: data.videos.length },
    { id: 'docs', label: 'Documentos', icon: Presentation, count: data.documents.length },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle, count: data.quiz.length },
  ] as const;

  const pdfDoc = data.documents.find(d => d.type === 'pdf');
  const slidesDoc = data.documents.find(d => d.type === 'slides');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1419] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              📚 Editor de Recursos
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">{topicTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                Sin guardar
              </span>
            )}
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-cyan-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="bg-cyan-500/20 text-cyan-400 text-xs px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* Tab: Contenido */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Introducción al Tema
                </label>
                <textarea
                  value={data.introduction}
                  onChange={(e) => setData({ ...data, introduction: e.target.value })}
                  placeholder="Escribe una introducción que prepare al estudiante para el contenido..."
                  rows={6}
                  className="w-full bg-[#030712] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Soporta Markdown para formato de texto
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                <input
                  type="checkbox"
                  id="is-published"
                  checked={data.is_published}
                  onChange={(e) => setData({ ...data, is_published: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500"
                />
                <label htmlFor="is-published" className="text-sm text-gray-300">
                  Publicar recursos (visible para estudiantes)
                </label>
              </div>
            </div>
          )}

          {/* Tab: Videos */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Videos del Tema</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Máximo 3 videos. Se reproducirán dentro de la plataforma.
                  </p>
                </div>
              </div>

              {/* Lista de videos */}
              <div className="space-y-4">
                {data.videos.map((video, idx) => (
                  <VideoEditor
                    key={video.id}
                    video={video}
                    index={idx}
                    onUpdate={(updated) => updateVideo(idx, updated)}
                    onRemove={() => removeVideo(idx)}
                  />
                ))}
              </div>

              {/* Botón agregar */}
              {data.videos.length < 3 && (
                <button
                  onClick={addVideo}
                  className="w-full py-4 border border-dashed border-gray-700 text-gray-400 rounded-xl hover:border-cyan-500/50 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Agregar video ({data.videos.length}/3)
                </button>
              )}

              {data.videos.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay videos agregados</p>
                  <p className="text-xs mt-1">Haz clic en &quot;Agregar video&quot; para comenzar</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Documentos */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              {/* PDF */}
              <div className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <h3 className="font-medium text-white">Material PDF</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Título</label>
                    <input
                      type="text"
                      value={pdfDoc?.title || ''}
                      onChange={(e) => updateDocument('pdf', 'title', e.target.value)}
                      placeholder="Ej: Guía de estudio"
                      className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">URL del PDF</label>
                    <input
                      type="url"
                      value={pdfDoc?.url || ''}
                      onChange={(e) => updateDocument('pdf', 'url', e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Slides */}
              <div className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Presentation className="w-5 h-5 text-purple-400" />
                  <h3 className="font-medium text-white">Diapositivas</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Título</label>
                      <input
                        type="text"
                        value={slidesDoc?.title || ''}
                        onChange={(e) => updateDocument('slides', 'title', e.target.value)}
                        placeholder="Ej: Presentación del tema"
                        className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Proveedor</label>
                      <select
                        value={slidesDoc?.provider || 'google_slides'}
                        onChange={(e) => updateDocument('slides', 'provider', e.target.value)}
                        className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="google_slides">Google Slides</option>
                        <option value="canva">Canva</option>
                        <option value="pdf">PDF</option>
                        <option value="custom">Otro</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">URL de las diapositivas</label>
                    <input
                      type="url"
                      value={slidesDoc?.url || ''}
                      onChange={(e) => updateDocument('slides', 'url', e.target.value)}
                      placeholder="https://docs.google.com/presentation/..."
                      className="w-full bg-[#030712] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Quiz */}
          {activeTab === 'quiz' && (
            <QuizEditor
              questions={data.quiz}
              onChange={(quiz) => setData({ ...data, quiz })}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-800 bg-[#0a0f1a] flex-shrink-0">
          <div className="text-sm text-gray-400">
            {data.videos.filter(v => v.embedUrl).length} video(s) válido(s) · 
            {data.documents.filter(d => d.url).length} documento(s) · 
            {data.quiz.length} pregunta(s)
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Recursos
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
