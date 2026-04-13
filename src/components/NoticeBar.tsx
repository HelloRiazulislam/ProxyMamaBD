import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Megaphone, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function NoticeBar() {
  const [notice, setNotice] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'platform'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.noticeBar?.isActive && data.noticeBar?.content?.trim()) {
          setNotice(data.noticeBar);
          setIsVisible(true);
        } else {
          setNotice(null);
        }
      }
    });
    return () => unsub();
  }, []);

  if (!notice || !isVisible) return null;

  const typeStyles = {
    info: "bg-blue-600 text-white",
    warning: "bg-yellow-500 text-white",
    success: "bg-green-600 text-white",
    danger: "bg-red-600 text-white"
  };

  return (
    <div className={cn(
      "relative py-2 px-4 flex items-center justify-center text-center text-xs font-medium z-[60]",
      typeStyles[notice.type as keyof typeof typeStyles] || typeStyles.info
    )}>
      <div className="flex items-center justify-center max-w-7xl mx-auto">
        <Megaphone size={14} className="mr-2 flex-shrink-0" />
        <span className="truncate">{notice.content}</span>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute right-2 p-1 hover:bg-black/10 rounded-full transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
