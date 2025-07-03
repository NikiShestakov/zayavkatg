
import React from 'react';
import { UserProfile, MediaItem } from '../types';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import NoteIcon from './icons/NoteIcon';

interface ProfileListItemProps {
  profile: UserProfile;
  onEdit: (profile: UserProfile) => void;
  onDelete: (profileId: string) => void;
  onOpenMedia: (media: MediaItem[], startIndex: number) => void;
}

const ProfileListItem: React.FC<ProfileListItemProps> = ({ profile, onEdit, onDelete, onOpenMedia }) => {
  const { id, date, userName, media, name, age, height, weight, measurements, about, notes } = profile;

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-bg-primary rounded-xl shadow-md overflow-hidden transition-shadow hover:shadow-lg">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-text-primary">{name || 'Без имени'}</h3>
            <p className="text-sm text-accent">@{userName}</p>
            <p className="text-xs text-text-secondary mt-1">{formatDate(date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(profile)}
              className="p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-accent transition-colors"
              aria-label="Редактировать"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(id)}
              className="p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-danger transition-colors"
              aria-label="Удалить"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
          <InfoItem label="Возраст" value={age} unit="лет" />
          <InfoItem label="Рост" value={height} unit="см" />
          <InfoItem label="Вес" value={weight} unit="кг" />
          <InfoItem label="Параметры" value={measurements} />
        </div>

        {about && (
          <div className="mt-4">
            <h4 className="font-semibold text-text-primary text-sm">О себе:</h4>
            <p className="text-text-secondary text-sm mt-1 whitespace-pre-wrap">{about}</p>
          </div>
        )}

        {notes && (
          <div className="mt-4 bg-bg-secondary p-3 rounded-lg">
             <div className="flex items-center gap-2">
                <NoteIcon className="w-5 h-5 text-accent"/>
                <h4 className="font-semibold text-text-primary text-sm">Заметки администратора:</h4>
             </div>
            <p className="text-text-secondary text-sm mt-1 whitespace-pre-wrap">{notes}</p>
          </div>
        )}

        {media.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-text-primary text-sm mb-2">Медиафайлы:</h4>
            <div className="flex overflow-x-auto gap-3 pb-2">
              {media.map((item, index) => (
                <div key={index} className="flex-shrink-0 w-32 h-32 cursor-pointer" onClick={() => onOpenMedia(media, index)}>
                  {item.type === 'image' ? (
                    <img src={item.url} alt={`Медиа ${index + 1}`} className="w-full h-full object-cover rounded-lg shadow-md bg-bg-secondary" />
                  ) : (
                    <video src={item.url} className="w-full h-full object-cover rounded-lg shadow-md bg-black"></video>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoItem: React.FC<{label: string, value: string | number | null, unit?: string}> = ({label, value, unit}) => (
    <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="font-semibold text-text-primary">{value ? `${value} ${unit || ''}`.trim() : '—'}</p>
    </div>
)

export default ProfileListItem;
