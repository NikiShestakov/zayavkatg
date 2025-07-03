
import React, { useState, useCallback, useRef } from 'react';
import { MediaItem } from '../types';
import * as apiService from '../services/apiService';
import CameraIcon from './icons/CameraIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import XIcon from './icons/XIcon';

interface MediaPreview {
    type: 'image' | 'video';
    url: string;
    file: File;
}

interface FormScreenProps {
  onSuccess: () => void;
}

const FormScreen: React.FC<FormScreenProps> = ({ onSuccess }) => {
  const [text, setText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setMediaFiles(prev => [...prev, ...newFiles]);

      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const type = file.type.startsWith('image/') ? 'image' : 'video';
          setMediaPreviews(prev => [...prev, { type, url: reader.result as string, file }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const removeMedia = (fileToRemove: File) => {
    setMediaFiles(prev => prev.filter(f => f !== fileToRemove));
    setMediaPreviews(prev => prev.filter(p => p.file !== fileToRemove));
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim() && mediaFiles.length === 0) {
      setError('Добавьте фото/видео или заполните анкету.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      
      const formData = new FormData();
      formData.append('rawText', text);
      mediaFiles.forEach(file => {
        formData.append('media', file);
      });
      
      if (tgUser) {
          formData.append('userName', tgUser.username || `user_${Date.now().toString().slice(-6)}`);
          formData.append('chatId', String(tgUser.id));
      } else {
          formData.append('userName', `user_${Date.now().toString().slice(-6)}`);
      }

      await apiService.createProfile(formData);
      
      setIsSuccess(true);
      onSuccess();

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Произошла неизвестная ошибка при отправке.');
      setIsLoading(false);
    }
  }, [text, mediaFiles, onSuccess]);

  const buttonText = () => {
    if (isLoading) return <SpinnerIcon />;
    if (isSuccess) return 'Отправлено!';
    return 'Отправить';
  };

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-grow overflow-y-auto p-4 pb-28">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary">Анкета</h1>
            <p className="text-text-secondary mt-1">Заполните поля ниже</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Фото / Видео</label>
            {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
                    {mediaPreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square">
                            {preview.type === 'image' ? (
                                <img src={preview.url} alt={`Превью ${index + 1}`} className="w-full h-full object-cover rounded-lg shadow" />
                            ) : (
                                <video src={preview.url} className="w-full h-full object-cover rounded-lg shadow bg-black"></video>
                            )}
                            <button type="button" onClick={() => removeMedia(preview.file)} className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 shadow-md flex items-center justify-center">
                                <XIcon className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 flex justify-center items-center rounded-xl border-2 border-dashed border-border-color/80 p-6 bg-bg-secondary cursor-pointer hover:border-accent transition-colors"
            >
              <div className="text-center">
                <CameraIcon className="mx-auto h-12 w-12 text-text-secondary" />
                <div className="mt-4 flex text-sm leading-6 text-text-secondary">
                    <span className="font-semibold text-accent">Загрузите файлы</span>
                    <p className="pl-1">или перетащите</p>
                </div>
                <p className="text-xs leading-5 text-text-secondary/80">PNG, JPG, MP4 до 10МБ</p>
              </div>
               <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} accept="image/*,video/*"/>
            </div>
          </div>

          <div>
            <label htmlFor="profile-text" className="block text-sm font-medium text-text-secondary mb-2">О себе</label>
            <textarea
              id="profile-text"
              rows={8}
              className="block w-full rounded-xl border-0 bg-bg-secondary py-3 px-4 text-text-primary shadow-sm ring-1 ring-inset ring-transparent placeholder:text-text-secondary/70 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6 transition-shadow"
              placeholder="Напишите здесь свободно: Имя, возраст, рост, вес, параметры и немного о себе..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isLoading || isSuccess}
            />
          </div>
          {error && <p className="text-sm text-danger text-center font-medium">{error}</p>}
        </form>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-bg-primary/80 backdrop-blur-sm p-4 border-t border-border-color/20">
        <div className="max-w-2xl mx-auto">
            <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || isSuccess}
                className="flex w-full h-12 justify-center items-center rounded-xl bg-accent px-3 py-3 text-base font-semibold leading-6 text-accent-text shadow-lg hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
                {buttonText()}
            </button>
        </div>
      </footer>
    </div>
  );
};

export default FormScreen;
