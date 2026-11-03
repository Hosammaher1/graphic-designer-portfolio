import React, { useState } from 'react';
import { Plus, Edit, Trash2, MoveUp, MoveDown, Tags, Check, X, FolderKanban } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { Badge } from '../components/Badge.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';

export function CategoriesPage() {
  const { lang, t, categories, addCategory, updateCategory, deleteCategory } = useAdmin();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Form State
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('active');

  const openCreateModal = () => {
    setEditingCategory(null);
    setNameEn('');
    setNameAr('');
    setSlug('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setNameEn(cat.nameEn || '');
    setNameAr(cat.nameAr || '');
    setSlug(cat.slug || '');
    setStatus(cat.status || 'active');
    setIsModalOpen(true);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!nameEn) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        nameEn,
        nameAr,
        slug: slug || nameEn.toLowerCase().replace(/\s+/g, '-'),
        status,
      });
    } else {
      addCategory({
        nameEn,
        nameAr,
        slug: slug || nameEn.toLowerCase().replace(/\s+/g, '-'),
        status,
      });
    }
    setIsModalOpen(false);
  };

  const handleMove = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const updated = [...categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    // update order
    updated.forEach((c, idx) => {
      c.order = idx + 1;
    });
    // save to state
    updateCategory(moved.id, { order: targetIndex + 1 });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f4a496]/15">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-1">
            {lang === 'ar' ? 'التصنيفات والتنظيم' : 'Taxonomy & Disciplines'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
            <span>{t.categories.title} </span>
            <span className="text-[#f4a496] italic font-serif">Disciplines</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-light">
            {t.categories.subtitle}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#fcdcd4] bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] border border-[#f4a496]/40 transition-all shadow-lg shadow-black/50 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#f4a496]" />
          <span>{t.categories.addNew}</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="rounded-3xl glass-panel border border-[#f4a496]/15 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto modal-scrollbar">
          <table className="w-full text-left rtl:text-right text-xs sm:text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02] text-neutral-400 text-[10px] font-mono uppercase tracking-wider">
              <tr>
                <th className="py-4 px-4 sm:px-6">{t.categories.order}</th>
                <th className="py-4 px-4">{t.categories.nameEn}</th>
                <th className="py-4 px-4">{t.categories.nameAr}</th>
                <th className="py-4 px-4">{t.categories.slug}</th>
                <th className="py-4 px-4">{t.categories.projectCount}</th>
                <th className="py-4 px-4">{t.categories.status}</th>
                <th className="py-4 px-4 sm:px-6 text-right rtl:text-left">{t.categories.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-xs text-neutral-400 font-light">
                    {lang === 'ar' ? 'لا توجد تصنيفات مضافة بعد.' : 'No categories created yet.'}
                  </td>
                </tr>
              ) : (
                categories.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="py-4 px-4 sm:px-6 text-neutral-400 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-center">{idx + 1}</span>
                      <div className="flex flex-col gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, 'up')}
                          className="hover:text-[#f4a496] disabled:opacity-20 cursor-pointer"
                        >
                          <MoveUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={idx === categories.length - 1}
                          onClick={() => handleMove(idx, 'down')}
                          className="hover:text-[#f4a496] disabled:opacity-20 cursor-pointer"
                        >
                          <MoveDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4 font-serif font-bold text-white sm:text-base">
                    {cat.nameEn}
                  </td>

                  <td className="py-4 px-4 text-neutral-300 font-arabic">
                    {cat.nameAr}
                  </td>

                  <td className="py-4 px-4 text-neutral-400 font-mono text-xs">
                    /{cat.slug}
                  </td>

                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full glass-panel-subtle text-neutral-300 text-xs border border-white/5 font-mono">
                      {cat.count || 0}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <Badge variant={cat.status === 'active' ? 'published' : 'draft'}>
                      {cat.status === 'active' ? t.categories.active : t.categories.inactive}
                    </Badge>
                  </td>

                  <td className="py-4 px-4 sm:px-6 text-right rtl:text-left">
                    <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 rounded-xl text-neutral-300 hover:text-white glass-panel-subtle hover:border-[#f4a496]/40 transition-colors cursor-pointer"
                        title={t.categories.edit}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCategoryToDelete(cat)}
                        className="p-2 rounded-xl text-neutral-400 hover:text-[#f4a496] hover:bg-[#842b45]/20 transition-colors cursor-pointer"
                        title={t.categories.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl glass-panel-active border border-[#f4a496]/25 shadow-2xl shadow-black/95 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h3 className="text-lg font-serif font-bold text-white">
                {editingCategory ? t.categories.editModalTitle : t.categories.createModalTitle}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                  {t.categories.nameEn} *
                </label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-sm focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
                  placeholder="e.g. Packaging Design"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                  {t.categories.nameAr}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white text-sm font-arabic focus:outline-none focus:border-[#f4a496]/60 transition-all"
                  placeholder="مثال: تصميم العبوات والتغليف"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                  {t.categories.slug}
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl glass-panel-subtle border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#f4a496]/50"
                  placeholder="packaging-design"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                  {t.categories.status}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'glass-panel-subtle text-neutral-400 border-white/10'
                    }`}
                  >
                    {t.categories.active}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('inactive')}
                    className={`py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      status === 'inactive'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'glass-panel-subtle text-neutral-400 border-white/10'
                    }`}
                  >
                    {t.categories.inactive}
                  </button>
                </div>
              </div>

              <div className="pt-5 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-neutral-400 hover:text-white glass-panel hover:bg-white/10"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-semibold text-[#fcdcd4] bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] border border-[#f4a496]/40 shadow-lg shadow-black/50 cursor-pointer"
                >
                  {t.categories.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        title={t.categories.delete}
        message={
          lang === 'ar'
            ? `هل أنت متأكد من حذف التصنيف "${categoryToDelete?.nameAr || categoryToDelete?.nameEn}"؟`
            : `Are you sure you want to delete category "${categoryToDelete?.nameEn}"?`
        }
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
        onConfirm={() => {
          if (categoryToDelete) {
            deleteCategory(categoryToDelete.id);
            setCategoryToDelete(null);
          }
        }}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
