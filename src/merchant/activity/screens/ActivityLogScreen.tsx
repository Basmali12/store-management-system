import React, { useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { getAuditEntries } from '../../../shared/audit/auditService';

export function ActivityLogScreen({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState('');
  const entries = getAuditEntries().filter(entry => entry.description.includes(search) || entry.entity.includes(search));
  return <div className="h-screen bg-gray-50 overflow-auto font-[Cairo]" dir="rtl">
    <div className="bg-white p-4 flex items-center gap-3 sticky top-0 border-b z-10"><button onClick={onBack} className="p-2 bg-gray-100 rounded-full"><ChevronRight/></button><h1 className="text-xl font-bold">سجل العمليات</h1></div>
    <div className="p-4"><div className="relative mb-4"><Search className="absolute right-3 top-3 text-gray-400" size={18}/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="بحث في السجل..." className="w-full border rounded-xl p-3 pr-10"/></div><div className="space-y-2">{entries.map(entry=><div key={entry.id} className="bg-white border rounded-xl p-3"><div className="flex justify-between gap-2"><p className="font-bold text-sm">{entry.description}</p><span className="text-[10px] bg-gray-100 rounded px-2 py-1 h-fit">{entry.action}</span></div><p className="text-xs text-gray-400 mt-2">{new Date(entry.createdAt).toLocaleString('ar-IQ')}</p></div>)}{!entries.length&&<p className="text-center text-gray-400 py-10">لا توجد عمليات مسجلة</p>}</div></div>
  </div>;
}
