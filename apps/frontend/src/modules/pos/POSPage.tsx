import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../../stores/cartStore';
import { useTentStore } from '../../stores/tentStore';
import { orderService } from '../../services/order.service';
import { useUIStore } from '../../stores/uiStore';
import { useI18n } from '../../i18n/I18nContext';
import { ProductDTO, CategoryDTO, CartItem, TentDTO, QuantityType } from '../../types';
import { Search, Plus, Minus, Trash2, ShoppingBag, MessageSquare, X, Sparkles, ArrowLeft, Scale, Clock } from 'lucide-react';
import { CustomerSearch } from '../../components/pos/CustomerSearch';

const RENTAL_DURATIONS = [
  { value: '1h', label: 'ساعة', labelFr: '1 heure', labelEn: '1 hour' },
  { value: '2h', label: 'ساعتين', labelFr: '2 heures', labelEn: '2 hours' },
  { value: '3h', label: '3 ساعات', labelFr: '3 heures', labelEn: '3 hours' },
  { value: '4h', label: '4 ساعات', labelFr: '4 heures', labelEn: '4 hours' },
  { value: '5h', label: '5 ساعات', labelFr: '5 heures', labelEn: '5 hours' },
  { value: '6h', label: '6 ساعات', labelFr: '6 heures', labelEn: '6 hours' },
  { value: '8h', label: '8 ساعات', labelFr: '8 heures', labelEn: '8 hours' },
  { value: '12h', label: '12 ساعة', labelFr: '12 heures', labelEn: '12 hours' },
];

