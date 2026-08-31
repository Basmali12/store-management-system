import React from 'react';

type ErrorBoundaryProps = { children?: React.ReactNode };

export class AppErrorBoundary extends React.Component<ErrorBoundaryProps, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-[Cairo]" dir="rtl"><div className="bg-white border rounded-2xl p-6 max-w-sm text-center"><h1 className="text-xl font-bold text-red-600">حدث خطأ غير متوقع</h1><p className="text-sm text-gray-500 mt-2">لم يتم حذف بياناتك. أعد تحميل الصفحة، وإذا تكرر الخطأ راجع سجل العمليات.</p><button onClick={()=>window.location.reload()} className="mt-4 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold">إعادة تحميل</button></div></div>;
    return this.props.children;
  }
}
