
import React, { useState, useEffect, useCallback } from 'react';
import FormScreen from './components/FormScreen';
import AdminPanel from './components/AdminPanel';
import EditProfileModal from './components/EditProfileModal';
import ConfirmationModal from './components/ConfirmationModal';
import MediaViewerModal from './components/MediaViewerModal';
import { UserProfile, MediaItem } from './types';
import * as apiService from './services/apiService';

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState(window.location.hash || '#/');
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [viewingMedia, setViewingMedia] = useState<{ media: MediaItem[]; startIndex: number } | null>(null);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getProfiles();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить анкеты.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentView(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    // После успешного создания новой анкеты, просто перезагружаем список.
    // Автоматический переход в админ-панель отключен по вашему запросу.
    fetchProfiles();
  }, [fetchProfiles]);

  const handleUpdateProfile = useCallback(async (updatedProfile: UserProfile) => {
    try {
        // Мы отправляем только данные, без файлов, т.к. бэкенд не ожидает их при обновлении.
        // Управление файлами происходит через отдельные эндпоинты (если потребуется).
        const savedProfile = await apiService.updateProfile(updatedProfile.id, updatedProfile);
        setProfiles(prev => prev.map(p => p.id === savedProfile.id ? savedProfile : p));
        setEditingProfile(null);
    } catch (err) {
        console.error("Failed to update profile:", err);
        alert(err instanceof Error ? err.message : "Ошибка обновления");
    }
  }, []);

  const handleDeleteProfile = useCallback(async () => {
    if (deletingProfileId) {
        try {
            await apiService.deleteProfile(deletingProfileId);
            setProfiles(prev => prev.filter(p => p.id !== deletingProfileId));
            setDeletingProfileId(null);
        } catch (err) {
            console.error("Failed to delete profile:", err);
            alert(err instanceof Error ? err.message : "Ошибка удаления");
            setDeletingProfileId(null);
        }
    }
  }, [deletingProfileId]);
  
  const handleOpenMediaViewer = (media: MediaItem[], startIndex: number) => {
    setViewingMedia({ media, startIndex });
  };

  const renderContent = () => {
    switch (currentView) {
      case '#/admin':
        return <AdminPanel 
                  profiles={profiles}
                  isLoading={isLoading}
                  error={error}
                  onEditProfile={setEditingProfile}
                  onDeleteRequest={setDeletingProfileId}
                  onOpenMediaViewer={handleOpenMediaViewer}
                  onRefresh={fetchProfiles}
                />;
      default:
        return <FormScreen onSuccess={handleCreateSuccess} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg-primary text-text-primary">
      <main className="flex-grow" key={currentView}>
        {renderContent()}
      </main>
      
      {editingProfile && (
        <EditProfileModal
          profile={editingProfile}
          onSave={handleUpdateProfile}
          onClose={() => setEditingProfile(null)}
        />
      )}

      {deletingProfileId && (
        <ConfirmationModal
          title="Подтвердите удаление"
          message="Вы уверены, что хотите удалить эту анкету? Это действие нельзя отменить."
          onConfirm={handleDeleteProfile}
          onCancel={() => setDeletingProfileId(null)}
        />
      )}
      
      {viewingMedia && (
         <MediaViewerModal
            media={viewingMedia.media}
            startIndex={viewingMedia.startIndex}
            onClose={() => setViewingMedia(null)}
         />
      )}
    </div>
  );
};

export default App;
