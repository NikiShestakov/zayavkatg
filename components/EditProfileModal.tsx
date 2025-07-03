
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, MediaItem } from '../types';
import XIcon from './icons/XIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface EditProfileModalProps {
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
  onClose: () => void;
}

const inputClassNames = "block w-full rounded-xl border-0 bg-bg-secondary py-3 px-4 text-text-primary shadow-sm ring-1 ring-inset ring-transparent placeholder:text-text-secondary/70 focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6 transition-shadow";

const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, onSave, onClose }) => {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Handle Esc key press
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const valueAsNumber = (name === 'age' || name === 'height' || name === 'weight') ? (value === '' ? null : Number(value)) : value;
    setFormData(prev => ({ ...prev, [name]: valueAsNumber }));
  };
  
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
  };

  const handleFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
        const newMediaItems: MediaItem[] = await Promise.all(
            Array.from(files).map(async file => {
              const url = await fileToDataUrl(file);
              const type = file.type.startsWith('image/') ? 'image' : 'video';
              return { type, url };
            })
        );
        setFormData(prev => ({...prev, media: [...prev.media, ...newMediaItems]}));
    }
  };

  const handleMediaRemove = (indexToRemove: number) => {
    setFormData(prev => ({...prev, media: prev.media.filter((_, index) => index !== indexToRemove)}));
  }

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-modal-pop">
      <div 
        className="bg-bg-primary rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="text-xl font-bold text-text-primary">Редактировать анкету</h2>
          <button onClick={onClose} className="p-1 rounded-full text-text-secondary hover:bg-bg-secondary">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Имя" name="name" value={formData.name || ''} onChange={handleChange} />
            <InputField label="Возраст" name="age" type="number" value={formData.age || ''} onChange={handleChange} />
            <InputField label="Рост (см)" name="height" type="number" value={formData.height || ''} onChange={handleChange} />
            <InputField label="Вес (кг)" name="weight" type="number" value={formData.weight || ''} onChange={handleChange} />
          </div>
          <InputField label="Параметры" name="measurements" value={formData.measurements || ''} onChange={handleChange} />
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">О себе</label>
            <textarea name="about" value={formData.about || ''} onChange={handleChange} rows={4} className={inputClassNames} />
          </div>
           <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Заметки</label>
            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} className={inputClassNames} placeholder="Служебная информация..."/>
          </div>

          <div>
             <label className="block text-sm font-medium text-text-secondary mb-2">Медиафайлы</label>
             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                 {formData.media.map((item, index) => (
                    <div key={index} className="relative aspect-square">
                        {item.type === 'image' ? (
                            <img src={item.url} alt={`Media ${index + 1}`} className="w-full h-full object-cover rounded-lg shadow bg-bg-secondary" />
                        ) : (
                            <video src={item.url} className="w-full h-full object-cover rounded-lg shadow bg-black" />
                        )}
                         <button type="button" onClick={() => handleMediaRemove(index)} className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 shadow-md flex items-center justify-center">
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                 ))}
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex justify-center items-center aspect-square rounded-lg border-2 border-dashed border-border-color/80 bg-bg-secondary cursor-pointer hover:border-accent transition-colors"
                >
                    <PlusIcon className="w-8 h-8 text-text-secondary" />
                    <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={handleFileAdd} accept="image/*,video/*"/>
                </div>
             </div>
          </div>
        </main>

        <footer className="flex justify-end p-4 border-t border-border-color bg-bg-secondary/50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg text-text-primary hover:bg-bg-secondary/80 mr-2">
            Отмена
          </button>
          <button onClick={handleSave} className="px-6 py-2 text-sm font-semibold rounded-lg bg-accent text-accent-text hover:opacity-90">
            Сохранить
          </button>
        </footer>
      </div>
    </div>
  );
};

const InputField = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-text-secondary mb-2">{label}</label>
        <input id={props.name} {...props} className={inputClassNames} />
    </div>
);


export default EditProfileModal;