export function POSPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useUIStore();
  const { t } = useI18n();
  const {
    items,
    selectedTent,
    orderType,
    customerId,
    notes: orderNotes,
    addItem,
    removeItem,
    updateQuantity,
    updateItemNotes,
    setSelectedTent,
    setCustomerId,
    setNotes: setOrderNotes,
    clearCart,
    getTotal,
    getItemCount,
  } = useCartStore();
  const { tents, fetchTents } = useTentStore();

  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [editingItemNotes, setEditingItemNotes] = useState<string | null>(null);
  const [itemNoteText, setItemNoteText] = useState('');
  const [showOrderNotes, setShowOrderNotes] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [availability, setAvailability] = useState<Record<string, { inStock: boolean; missingItems: string[] }>>({});
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);
  const [selectedQuantityType, setSelectedQuantityType] = useState<QuantityType | null>(null);
  const [quantityTypeQuantity, setQuantityTypeQuantity] = useState(1);
  const [showQuantityModal, setShowQuantityModal] = useState(false);

  // Rental mode state
  const [rentalMode, setRentalMode] = useState<'none' | 'rent-only' | 'sit-in' | 'takeaway'>('none');
  const [rentalDuration, setRentalDuration] = useState('1h');
  const [rentalPrice, setRentalPrice] = useState(0);

  useEffect(() => {
    const state = location.state as { selectedTent?: typeof selectedTent } | null;
    if (state?.selectedTent) {
      setSelectedTent(state.selectedTent);
      setRentalMode('sit-in');
    }
    fetchTents();
    loadProducts();
    loadCategories();
    loadAvailability();
  }, []);

  const loadProducts = async (categoryId?: string, search?: string) => {
    try {
      const { products: data } = await orderService.getProducts({ categoryId, search });
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await orderService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      const data = await orderService.getProductsAvailability();
      setAvailability(data);
    } catch (error) {
      console.error('Failed to load availability:', error);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    loadProducts(categoryId || undefined, searchQuery || undefined);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadProducts(selectedCategory || undefined, query || undefined);
  };

  const handleAddToCart = (product: ProductDTO) => {
    if (product.hasQuantityTypes && product.quantityTypes.length > 0) {
      setSelectedProduct(product);
      setSelectedQuantityType(product.quantityTypes[0]);
      setQuantityTypeQuantity(1);
      setShowQuantityModal(true);
      return;
    }
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
    setShowCart(true);
  };

  const handleAddWithQuantityType = () => {
    if (!selectedProduct || !selectedQuantityType) return;
    addItem({
      productId: selectedProduct._id,
      name: `${selectedProduct.name} - ${selectedQuantityType.label}`,
      price: selectedQuantityType.price,
      quantity: quantityTypeQuantity,
      quantityTypeName: selectedQuantityType.name,
      quantityTypeLabel: selectedQuantityType.label,
    });
    setShowQuantityModal(false);
    setSelectedProduct(null);
    setSelectedQuantityType(null);
    setQuantityTypeQuantity(1);
    setShowCart(true);
  };

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerId(customer._id);
  };

  const handleCustomerRemove = () => {
    setSelectedCustomer(null);
    setCustomerId(undefined);
  };

  const handleOpenItemNotes = (productId: string, currentNotes?: string) => {
    setEditingItemNotes(productId);
    setItemNoteText(currentNotes || '');
  };

  const handleSaveItemNotes = () => {
    if (editingItemNotes) {
      updateItemNotes(editingItemNotes, itemNoteText);
      setEditingItemNotes(null);
      setItemNoteText('');
    }
  };

  const handleSubmitOrder = async () => {
    if (rentalMode === 'rent-only') {
      if (!selectedTent) {
        addToast('error', t('pos.selectTent'));
        return;
      }
      // For rent-only, we create an order with no items but with rental fields
    } else if (rentalMode === 'sit-in') {
      if (!selectedTent) {
        addToast('error', t('pos.selectTent'));
        return;
      }
      if (items.length === 0) {
        addToast('error', t('pos.cartEmpty'));
        return;
      }
    } else if (rentalMode === 'takeaway') {
      if (items.length === 0) {
        addToast('error', t('pos.cartEmpty'));
        return;
      }
    } else {
      // Default: old behavior
      if (orderType === 'dine-in' && !selectedTent) {
        addToast('error', t('pos.selectTent'));
        return;
      }
      if (items.length === 0) {
        addToast('error', t('pos.cartEmpty'));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let orderTypeToSend: string;
      let itemsToSend = items.map((item: CartItem) => ({
        productId: item.productId,
        quantity: item.quantity,
        variant: item.variant,
        options: item.options,
        quantityTypeName: item.quantityTypeName,
        quantityTypeLabel: item.quantityTypeLabel,
        notes: item.notes,
      }));

      if (rentalMode === 'rent-only') {
        orderTypeToSend = 'rental';
        itemsToSend = [];
      } else if (rentalMode === 'sit-in') {
        orderTypeToSend = 'dine-in';
      } else if (rentalMode === 'takeaway') {
        orderTypeToSend = 'takeaway';
      } else {
        orderTypeToSend = orderType;
      }

      const result = await orderService.createOrder({
        tentId: selectedTent?._id || '',
        type: orderTypeToSend as any,
        customerId: customerId,
        items: itemsToSend,
        notes: orderNotes,
        rentalDuration: rentalMode === 'rent-only' ? rentalDuration : undefined,
        rentalPrice: rentalMode === 'rent-only' ? rentalPrice : undefined,
      });

      const orderNumber = (result as any).order?.orderNumber || result.orderId || 'N/A';
      const total = getTotal() + (rentalMode === 'rent-only' ? rentalPrice : 0);

      addToast('success', `${t('pos.orderCreated')} ${orderNumber} - ${total} MRU`);

      clearCart();
      setSelectedCustomer(null);
      setCustomerId(undefined);
      setShowCart(false);
      setRentalMode('none');
      setRentalDuration('1h');
      setRentalPrice(0);
      loadAvailability();
      navigate('/orders/active');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      addToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products: only show active ones in POS
  const activeProducts = products.filter((p) => p.isActive);

  return (
    <div className="flex h-[calc(100dvh-8rem)] md:h-[calc(100vh-8rem)] bg-surface-950 rounded-2xl overflow-hidden shadow-card">
      {/* Products Panel */}
      <div className={`flex-1 overflow-auto p-3 md:p-5 ${showCart ? 'hidden md:block' : 'block'}`}>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-400" size={20} />
          <input
            type="text"
            placeholder={t('pos.searchProducts')}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field w-full pl-12 pr-4 py-3 rounded-xl"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all
              ${selectedCategory === ''
                ? 'bg-brand-500 text-white shadow-md'
                : 'bg-surface-900 text-surface-300 hover:bg-white/5 border border-white/5'
              }`}
          >
            {t('pos.all')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategoryChange(cat._id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all
                ${selectedCategory === cat._id
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'bg-surface-900 text-surface-300 hover:bg-white/5 border border-white/5'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {activeProducts.map((product) => {
            const stock = availability[product._id];
            const isOutOfStock = stock && !stock.inStock;
            const isAvailable = product.status === 'available' && !isOutOfStock;

            return (
              <button
                key={product._id}
                onClick={() => handleAddToCart(product)}
                disabled={!isAvailable}
                className={`card text-left overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
              >
                <div className="h-20 md:h-24 bg-gradient-to-br from-brand-500/10 to-orange-500/10 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl">{product.emoji || '🍽️'}</span>
                  )}
                </div>
                
                <div className="p-2 md:p-3">
                  {isOutOfStock && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-coral-400/10 text-coral-400 text-[10px] md:text-xs font-semibold rounded-lg mb-1">
                      {t('pos.outOfStock')}
                    </span>
                  )}
                  {stock?.inStock && stock.missingItems.length === 0 && product.status === 'available' && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-brand-400/10 text-brand-400 text-[10px] md:text-xs font-semibold rounded-lg mb-1">
                      {t('pos.inStock')}
                    </span>
                  )}
                  <p className="font-semibold text-white text-xs md:text-sm truncate">{product.name}</p>
                  <p className="text-[10px] md:text-xs text-surface-400 truncate mt-0.5">{product.description}</p>
                  {product.hasQuantityTypes && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400/10 text-amber-400 text-[10px] md:text-xs font-semibold rounded-lg mt-1">
                      <Scale size={10} />
                      {t('pos.availableByWeight')}
                    </span>
                  )}
                  <p className="text-brand-400 font-bold mt-1 md:mt-2 text-sm md:text-base">
                    {product.hasQuantityTypes ? `${product.quantityTypes[0]?.price} MRU` : `${product.price} MRU`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart Sidebar - Desktop */}
      <div className={`w-full md:w-96 bg-surface-900 border-l border-white/5 flex flex-col ${showCart ? 'block' : 'hidden md:flex'}`}>
        {/* Order Header */}
        <div className="p-4 md:p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowCart(false)} className="md:hidden p-1 rounded-lg hover:bg-white/5">
              <ArrowLeft size={20} className="text-surface-300" />
            </button>
            <h2 className="font-display font-bold text-lg text-white">{t('pos.newOrder')}</h2>
            <div className="w-8" />
          </div>

          <div className="mt-4 space-y-3">
            {/* Rental Mode Selection */}
            <div>
              <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('pos.rentalMode')}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setRentalMode('sit-in'); setSelectedTent(null); }}
                  className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                    rentalMode === 'sit-in'
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface-800 text-surface-300 hover:bg-surface-700 border border-white/5'
                  }`}
                >
                  {t('pos.sitInTent')}
                </button>
                <button
                  onClick={() => { setRentalMode('rent-only'); setSelectedTent(null); }}
                  className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                    rentalMode === 'rent-only'
                      ? 'bg-amber-500 text-white'
                      : 'bg-surface-800 text-surface-300 hover:bg-surface-700 border border-white/5'
                  }`}
                >
                  {t('pos.rentOnly')}
                </button>
                <button
                  onClick={() => { setRentalMode('takeaway'); setSelectedTent(null); }}
                  className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                    rentalMode === 'takeaway'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-surface-800 text-surface-300 hover:bg-surface-700 border border-white/5'
                  }`}
                >
                  {t('pos.takeawayOnly')}
                </button>
              </div>
            </div>

            {/* Tent Selection for sit-in and rent-only */}
            {(rentalMode === 'sit-in' || rentalMode === 'rent-only') && (
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                  {t('pos.selectTent')} <span className="text-coral-400">*</span>
                </label>
                <select
                  value={selectedTent?._id || ''}
                  onChange={(e) => {
                    const tent = tents.find((t: TentDTO) => t._id === e.target.value);
                    setSelectedTent(tent || null);
                  }}
                  className="input-field text-sm"
                >
                  <option value="">{t('pos.selectTent')}</option>
                  {tents.filter((t: TentDTO) => t.status === 'free').map((tent: TentDTO) => {
                    const sizeLabel = tent.size === 'small' ? 'صغيرة' : tent.size === 'large' ? 'كبيرة' : 'متوسطة';
                    return (
                      <option key={tent._id} value={tent._id}>خيمة #{tent.tentNumber} - {sizeLabel}</option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Rental Duration & Price (for rent-only mode) */}
            {rentalMode === 'rent-only' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                    <Clock size={12} className="inline mr-1" />
                    {t('pos.rentalDuration')}
                  </label>
                  <select
                    value={rentalDuration}
                    onChange={(e) => setRentalDuration(e.target.value)}
                    className="input-field text-sm"
                  >
                    {RENTAL_DURATIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                    {t('pos.rentalPrice')} (MRU)
                  </label>
                  <input
                    type="number"
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(parseFloat(e.target.value) || 0)}
                    min="0"
                    className="input-field text-sm"
                  />
                </div>
              </div>
            )}

            {/* Customer */}
            <div>
              <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('pos.customer')}</label>
              <CustomerSearch onSelect={handleCustomerSelect} selectedCustomer={selectedCustomer} onRemove={handleCustomerRemove} />
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={28} className="text-surface-500" />
              </div>
              <p className="text-surface-400 font-medium">
                {rentalMode === 'rent-only' ? t('pos.rentOnlyNoItems') : t('pos.cartEmpty')}
              </p>
              {rentalMode !== 'rent-only' && (
                <p className="text-sm text-surface-500 mt-1">{t('pos.cartEmptyHint')}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item: CartItem) => (
                <div key={`${item.productId}-${item.quantityTypeName || ''}`} className="bg-white/5 rounded-xl p-3 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                      <p className="text-xs text-surface-400">{item.price} MRU each</p>
                      {item.quantityTypeLabel && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400/10 text-amber-400 text-[10px] font-semibold rounded-lg mt-1">
                          <Scale size={10} />
                          {item.quantityTypeLabel}
                        </span>
                      )}
                      {item.notes && (
                        <p className="text-xs text-brand-400 mt-1 flex items-center gap-1">
                          <MessageSquare size={10} />
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => handleOpenItemNotes(item.productId, item.notes)} className="p-1.5 rounded-lg text-surface-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                        <MessageSquare size={14} />
                      </button>
                      <button onClick={() => removeItem(item.productId)} className="p-1.5 rounded-lg text-surface-400 hover:text-coral-400 hover:bg-coral-400/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 bg-surface-900 rounded-lg border border-white/5">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1.5 rounded-l-lg hover:bg-white/5 transition-colors">
                        <Minus size={14} className="text-surface-300" />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1.5 rounded-r-lg hover:bg-white/5 transition-colors">
                        <Plus size={14} className="text-surface-300" />
                      </button>
                    </div>
                    <p className="font-bold text-white">{item.price * item.quantity} MRU</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="p-4 md:p-5 border-t border-white/5 bg-surface-900">
          {selectedCustomer && (
            <div className="mb-3 p-3 bg-brand-500/10 rounded-xl">
              <div className="flex justify-between text-sm">
                <span className="text-brand-400">{t('pos.customer')}:</span>
                <span className="font-semibold text-brand-500">{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-400">Points:</span>
                <span className="font-semibold text-brand-500">{selectedCustomer.loyaltyPoints} pts</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brand-400">To Earn:</span>
                <span className="font-semibold text-brand-400">+{Math.floor(getTotal() / 100)} pts</span>
              </div>
            </div>
          )}

          <div className="mb-3">
            <button onClick={() => setShowOrderNotes(!showOrderNotes)} className="text-sm text-surface-400 hover:text-brand-400 flex items-center gap-1.5 transition-colors">
              <MessageSquare size={14} />
              {orderNotes ? t('pos.editOrderNotes') : t('pos.addOrderNotes')}
            </button>
            {showOrderNotes && (
              <div className="mt-2">
                <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder={t('pos.specialInstructions')} className="input-field text-sm resize-none" rows={2} />
              </div>
            )}
            {orderNotes && !showOrderNotes && <p className="text-xs text-surface-400 mt-1.5 truncate">{orderNotes}</p>}
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-surface-300 font-medium">
              {t('pos.total')} ({getItemCount()} {t('pos.items')})
              {rentalMode === 'rent-only' && ` + ${t('pos.rental')}`}
            </span>
            <span className="text-2xl font-bold text-white">
              {getTotal() + (rentalMode === 'rent-only' ? rentalPrice : 0)} MRU
            </span>
          </div>

          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || (
              rentalMode === 'rent-only' ? !selectedTent :
              rentalMode === 'sit-in' ? (!selectedTent || items.length === 0) :
              rentalMode === 'takeaway' ? items.length === 0 :
              (items.length === 0)
            )}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={18} />
                {rentalMode === 'rent-only'
                  ? `${t('pos.createRental')} - ${rentalPrice} MRU`
                  : `${t('pos.createOrder')} - ${getTotal()} MRU`
                }
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Cart Toggle Button */}
      {items.length > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="md:hidden fixed bottom-24 right-4 z-30 bg-brand-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
        >
          <div className="relative">
            <ShoppingBag size={24} />
            <span className="absolute -top-2 -right-2 bg-coral-400 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {getItemCount()}
            </span>
          </div>
        </button>
      )}

      {/* Quantity Type Modal */}
      {showQuantityModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md card p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-display font-bold text-white">{selectedProduct.name}</h3>
              <button onClick={() => setShowQuantityModal(false)} className="p-2 rounded-lg hover:bg-white/5 text-surface-400 hover:text-surface-300 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Quantity Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">نوع الكمية</label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProduct.quantityTypes.map((qt) => (
                    <button
                      key={qt.name}
                      onClick={() => setSelectedQuantityType(qt)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        selectedQuantityType?.name === qt.name
                          ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                          : 'border-white/10 bg-white/5 text-surface-300 hover:border-white/20'
                      }`}
                    >
                      <p className="font-semibold text-sm">{qt.label}</p>
                      <p className="text-xs text-surface-400 mt-1">{qt.price} MRU / {qt.unit}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">الكمية</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantityTypeQuantity(Math.max(1, quantityTypeQuantity - 1))}
                    className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type="number"
                    value={quantityTypeQuantity}
                    onChange={(e) => setQuantityTypeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    className="w-20 text-center input-field text-lg font-bold"
                  />
                  <button
                    onClick={() => setQuantityTypeQuantity(quantityTypeQuantity + 1)}
                    className="p-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              {/* Total Price */}
              {selectedQuantityType && (
                <div className="p-4 bg-brand-500/10 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-brand-400 font-medium">السعر الإجمالي:</span>
                    <span className="text-2xl font-bold text-brand-400">
                      {selectedQuantityType.price * quantityTypeQuantity} MRU
                    </span>
                  </div>
                </div>
              )}

              {/* Add Button */}
              <button
                onClick={handleAddWithQuantityType}
                disabled={!selectedQuantityType}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                إضافة إلى الطلب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Notes Modal */}
      {editingItemNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md card p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-display font-bold text-white">{t('pos.itemNotes')}</h3>
              <button onClick={() => setEditingItemNotes(null)} className="p-2 rounded-lg hover:bg-white/5 text-surface-400 hover:text-surface-300 transition-colors">
                <X size={18} />
              </button>
            </div>
            <textarea value={itemNoteText} onChange={(e) => setItemNoteText(e.target.value)} placeholder={t('pos.specialInstructions')} className="input-field resize-none" rows={3} autoFocus />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setEditingItemNotes(null)} className="btn-secondary">{t('common.cancel')}</button>
              <button onClick={handleSaveItemNotes} className="btn-primary">{t('pos.saveNote')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
