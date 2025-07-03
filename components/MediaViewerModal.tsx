
import React, { useState, useEffect } from 'react';
import { MediaItem } from '../types';
import XIcon from './icons/XIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface MediaViewerModalProps {
  media: MediaItem[];
  startIndex: number;
  onClose: () => void;
}

const MediaViewerModal: React.FC<MediaViewerModalProps> = ({ media, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev < media.length - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentItem = media[currentIndex];

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-modal-pop"
      onClick={onClose}
    >
      <button 
        className="absolute top-4 right-4 text-white/70 hover:text-white z-50 p-2 bg-black/30 rounded-full"
        onClick={onClose}
        aria-label="Закрыть"
      >
        <XIcon className="w-6 h-6" />
      </button>

      {media.length > 1 && (
        <>
            <button 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-50 p-2 bg-black/30 rounded-full"
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                aria-label="Предыдущий"
            >
                <ChevronLeftIcon className="w-8 h-8" />
            </button>
            <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-50 p-2 bg-black/30 rounded-full"
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                aria-label="Следующий"
            >
                <ChevronRightIcon className="w-8 h-8" />
            </button>
        </>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/40 px-3 py-1 rounded-full text-sm">
        {currentIndex + 1} / {media.length}
      </div>
      
      <div className="w-full h-full flex items-center justify-center p-16" onClick={e => e.stopPropagation()}>
         {currentItem.type === 'image' ? (
            <img src={currentItem.url} alt={`Media ${currentIndex + 1}`} className="max-w-full max-h-full object-contain" />
         ) : (
            <video src={currentItem.url} controls autoPlay className="max-w-full max-h-full object-contain" />
         )}
      </div>
    </div>
  );
};

export default MediaViewerModal;
