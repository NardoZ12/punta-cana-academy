'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { createClient } from '@/utils/supabase/client';
import { 
  User,
  Mail,
  Lock,
  Bell,
  Globe,
  Shield,
  Trash2,
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  date_of_birth?: string;
  country?: string;
  timezone?: string;
  language?: string;
  created_at: string;
}

interface NotificationSettings {
  email_assignments: boolean;
  email_grades: boolean;
  email_announcements: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
}

export default function StudentSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_assignments: true,
    email_grades: true,
    email_announcements: true,
    push_notifications: true,
    sms_notifications: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Cargar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile({
          ...profileData,
          email: user.email || ''
        });
      } else {
        // Crear perfil si no existe
        const newProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          created_at: user.created_at
        };
        setProfile(newProfile);
      }

      // Cargar configuración de notificaciones (si existe)
      const { data: notifData } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (notifData) {
        setNotifications(notifData);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!profile) return;

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          full_name: profile.full_name,
          bio: profile.bio,
          phone: profile.phone,
          date_of_birth: profile.date_of_birth,
          country: profile.country,
          timezone: profile.timezone,
          language: profile.language,
          updated_at: new Date().toISOString()
        });

      if (error) {
        setErrorMessage('Error al actualizar el perfil: ' + error.message);
      } else {
        setSuccessMessage('Perfil actualizado correctamente');
      }
    } catch (error) {
      setErrorMessage('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setErrorMessage('Error al cambiar la contraseña: ' + error.message);
      } else {
        setSuccessMessage('Contraseña actualizada correctamente');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setErrorMessage('Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  const updateNotifications = async () => {
    if (!profile) return;

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: profile.id,
          ...notifications,
          updated_at: new Date().toISOString()
        });

      if (error) {
        setErrorMessage('Error al actualizar las notificaciones: ' + error.message);
      } else {
        setSuccessMessage('Configuración de notificaciones actualizada');
      }
    } catch (error) {
      setErrorMessage('Error al actualizar las notificaciones');
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    try {
      // En una implementación real, esto requeriría más lógica del backend
      // Por ahora, solo mostramos el proceso
      setErrorMessage('La eliminación de cuenta debe ser procesada por un administrador. Contacta con soporte.');
      setShowDeleteConfirm(false);
    } catch (error) {
      setErrorMessage('Error al procesar la solicitud');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'privacy', label: 'Privacidad', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Configuración</h1>
        <p className="text-gray-400">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-400">{successMessage}</span>
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-cyan-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Información del Perfil</h2>
                
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 bg-cyan-500 p-2 rounded-full hover:bg-cyan-600 transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{profile?.full_name || 'Sin nombre'}</h3>
                    <p className="text-gray-400">{profile?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={profile?.full_name || ''}
                      onChange={(e) => setProfile(profile ? { ...profile, full_name: e.target.value } : null)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={profile?.phone || ''}
                      onChange={(e) => setProfile(profile ? { ...profile, phone: e.target.value } : null)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fecha de nacimiento
                    </label>
                    <input
                      type="date"
                      value={profile?.date_of_birth || ''}
                      onChange={(e) => setProfile(profile ? { ...profile, date_of_birth: e.target.value } : null)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      País
                    </label>
                    <select
                      value={profile?.country || ''}
                      onChange={(e) => setProfile(profile ? { ...profile, country: e.target.value } : null)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="">Seleccionar país</option>
                      <option value="DO">República Dominicana</option>
                      <option value="US">Estados Unidos</option>
                      <option value="ES">España</option>
                      <option value="MX">México</option>
                      <option value="CO">Colombia</option>
                      <option value="AR">Argentina</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Biografía
                  </label>
                  <textarea
                    rows={4}
                    value={profile?.bio || ''}
                    onChange={(e) => setProfile(profile ? { ...profile, bio: e.target.value } : null)}
                    placeholder="Cuéntanos sobre ti..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <Button
                  onClick={updateProfile}
                  variant="primary"
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Seguridad</h2>
                
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-white">Email</h3>
                      <p className="text-sm text-gray-400">{profile?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Cambiar Contraseña</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contraseña actual
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-3 text-gray-400 hover:text-white"
                      >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-3 text-gray-400 hover:text-white"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirmar nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-3 text-gray-400 hover:text-white"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={updatePassword}
                    variant="primary"
                    disabled={saving || !newPassword || !confirmPassword}
                    className="flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    {saving ? 'Actualizando...' : 'Cambiar Contraseña'}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Notificaciones</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Notificaciones de tareas</h3>
                      <p className="text-sm text-gray-400">Recibe emails cuando se asignen nuevas tareas</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, email_assignments: !prev.email_assignments }))}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        notifications.email_assignments ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                          notifications.email_assignments ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Notificaciones de calificaciones</h3>
                      <p className="text-sm text-gray-400">Recibe emails cuando recibas nuevas calificaciones</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, email_grades: !prev.email_grades }))}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        notifications.email_grades ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                          notifications.email_grades ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Anuncios importantes</h3>
                      <p className="text-sm text-gray-400">Recibe emails sobre anuncios de la academia</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, email_announcements: !prev.email_announcements }))}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        notifications.email_announcements ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                          notifications.email_announcements ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">Notificaciones push</h3>
                      <p className="text-sm text-gray-400">Recibe notificaciones en tiempo real en el navegador</p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, push_notifications: !prev.push_notifications }))}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                        notifications.push_notifications ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                          notifications.push_notifications ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <Button
                  onClick={updateNotifications}
                  variant="primary"
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar Preferencias'}
                </Button>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">Privacidad y Seguridad</h2>
                
                <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-400 mb-1">Información importante</h3>
                      <p className="text-yellow-300 text-sm">
                        Tus datos están protegidos según nuestras políticas de privacidad. 
                        Solo compartes información con tus profesores y compañeros de curso según sea necesario para el aprendizaje.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Datos de la cuenta</h3>
                  <p className="text-gray-400 mb-4">
                    Si deseas eliminar tu cuenta, todos tus datos serán eliminados permanentemente. 
                    Esta acción no se puede deshacer.
                  </p>
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar Cuenta
                  </Button>
                </div>

                {/* Delete Account Modal */}
                {showDeleteConfirm && (
                  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-2xl max-w-md w-full mx-4 border border-red-500/50">
                      <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Eliminar Cuenta</h2>
                        <p className="text-gray-300 mb-6">
                          Esta acción eliminará permanentemente tu cuenta y todos tus datos. 
                          No podrás recuperar tu progreso en los cursos.
                        </p>
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => setShowDeleteConfirm(false)}
                            variant="secondary"
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={deleteAccount}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}