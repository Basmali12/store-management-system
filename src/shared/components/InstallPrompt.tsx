import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches === true
  || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (isStandalone() || sessionStorage.getItem('install_prompt_skipped') === 'true') return;
    const timer = window.setTimeout(() => setVisible(true), 700);
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setVisible(false);
    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const skip = () => {
    sessionStorage.setItem('install_prompt_skipped', 'true');
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) {
      setShowInstructions(true);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') setVisible(false);
    setInstallEvent(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center" dir="rtl">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-amber-300/30 bg-[#0b1b33] p-6 text-white shadow-2xl">
        <button
          type="button"
          onClick={skip}
          aria-label="تخطي تثبيت التطبيق"
          className="absolute left-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <X size={20} />
        </button>

        <img
          src={`${import.meta.env.BASE_URL}icon-512.png`}
          alt="شعار تطبيق أبو شمس"
          className="mx-auto mb-4 h-28 w-28 rounded-[1.8rem] object-cover shadow-xl shadow-amber-400/20"
        />
        <h2 className="text-center text-2xl font-extrabold text-amber-300">ثبّت تطبيق أبو شمس</h2>
        <p className="mt-2 text-center text-sm leading-7 text-slate-200">
          وصول أسرع، عمل بدون إنترنت، وبيانات محفوظة محليًا حتى تعود المزامنة.
        </p>

        {showInstructions && (
          <div className="mt-4 rounded-2xl bg-white/10 p-3 text-center text-xs leading-6 text-slate-100">
            من قائمة المتصفح اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».
          </div>
        )}

        <button
          type="button"
          onClick={install}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3.5 font-extrabold text-slate-950 shadow-lg shadow-amber-400/20 hover:bg-amber-300"
        >
          <Download size={21} />
          تحميل التطبيق
        </button>
        <button
          type="button"
          onClick={skip}
          className="mt-2 w-full rounded-2xl px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5"
        >
          تخطي والمتابعة في المتصفح
        </button>
      </div>
    </div>
  );
}
