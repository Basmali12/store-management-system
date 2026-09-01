import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import {
  fetchPublishedAppVersion,
  hasNewAppVersion,
} from '../update/appVersion';

interface UpdatePromptProps {
  availableVersion?: string | null;
}

export function UpdatePrompt({ availableVersion }: UpdatePromptProps) {
  const [publishedVersion, setPublishedVersion] = useState<string | null>(availableVersion ?? null);
  const [expanded, setExpanded] = useState(true);
  const updateAvailable = hasNewAppVersion(publishedVersion);

  useEffect(() => {
    if (availableVersion !== undefined) setPublishedVersion(availableVersion);
  }, [availableVersion]);

  useEffect(() => {
    if (availableVersion !== undefined) return;
    const checkVersion = async () => {
      if (!navigator.onLine) return;
      const version = await fetchPublishedAppVersion();
      if (version) setPublishedVersion(version);
    };
    const handleFocusOrOnline = () => void checkVersion();
    void checkVersion();
    const interval = window.setInterval(checkVersion, 5 * 60 * 1000);
    window.addEventListener('focus', handleFocusOrOnline);
    window.addEventListener('online', handleFocusOrOnline);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocusOrOnline);
      window.removeEventListener('online', handleFocusOrOnline);
    };
  }, [availableVersion]);

  const applyUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(async registration => {
        await registration.update();
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      }));
    }
    window.setTimeout(() => window.location.reload(), 300);
  };

  if (!updateAvailable) return null;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="يوجد تحديث جديد"
        className="fixed left-4 top-4 z-[240] flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-xl shadow-amber-500/30"
      >
        <RefreshCw size={26} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[230] flex items-end justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:items-center" dir="rtl">
      <div className="relative w-full max-w-sm rounded-[2rem] border border-amber-300/40 bg-[#0b1b33] p-6 text-white shadow-2xl">
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="تحديث لاحقًا"
          className="absolute left-4 top-4 rounded-full bg-white/10 p-2 hover:bg-white/20"
        >
          <X size={20} />
        </button>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/25">
          <RefreshCw size={38} />
        </div>
        <h2 className="mt-5 text-center text-2xl font-extrabold text-amber-300">يوجد تحديث جديد</h2>
        <p className="mt-2 text-center text-sm leading-7 text-slate-200">
          الإصدار {publishedVersion} جاهز. حمّل النسخة الجديدة للحصول على آخر الإضافات والإصلاحات.
        </p>
        <button
          type="button"
          onClick={() => void applyUpdate()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3.5 font-extrabold text-slate-950 hover:bg-amber-300"
        >
          <RefreshCw size={21} />
          تحميل النسخة الجديدة
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-2 w-full rounded-2xl px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5"
        >
          لاحقًا
        </button>
      </div>
    </div>
  );
}
