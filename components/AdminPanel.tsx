
import React, { useState, useMemo } from 'react';
import { UserProfile, MediaItem } from '../types';
import ProfileListItem from './ProfileListItem';
import SearchIcon from './icons/SearchIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import UsersIcon from './icons/UsersIcon';
import CalendarIcon from './icons/CalendarIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import RefreshIcon from './icons/RefreshIcon';

interface AdminPanelProps {
  profiles: UserProfile[];
  isLoading: boolean;
  error: string | null;
  onEditProfile: (profile: UserProfile) => void;
  onDeleteRequest: (profileId: string) => void;
  onOpenMediaViewer: (media: MediaItem[], startIndex: number) => void;
  onRefresh: () => void;
}

type SortKey = 'date' | 'name' | 'age' | 'height' | 'weight';

const AdminPanel: React.FC<AdminPanelProps> = ({ profiles, isLoading, error, onEditProfile, onDeleteRequest, onOpenMediaViewer, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const profilesToday = profiles.filter(p => new Date(p.date) >= today).length;
    const profilesLastWeek = profiles.filter(p => new Date(p.date) >= weekAgo).length;

    return {
      total: profiles.length,
      today: profilesToday,
      lastWeek: profilesLastWeek,
    };
  }, [profiles]);

  const sortedAndFilteredProfiles = useMemo(() => {
    let filtered = [...profiles].filter(p =>
      (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.userName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.about?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal = a[key];
      let bVal = b[key];

      if (key === 'date') {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [profiles, searchTerm, sortConfig]);
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const [key, direction] = e.target.value.split('-') as [SortKey, 'asc' | 'desc'];
      setSortConfig({ key, direction });
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-20 flex flex-col items-center justify-center text-text-secondary">
          <SpinnerIcon className="w-12 h-12" />
          <p className="mt-4 text-lg">Загрузка анкет...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-20 text-danger">
          <p className="font-bold">Ошибка!</p>
          <p>{error}</p>
          <button onClick={onRefresh} className="mt-4 px-4 py-2 bg-accent text-accent-text rounded-lg hover:opacity-90">
            Попробовать снова
          </button>
        </div>
      );
    }
    
    if (sortedAndFilteredProfiles.length === 0) {
      return (
        <div className="text-center py-20 text-text-secondary">
          <p className="text-lg">Анкеты не найдены.</p>
          <p>Попробуйте обновить список или изменить поисковый запрос.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {sortedAndFilteredProfiles.map(profile => (
            <ProfileListItem
            key={profile.id}
            profile={profile}
            onEdit={onEditProfile}
            onDelete={onDeleteRequest}
            onOpenMedia={onOpenMediaViewer}
            />
        ))}
      </div>
    );
  };


  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-text-primary">Панель администратора</h1>
          <button onClick={onRefresh} disabled={isLoading} className="p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-accent disabled:opacity-50 disabled:cursor-wait transition-colors" aria-label="Обновить">
            <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <button onClick={() => window.location.hash = '#/'} className="flex items-center gap-2 text-sm text-accent font-semibold">
          <ArrowLeftIcon className="w-4 h-4" />
          Назад к форме
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<UsersIcon />} title="Всего анкет" value={isLoading ? '...' : stats.total} />
        <StatCard icon={<CalendarIcon />} title="Сегодня" value={isLoading ? '...' : stats.today} />
        <StatCard icon={<TrendingUpIcon />} title="За неделю" value={isLoading ? '...' : stats.lastWeek} />
      </div>

      <div className="bg-bg-secondary p-4 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Список анкет</h2>
            <div className="w-full md:w-auto flex gap-4">
              <div className="relative flex-grow">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-bg-primary border border-border-color/50 focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="relative">
                 <select onChange={handleSortChange} value={`${sortConfig.key}-${sortConfig.direction}`} className="appearance-none w-full pl-3 pr-10 py-2 rounded-lg bg-bg-primary border border-border-color/50 focus:ring-2 focus:ring-accent">
                    <option value="date-desc">Сначала новые</option>
                    <option value="date-asc">Сначала старые</option>
                    <option value="name-asc">Имя (А-Я)</option>
                    <option value="name-desc">Имя (Я-А)</option>
                    <option value="age-asc">Возраст (по возрастанию)</option>
                    <option value="age-desc">Возраст (по убыванию)</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              </div>
            </div>
        </div>
        
        {renderContent()}

      </div>
    </div>
  );
};

const StatCard: React.FC<{icon: React.ReactNode, title: string, value: number | string}> = ({icon, title, value}) => (
    <div className="bg-bg-secondary p-5 rounded-xl shadow-sm flex items-center justify-between">
        <div>
            <p className="text-sm text-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <div className="text-text-secondary">
            {icon}
        </div>
    </div>
)

export default AdminPanel;
