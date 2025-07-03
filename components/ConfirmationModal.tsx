
import React, { useEffect } from 'react';
import XIcon from './icons/XIcon';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
    
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-modal-pop" onClick={onCancel}>
      <div 
        className="bg-bg-primary rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button onClick={onCancel} className="p-1 rounded-full text-text-secondary hover:bg-bg-secondary">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6">
          <p className="text-text-secondary">{message}</p>
        </main>
        <footer className="flex justify-end p-4 border-t border-border-color bg-bg-secondary/50 rounded-b-2xl">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold rounded-lg text-text-primary hover:bg-bg-secondary/80 mr-2">
            Отмена
          </button>
          <button 
            onClick={onConfirm} 
            className="px-6 py-2 text-sm font-semibold rounded-lg bg-danger text-white hover:bg-danger-hover"
          >
            Удалить
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmationModal;
