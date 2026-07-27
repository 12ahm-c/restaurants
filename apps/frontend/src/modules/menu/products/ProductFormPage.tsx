import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMenuStore } from '../../../stores/menuStore';
import { useUIStore } from '../../../stores/uiStore';
import { useI18n } from '../../../i18n/I18nContext';
import { ArrowLeft, Plus, X, Camera, Upload, Link as LinkIcon, Trash2 } from 'lucide-react';

interface FormData {
  name: string;
  imageUrl: string;
  categoryId: string;
  price: string;
}

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories, fetchCategories, createProduct, updateProduct, createCategory } = useMenuStore();
  const { addToast } = useUIStore();
  const { t } = useI18n();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    imageUrl: '',
    categoryId: '',
    price: '',
  });

  useEffect(() => {
    fetchCategories();
    if (id) {
      loadProduct();
    }
  }, [id, fetchCategories]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'حجم الصورة يتجاوز 5 ميغابايت');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
        addToast('success', 'تم تحميل الصورة بنجاح');
      }
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera access error:', err);
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        addToast('error', 'تعذر الوصول إلى الكاميرا');
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
      addToast('success', 'تم التقاط الصورة بنجاح');
    }
    stopCamera();
  };

  const loadProduct = async () => {
    if (!id) return;
    try {
      const { menuService } = await import('../../../services/menu.service');
      const data = await menuService.getProductById(id);
      setFormData({
        name: data.product.name,
        imageUrl: data.product.imageUrl || '',
        categoryId: (data.product.categoryId as unknown as { _id: string })?._id || '',
        price: data.product.price ? data.product.price.toString() : '',
      });
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);
    try {
      const cat = await createCategory({ name: newCategoryName.trim() });
      setFormData((prev) => ({ ...prev, categoryId: cat._id }));
      setShowCategoryModal(false);
      setNewCategoryName('');
      addToast('success', t('common.success'));
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId) {
      addToast('error', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsLoading(true);

    try {
      const numericPrice = parseFloat(formData.price) || 0;
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        categoryId: formData.categoryId,
        price: numericPrice,
      };
      if (formData.imageUrl) payload.imageUrl = formData.imageUrl;

      if (id) {
        await updateProduct(id, payload);
        addToast('success', t('common.success'));
      } else {
        await createProduct(payload as unknown as Record<string, unknown>);
        addToast('success', t('common.success'));
      }
      navigate('/menu/products');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="flex items-center mb-6">
        <Link to="/menu/products" className="text-surface-400 hover:text-surface-300 dark:hover:text-surface-200 mr-4">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold dark:text-white text-surface-900">
          {id ? t('form.editProduct') : t('form.createProduct')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="card rounded-2xl shadow-card p-6 max-w-2xl border dark:border-white/5 border-black/5">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium dark:text-surface-300 text-surface-700 mb-1">{t('common.name')} *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder={t('form.productName')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium dark:text-surface-300 text-surface-700 mb-1">{t('form.category')} *</label>
              <div className="flex space-x-2">
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="input-field flex-1"
                >
                  <option value="">{t('form.selectCategory')}</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="px-3 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 flex items-center shrink-0"
                  title="Add new category"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-surface-300 text-surface-700 mb-1">{t('form.price')} *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="input-field"
                placeholder="0"
              />
            </div>
          </div>

          {/* Image Upload / Camera / URL Section */}
          <div>
            <label className="block text-sm font-medium dark:text-surface-300 text-surface-700 mb-2">
              صورة المنتج
            </label>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />

            {formData.imageUrl ? (
              <div className="relative group w-44 h-44 rounded-2xl overflow-hidden border-2 dark:border-white/10 border-black/10 shadow-md">
                <img
                  src={formData.imageUrl}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-sm transition-colors"
                    title="تغيير الصورة"
                  >
                    <Upload size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-sm transition-colors"
                    title="الكاميرا"
                  >
                    <Camera size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                    className="p-2 bg-coral-500/80 hover:bg-coral-500 text-white rounded-xl backdrop-blur-sm transition-colors"
                    title="حذف الصورة"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-surface-300 dark:border-white/15 hover:border-brand-500 dark:hover:border-brand-500 bg-surface-50 dark:bg-surface-800/50 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-all text-center group"
                  >
                    <div className="p-3 rounded-full bg-brand-500/10 text-brand-500 group-hover:scale-110 transition-transform mb-2">
                      <Upload size={22} />
                    </div>
                    <span className="text-sm font-semibold text-surface-900 dark:text-white">رفع من الجهاز</span>
                    <span className="text-[11px] text-surface-400 mt-0.5">JPG, PNG, WebP</span>
                  </button>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-surface-300 dark:border-white/15 hover:border-brand-500 dark:hover:border-brand-500 bg-surface-50 dark:bg-surface-800/50 hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-all text-center group"
                  >
                    <div className="p-3 rounded-full bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform mb-2">
                      <Camera size={22} />
                    </div>
                    <span className="text-sm font-semibold text-surface-900 dark:text-white">التقاط بالكاميرا</span>
                    <span className="text-[11px] text-surface-400 mt-0.5">كاميرا الجهاز</span>
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-xs font-semibold text-brand-500 hover:underline flex items-center gap-1"
                  >
                    <LinkIcon size={12} />
                    {showUrlInput ? 'إخفاء خيار رابط الصورة' : 'أو أدخل رابط صورة مباشرة'}
                  </button>
                  {showUrlInput && (
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      className="input-field mt-2"
                      placeholder="https://example.com/image.jpg"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Link
            to="/menu/products"
            className="btn-secondary"
          >
            {t('common.cancel')}
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? t('common.saving') : id ? t('form.editProduct') : t('form.createProduct')}
          </button>
        </div>
      </form>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 max-w-md w-full border border-black/10 dark:border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-black/5 dark:border-white/10">
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">{t('form.createCategory')}</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">{t('common.name')} *</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                  autoFocus
                  className="input-field"
                  placeholder={t('form.categoryName')}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                  className="btn-primary"
                >
                  {isCreatingCategory ? t('common.loading') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface-900 rounded-3xl p-5 max-w-lg w-full border border-white/10 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Camera size={20} className="text-brand-500" />
                <h3 className="text-lg font-bold text-white">التقاط صورة المنتج</h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="p-1 rounded-xl text-surface-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-white/10">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={stopCamera}
                className="btn-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="btn-primary flex items-center gap-2"
              >
                <Camera size={18} />
                التقاط صورة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
