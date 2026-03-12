import React, { useState, useEffect } from 'react';
import { Search, User, CreditCard, MapPin, Calendar, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

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

interface AccountData {
  accountNumber: string;
  balance: number;
  address: string;
  lastPaymentDate: string;
}

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
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

  const handleFetchData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!accountNumber || accountNumber.length < 5) {
      setError('Введите корректный лицевой счет');
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
      }
      return;
    }

    setError('');
    setIsLoading(true);
    setAccountData(null);
    
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium');
    }

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      
      // Mock response based on account number length to show different states
      const isDebt = accountNumber.endsWith('0');
      
      setAccountData({
        accountNumber,
        balance: isDebt ? -1500 : 2500,
        address: 'г. Актобе, пр. Абилкайыр хана, д. 42, кв. 15',
        lastPaymentDate: '12.02.2026',
      });
      
      // Setup MainButton for payment if there's a debt
      if (tg?.MainButton) {
        tg.MainButton.text = isDebt ? 'ОПЛАТИТЬ ДОЛГ' : 'ПОПОЛНИТЬ СЧЕТ';
        tg.MainButton.color = tg.themeParams?.button_color || '#2481cc';
        tg.MainButton.textColor = tg.themeParams?.button_text_color || '#ffffff';
        tg.MainButton.show();
        
        // Remove previous click handlers to avoid duplicates
        tg.MainButton.offClick(handlePayment);
        tg.MainButton.onClick(handlePayment);
      }
    }, 1500);
  };

  const handlePayment = () => {
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('heavy');
    }
    tg?.showAlert('Переход к платежной системе...');
  };

  // Cleanup MainButton when component unmounts or accountData changes
  useEffect(() => {
    return () => {
      if (tg?.MainButton) {
        tg.MainButton.hide();
        tg.MainButton.offClick(handlePayment);
      }
    };
  }, []);

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
          <h2 className="text-lg font-semibold mb-4">Проверка баланса</h2>
          
          <form onSubmit={handleFetchData} className="flex flex-col gap-4">
            <div>
              <label htmlFor="account" className="block text-sm font-medium text-[var(--color-tg-hint)] mb-1.5">
                Лицевой счет
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-tg-hint)]">
                  <Search size={18} />
                </div>
                <input
                  id="account"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-[var(--color-tg-secondary-bg)] text-[var(--color-tg-text)] focus:ring-2 focus:ring-[var(--color-tg-button)] focus:border-transparent transition-all outline-none"
                  placeholder="Введите номер счета"
                />
              </div>
              {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading || !accountNumber}
              className="w-full bg-[var(--color-tg-button)] text-[var(--color-tg-button-text)] font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Поиск...</span>
                </>
              ) : (
                <span>Узнать состояние счета</span>
              )}
            </button>
          </form>
        </div>

        {/* Result Card */}
        {accountData && (
          <div className="bg-[var(--color-tg-bg)] rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-sm text-[var(--color-tg-hint)]">Лицевой счет</p>
                <p className="font-mono font-medium text-lg">{accountData.accountNumber}</p>
              </div>
              <div className={`p-2 rounded-full ${accountData.balance >= 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                {accountData.balance >= 0 ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-[var(--color-tg-hint)] mb-1">Текущий баланс</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${accountData.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {accountData.balance > 0 ? '+' : ''}{accountData.balance}
                </span>
                <span className="text-lg font-medium text-[var(--color-tg-hint)]">₸</span>
              </div>
              {accountData.balance < 0 && (
                <p className="text-sm text-red-500 mt-1">У вас имеется задолженность</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-[var(--color-tg-hint)] mt-0.5">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-tg-hint)]">Адрес</p>
                  <p className="text-sm font-medium">{accountData.address}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="text-[var(--color-tg-hint)] mt-0.5">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-tg-hint)]">Последний платеж</p>
                  <p className="text-sm font-medium">{accountData.lastPaymentDate}</p>
                </div>
              </div>
            </div>

            {/* Fallback button if Telegram MainButton is not available (e.g. web browser) */}
            {(!tg?.MainButton || !tg.MainButton.isVisible) && (
              <button
                onClick={handlePayment}
                className="w-full mt-6 bg-[var(--color-tg-button)] text-[var(--color-tg-button-text)] font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <CreditCard size={20} />
                <span>{accountData.balance < 0 ? 'Оплатить долг' : 'Пополнить счет'}</span>
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
