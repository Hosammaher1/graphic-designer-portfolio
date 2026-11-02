import React, { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  MoveUp,
  MoveDown,
  Milestone,
  Check,
  X,
  Eye,
  EyeOff,
  Sparkles,
  GraduationCap,
  Laptop,
  Briefcase,
  Award,
  Rocket,
  Star,
  Image as ImageIcon,
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';
import { Badge } from '../components/Badge.jsx';
import { ConfirmModal } from '../components/ConfirmModal.jsx';
import { MediaPickerModal } from '../components/MediaPickerModal.jsx';

const AVAILABLE_ICONS = [
  { name: 'Award', icon: Award, label: 'Award / Honor' },
  { name: 'GraduationCap', icon: GraduationCap, label: 'Education / Degree' },
  { name: 'Laptop', icon: Laptop, label: 'Projects / Tech' },
  { name: 'Briefcase', icon: Briefcase, label: 'Career / Agency' },
  { name: 'Rocket', icon: Rocket, label: 'Launch / Future' },
  { name: 'Sparkles', icon: Sparkles, label: 'Creative / Art' },
  { name: 'Star', icon: Star, label: 'Milestone / Lead' },
];

export function JourneyPage() {
  const {
    lang,
    t,
    milestones,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    reorderMilestones,
    togglePublishMilestone,
  } = useAdmin();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [milestoneToDelete, setMilestoneToDelete] = useState(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Form State
  const [year, setYear] = useState('');
  const [roleEn, setRoleEn] = useState('');
  const [roleAr, setRoleAr] = useState('');
  const [companyEn, setCompanyEn] = useState('');
  const [companyAr, setCompanyAr] = useState('');
  const [locationEn, setLocationEn] = useState('');
  const [locationAr, setLocationAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [iconName, setIconName] = useState('Award');
  const [imageUrl, setImageUrl] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [isPublished, setIsPublished] = useState(true);

  const openCreateModal = () => {
    setEditingMilestone(null);
    setYear(new Date().getFullYear().toString());
    setRoleEn('');
    setRoleAr('');
    setCompanyEn('');
    setCompanyAr('');
    setLocationEn('');
    setLocationAr('');
    setDescriptionEn('');
    setDescriptionAr('');
    setIconName('Award');
    setImageUrl('');
    setTagsStr('Brand Identity, Art Direction');
    setIsVisible(true);
    setIsPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingMilestone(item);
    setYear(item.year || '');
    setRoleEn(item.role_en || item.role?.en || '');
    setRoleAr(item.role_ar || item.role?.ar || '');
    setCompanyEn(item.company_en || item.company?.en || '');
    setCompanyAr(item.company_ar || item.company?.ar || '');
    setLocationEn(item.location_en || item.location?.en || '');
    setLocationAr(item.location_ar || item.location?.ar || '');
    setDescriptionEn(item.description_en || item.description?.en || '');
    setDescriptionAr(item.description_ar || item.description?.ar || '');
    setIconName(item.icon_name || item.iconName || 'Award');
    setImageUrl(item.image_url || item.imageUrl || '');
    setTagsStr(Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '');
    setIsVisible(item.is_visible ?? true);
    setIsPublished(item.is_published ?? true);
    setIsModalOpen(true);
  };

  const handleSaveMilestone = async (e) => {
    e.preventDefault();
    if (!year || !roleEn || !descriptionEn) return;

    const parsedTags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      year,
      role_en: roleEn,
      role_ar: roleAr || roleEn,
      company_en: companyEn,
      company_ar: companyAr || companyEn,
      location_en: locationEn,
      location_ar: locationAr || locationEn,
      description_en: descriptionEn,
      description_ar: descriptionAr || descriptionEn,
      icon_name: iconName,
      image_url: imageUrl || null,
      tags: parsedTags,
      is_visible: isVisible,
      is_published: isPublished,
    };

    if (editingMilestone) {
      await updateMilestone(editingMilestone.id, payload);
    } else {
      await addMilestone(payload);
    }
    setIsModalOpen(false);
  };

  const handleMove = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= milestones.length) return;

    const updated = [...milestones];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const orderedIds = updated.map((m) => m.id);
    reorderMilestones(orderedIds);
  };

  const renderIcon = (name) => {
    const found = AVAILABLE_ICONS.find((i) => i.name === name) || AVAILABLE_ICONS[0];
    const IconComponent = found.icon;
    return <IconComponent className="w-4 h-4 text-[#f4a496]" />;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#f4a496]/15">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#f4a496]/80 mb-1">
            {lang === 'ar' ? 'الخط الزمني والمسيرة' : 'Career Timeline & Milestones'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
            <span>{t.journey?.title || 'Creative Journey'} </span>
            <span className="text-[#f4a496] italic font-serif">Timeline</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-light">
            {t.journey?.subtitle || 'Curate your professional milestones, awards, and career evolution.'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-[#fcdcd4] bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] border border-[#f4a496]/40 transition-all shadow-lg shadow-black/50 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#f4a496]" />
          <span>{t.journey?.addNew || 'Add Milestone'}</span>
        </button>
      </div>

      {/* Milestones List */}
      <div className="rounded-2xl glass-panel border border-[#f4a496]/20 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead>
              <tr className="border-b border-[#f4a496]/15 bg-white/[0.02] text-neutral-400 font-mono uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 w-16 text-center">
                  {lang === 'ar' ? 'الترتيب' : 'Order'}
                </th>
                <th className="py-3.5 px-4 w-28">
                  {lang === 'ar' ? 'السنة' : 'Year'}
                </th>
                <th className="py-3.5 px-4">
                  {lang === 'ar' ? 'المحطة / الدور' : 'Role / Milestone'}
                </th>
                <th className="py-3.5 px-4">
                  {lang === 'ar' ? 'الجهة / الاستوديو' : 'Company'}
                </th>
                <th className="py-3.5 px-4 text-center">
                  {lang === 'ar' ? 'النشر' : 'Published'}
                </th>
                <th className="py-3.5 px-4 text-center">
                  {lang === 'ar' ? 'الظهور' : 'Visibility'}
                </th>
                <th className="py-3.5 px-4 text-right rtl:text-left">
                  {lang === 'ar' ? 'الإجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4a496]/10 font-sans">
              {milestones.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-neutral-400">
                    <Milestone className="w-10 h-10 text-[#f4a496]/30 mx-auto mb-2" />
                    <p className="text-sm font-medium text-white mb-1">
                      {t.journey?.emptyTitle || 'No milestones found'}
                    </p>
                    <p className="text-xs text-neutral-400 font-light">
                      {t.journey?.emptyDesc || 'Click "Add Milestone" above to create your first career timeline entry.'}
                    </p>
                  </td>
                </tr>
              ) : (
                milestones.map((item, index) => {
                  const roleName = lang === 'ar' ? (item.role_ar || item.role?.ar || item.role_en) : (item.role_en || item.role?.en);
                  const companyName = lang === 'ar' ? (item.company_ar || item.company?.ar || item.company_en) : (item.company_en || item.company?.en);
                  const desc = lang === 'ar' ? (item.description_ar || item.description?.ar) : (item.description_en || item.description?.en);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Move Order */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleMove(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMove(index, 'down')}
                            disabled={index === milestones.length - 1}
                            className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Year */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-[#842b45]/20 text-[#fcdcd4] border border-[#f4a496]/30">
                          {item.year}
                        </span>
                      </td>

                      {/* Role & Desc */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                            {renderIcon(item.icon_name || item.iconName)}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-[#fcdcd4] transition-colors text-sm">
                              {roleName}
                            </div>
                            <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5 font-light">
                              {desc}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company & Location */}
                      <td className="py-3.5 px-4 text-neutral-300">
                        <div>{companyName || '—'}</div>
                        {(item.location_en || item.location?.en) && (
                          <div className="text-[10px] text-neutral-500 font-mono">
                            {lang === 'ar' ? (item.location_ar || item.location?.ar || item.location_en) : (item.location_en || item.location?.en)}
                          </div>
                        )}
                      </td>

                      {/* Published Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => togglePublishMilestone(item.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                            item.is_published
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                          }`}
                        >
                          {item.is_published ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>{t.journey?.published || 'Published'}</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 text-amber-400" />
                              <span>{t.journey?.draft || 'Draft'}</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Visibility Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => updateMilestone(item.id, { is_visible: !item.is_visible })}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            item.is_visible
                              ? 'bg-white/5 border-white/10 text-neutral-300 hover:text-white'
                              : 'bg-[#842b45]/20 border-[#f4a496]/20 text-neutral-500'
                          }`}
                          title={item.is_visible ? 'Visible on Public Site' : 'Hidden from Public Site'}
                        >
                          {item.is_visible ? (
                            <Eye className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-neutral-500" />
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit Milestone"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setMilestoneToDelete(item)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-neutral-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Delete Milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Milestone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8 p-6 sm:p-8 rounded-3xl glass-panel-active border border-[#f4a496]/30 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <h3 className="text-xl font-serif font-bold text-white">
                  {editingMilestone
                    ? (t.journey?.editMilestone || 'Edit Milestone')
                    : (t.journey?.addNew || 'Add New Milestone')}
                </h3>
                <p className="text-xs text-neutral-400 font-light mt-0.5">
                  {lang === 'ar' ? 'حدد تفاصيل الحدث المهني باللغتين الإنجليزية والعربية' : 'Enter milestone details in English and Arabic'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Year */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                    {t.journey?.year || 'Year / Period'} *
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. 2025, 2026+"
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                    {t.journey?.icon || 'Icon Style'}
                  </label>
                  <select
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white bg-[#140b10] focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans cursor-pointer"
                  >
                    {AVAILABLE_ICONS.map((i) => (
                      <option key={i.name} value={i.name} className="bg-[#140b10] text-white">
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roles (Bilingual) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                    {t.journey?.roleEn || 'Milestone Title (English)'} *
                  </label>
                  <input
                    type="text"
                    value={roleEn}
                    onChange={(e) => setRoleEn(e.target.value)}
                    placeholder="e.g. Senior Art Director"
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                    {t.journey?.roleAr || 'Milestone Title (Arabic)'} *
                  </label>
                  <input
                    type="text"
                    value={roleAr}
                    onChange={(e) => setRoleAr(e.target.value)}
                    placeholder="مثال: مدير فني أول"
                    dir="rtl"
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Company / Studio (Bilingual) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                    {t.journey?.companyEn || 'Company / Studio (English)'}
                  </label>
                  <input
                    type="text"
                    value={companyEn}
                    onChange={(e) => setCompanyEn(e.target.value)}
                    placeholder="e.g. Atelier Paris"
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                    {t.journey?.companyAr || 'Company / Studio (Arabic)'}
                  </label>
                  <input
                    type="text"
                    value={companyAr}
                    onChange={(e) => setCompanyAr(e.target.value)}
                    placeholder="مثال: استوديو باريس"
                    dir="rtl"
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Descriptions (Bilingual) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                    {t.journey?.descriptionEn || 'Description (English)'} *
                  </label>
                  <textarea
                    rows={3}
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    placeholder="Summary of responsibilities and achievements..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                    {t.journey?.descriptionAr || 'Description (Arabic)'} *
                  </label>
                  <textarea
                    rows={3}
                    value={descriptionAr}
                    onChange={(e) => setDescriptionAr(e.target.value)}
                    placeholder="ملخص المسؤوليات وأبرز الإنجازات..."
                    dir="rtl"
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans resize-none"
                  />
                </div>
              </div>

              {/* Tags & Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                    {t.journey?.tags || 'Tags (comma separated)'}
                  </label>
                  <input
                    type="text"
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                    placeholder="Brand Identity, 3D, Packaging"
                    className="w-full px-3.5 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5 font-light">
                    {t.journey?.image || 'Artwork / Image URL'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-2xl glass-panel-subtle border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-[#f4a496]/60 transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="px-3 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                      title="Choose from Media Library"
                    >
                      <ImageIcon className="w-4 h-4 text-[#f4a496]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="rounded border-white/20 bg-white/10 text-[#842b45] focus:ring-[#f4a496] focus:ring-offset-0"
                  />
                  <span>{t.journey?.published || 'Published to Public Site'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="rounded border-white/20 bg-white/10 text-[#842b45] focus:ring-[#f4a496] focus:ring-offset-0"
                  />
                  <span>{t.journey?.visible || 'Visible in Timeline'}</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full glass-panel hover:bg-white/10 text-neutral-300 text-xs font-medium cursor-pointer"
                >
                  {t.common?.cancel || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#842b45] to-[#591b2e] hover:from-[#9c3252] text-[#fcdcd4] text-xs font-semibold border border-[#f4a496]/40 shadow-lg shadow-black/50 cursor-pointer active:scale-95"
                >
                  {t.common?.save || 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(mediaItem) => {
          setImageUrl(mediaItem.url);
          setIsMediaPickerOpen(false);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(milestoneToDelete)}
        title={t.journey?.deleteMilestone || 'Delete Milestone'}
        message={t.journey?.confirmDelete || 'Are you sure you want to delete this milestone? This action cannot be undone.'}
        confirmText={t.common?.delete || 'Delete'}
        cancelText={t.common?.cancel || 'Cancel'}
        onConfirm={async () => {
          if (milestoneToDelete) {
            await deleteMilestone(milestoneToDelete.id);
            setMilestoneToDelete(null);
          }
        }}
        onCancel={() => setMilestoneToDelete(null)}
        variant="danger"
      />
    </div>
  );
}
