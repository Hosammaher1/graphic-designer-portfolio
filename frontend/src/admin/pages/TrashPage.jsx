import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Clock, FolderKanban, Image as ImageIcon, Layout } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { resolveLocalized } from '../utils/localization.js';

export function TrashPage() {
  const { lang, t, trash, restoreTrashItem, purgeTrashItem, emptyTrash } = useAdmin();

  const [itemToPurge, setItemToPurge] = useState(null);
  const [isEmptyConfirmOpen, setIsEmptyConfirmOpen] = useState(false);

  const handlePurgeConfirm = () => {
    if (itemToPurge) {
      purgeTrashItem(itemToPurge.id);
      setItemToPurge(null);
    }
  };

  const handleEmptyConfirm = () => {
    emptyTrash();
    setIsEmptyConfirmOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f4a496]/15">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-1">
            {lang === 'ar' ? 'سلة المهملات والاسترداد' : 'Archived & Staged Deletions'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
            <span>{t.trash.title} </span>
            <span className="text-[#f4a496] italic font-serif">Recovery</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-light">
            {t.trash.subtitle}
          </p>
        </div>

        {trash.length > 0 && (
          <button
            onClick={() => setIsEmptyConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-[#fcdcd4] bg-[#842b45]/30 hover:bg-[#842b45]/50 border border-[#f4a496]/35 transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-[#f4a496]" />
            <span>{t.trash.emptyTrashBtn}</span>
          </button>
        )}
      </div>

      {/* Recovery Notice */}
      <div className="p-4 rounded-3xl glass-panel-subtle border border-amber-500/25 text-amber-200 text-xs flex items-center gap-3">
        <Clock className="w-4 h-4 flex-shrink-0 text-amber-400" />
        <span className="font-light">{t.trash.recoveryNotice}</span>
      </div>

      {/* Trash Table */}
      {trash.length > 0 ? (
        <div className="rounded-3xl glass-panel border border-[#f4a496]/15 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto modal-scrollbar">
            <table className="w-full text-left rtl:text-right text-xs sm:text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-neutral-400 text-[10px] font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-4 sm:px-6">{t.trash.itemCol}</th>
                  <th className="py-4 px-4">{t.trash.typeCol}</th>
                  <th className="py-4 px-4">{t.trash.deletedOnCol}</th>
                  <th className="py-4 px-4">{t.trash.daysLeftCol}</th>
                  <th className="py-4 px-4 sm:px-6 text-right rtl:text-left">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trash.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                    {/* Item */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3.5">
                        {item.coverImage ? (
                          <img
                            src={item.coverImage}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover border border-[#f4a496]/20 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl glass-panel-subtle border border-white/10 flex items-center justify-center text-neutral-400">
                            <FolderKanban className="w-4 h-4 text-[#f4a496]" />
                          </div>
                        )}
                        <span className="font-serif font-bold text-white sm:text-base">
                          {resolveLocalized(item.title, lang) || (lang === 'ar' ? resolveLocalized(item.titleAr, 'ar') : resolveLocalized(item.titleEn, 'en')) || 'Item'}
                        </span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-4 px-4 text-neutral-300">
                      <span className="px-2.5 py-1 rounded-full glass-panel-subtle text-[11px] font-mono border border-white/5 uppercase">
                        {item.itemType}
                      </span>
                    </td>

                    {/* Deleted on */}
                    <td className="py-4 px-4 text-neutral-400 text-xs font-mono">
                      {item.deletedOn}
                    </td>

                    {/* Days Left */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium px-3 py-1 rounded-full text-xs ${
                          item.daysRemaining <= 7
                            ? 'bg-[#842b45]/30 text-[#fcdcd4] border border-[#f4a496]/35'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.daysRemaining} days left</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 sm:px-6 text-right rtl:text-left">
                      <div className="flex items-center justify-end rtl:justify-start gap-2">
                        <button
                          onClick={() => restoreTrashItem(item.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t.trash.restoreBtn}</span>
                        </button>

                        <button
                          onClick={() => setItemToPurge(item)}
                          className="p-2 rounded-full text-neutral-400 hover:text-[#f4a496] hover:bg-[#842b45]/20 transition-colors cursor-pointer"
                          title={t.trash.deleteForeverBtn}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl glass-panel border border-white/5">
          <Trash2 className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
          <h3 className="text-base font-serif font-bold text-white">{t.trash.emptyTrashTitle}</h3>
          <p className="text-xs text-neutral-400 font-light mt-1">{t.trash.emptyTrashDesc}</p>
        </div>
      )}

      {/* Confirmation to Purge Single Item */}
      <ConfirmModal
        isOpen={!!itemToPurge}
        title={t.trash.deleteForeverBtn}
        message={t.trash.confirmPermanent}
        confirmLabel={lang === 'ar' ? 'حذف نهائي' : 'Purge Forever'}
        cancelLabel={t.common.cancel}
        onConfirm={handlePurgeConfirm}
        onCancel={() => setItemToPurge(null)}
      />

      {/* Confirmation to Empty Entire Trash */}
      <ConfirmModal
        isOpen={isEmptyConfirmOpen}
        title={t.trash.emptyTrashBtn}
        message={
          lang === 'ar'
            ? 'هل أنت متأكد من رغبتك في تفريغ سلة المحذوفات بالكامل؟ سيتم مسح كافة العناصر بشكل دائم.'
            : 'Are you sure you want to permanently delete all items in trash? This action cannot be reversed.'
        }
        confirmLabel={lang === 'ar' ? 'تفريغ السلة' : 'Empty Trash'}
        cancelLabel={t.common.cancel}
        onConfirm={handleEmptyConfirm}
        onCancel={() => setIsEmptyConfirmOpen(false)}
      />
    </div>
  );
}
