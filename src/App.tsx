import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, ShieldCheck } from 'lucide-react';

// Define Telegram WebApp types for TypeScript
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

interface UserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

const avatarColors = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
  'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500',
  'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
  'bg-pink-500', 'bg-rose-500'
];

const getInitials = (firstName: string, lastName?: string) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${first}${last}` || '?';
};

const getAvatarColor = (id: number) => {
  return avatarColors[id % avatarColors.length];
};

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [error, setError] = useState('');

  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setUser(tgUser);
      } else {
        // Mock user for local testing
        setUser({ id: 123, first_name: 'Иван', last_name: 'Иванов' });
      }
    } else {
      setUser({ id: 123, first_name: 'Иван', last_name: 'Иванов' });
    }
  }, []);

  const handleCheckBalance = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!addressInput || addressInput.length < 3) {
      setError('Введите корректный адрес');
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
      }
      return;
    }

    setError('');
    setIsLoading(true);
    setResultText(null);
    
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium');
    }

    try {
      const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || user?.id || 123;
      
      const response = await fetch('https://temajuck.app.n8n.cloud/webhook/cyfral-check-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: addressInput,
          telegramId: telegramId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      
      setResultText(data.text || 'Данные успешно получены, но текст пуст');
      
    } catch (err) {
      console.error('Ошибка при запросе к n8n:', err);
      setError('Ошибка связи с сервером');
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-tg-secondary-bg)] text-[var(--color-tg-text)] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[var(--color-tg-bg)] px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-[var(--color-tg-button)] p-1.5 rounded-lg text-[var(--color-tg-button-text)]">
            <ShieldCheck size={20} />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Цифрал Актобе</h1>
        </div>
        
        {user && (
          <div className="flex items-center gap-2 bg-[var(--color-tg-secondary-bg)] pl-3 pr-1 py-1 rounded-full">
            <span className="text-sm font-medium truncate max-w-[100px]">
              {user.first_name}
            </span>
            {user.photo_url ? (
              <img
                src={user.photo_url}
                alt={user.first_name}
                className="w-7 h-7 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-sm ${getAvatarColor(user.id)}`}>
                {getInitials(user.first_name, user.last_name)}
              </div>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 p-4 flex flex-col gap-4">
        {/* Input Section */}
        <div className="bg-[var(--color-tg-bg)] rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Поиск лицевого счета</h2>
          
          <form onSubmit={handleCheckBalance} className="flex flex-col gap-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-[var(--color-tg-hint)] mb-1.5">
                Адрес
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-tg-hint)]">
                  <MapPin size={18} />
                </div>
                <input
                  id="address"
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--color-tg-secondary-bg)] text-[var(--color-tg-text)] focus:ring-2 focus:ring-[var(--color-tg-button)] focus:border-transparent transition-all outline-none"
                  placeholder="Например: ул. Иванова 35, кв. 7"
                />
              </div>
              {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !addressInput}
              className="w-full bg-[var(--color-tg-button)] text-[var(--color-tg-button-text)] font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Поиск...</span>
                </>
              ) : (
                <span>Найти лицевой счет</span>
              )}
            </button>
          </form>
        </div>

        {/* Result Card */}
        {resultText && (
          <div className="bg-[var(--color-tg-bg)] rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="whitespace-pre-wrap text-[var(--color-tg-text)] text-base leading-relaxed">
              {resultText}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
