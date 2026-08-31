import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { createPasswordCredential, verifyPassword } from '../../shared/security/password';

export function AdminLoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const credential = localStorage.getItem('local_admin_credential');
  const isSetup = !credential;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 10) return setError('كلمة مرور الإدارة يجب أن تكون 10 أحرف على الأقل');
    if (isSetup) {
      if (password !== confirmPassword) return setError('كلمتا المرور غير متطابقتين');
      localStorage.setItem('local_admin_credential', await createPasswordCredential(password));
    } else if (!await verifyPassword(password, credential || '')) {
      return setError('كلمة مرور الإدارة غير صحيحة');
    }
    sessionStorage.setItem('adminSession', 'active');
    onLogin();
  };

  return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-5 font-[Cairo]" dir="rtl">
    <form onSubmit={submit} className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto"><ShieldCheck size={32}/></div>
      <div className="text-center"><h1 className="text-xl font-black">{isSetup ? 'إعداد حماية الإدارة' : 'دخول المشرف العام'}</h1><p className="text-xs text-gray-500 mt-1">هذه الحماية محلية وتُنقل إلى الخادم عند ربط قاعدة البيانات.</p></div>
      <input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="كلمة مرور الإدارة" className="w-full border rounded-xl p-3" required />
      {isSetup && <input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="تأكيد كلمة المرور" className="w-full border rounded-xl p-3" required />}
      {error && <p className="text-red-600 text-xs font-bold">{error}</p>}
      <button className="w-full bg-indigo-600 text-white rounded-xl p-3 font-bold">{isSetup ? 'حفظ وفتح الإدارة' : 'دخول'}</button>
    </form>
  </div>;
}
