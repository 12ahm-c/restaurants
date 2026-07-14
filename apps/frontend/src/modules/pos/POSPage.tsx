import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../../stores/cartStore';
import { useTableStore } from '../../stores/tableStore';
import { orderService } from '../../services/order.service';
import { useUIStore } from '../../stores/uiStore';
import { useI18n } from '../../i18n/I18nContext';
import { ProductDTO, CategoryDTO, CartItem, TableDTO } from '../../types';
import { Search, Plus, Minus, Trash2, ShoppingBag, MessageSquare, X, ShoppingBasket, Sparkles, ArrowLeft } from 'lucide-react';
import { CustomerSearch } from '../../components/pos/CustomerSearch';

export function POSPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useUIStore();
  const { t } = useI18n();
  const {
    items,
    selectedTable,
    orderType,
    customerId,
    notes: orderNotes,
    addItem,
    removeItem,
    updateQuantity,
    updateItemNotes,
    setSelectedTable,
    setOrderType,
    setCustomerId,
    setNotes: setOrderNotes,
    clearCart,
    getTotal,
    getItemCount,
  } = useCartStore();
  const { tables, fetchTables } = useTableStore();

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

  useEffect(() => {
    const state = location.state as { selectedTable?: typeof selectedTable } | null;
    if (state?.selectedTable) {
      setSelectedTable(state.selectedTable);
    }
    fetchTables();
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
    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
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
    if (orderType === 'dine-in' && !selectedTable) {
      addToast('error', t('pos.selectTable'));
      return;
    }

    if (items.length === 0) {
      addToast('error', t('pos.cartEmpty'));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await orderService.createOrder({
        tableId: selectedTable?._id || '',
        type: orderType,
        customerId: customerId,
        items: items.map((item: CartItem) => ({
          productId: item.productId,
          quantity: item.quantity,
          variant: item.variant,
          options: item.options,
          notes: item.notes,
        })),
        notes: orderNotes,
      });

      const orderNumber = (result as any).order?.orderNumber || result.orderId || 'N/A';
      const total = getTotal();

      addToast('success', `${t('pos.orderCreated')} ${orderNumber} - ${total} MRU`);

      clearCart();
      setSelectedCustomer(null);
      setCustomerId(undefined);
      setShowCart(false);
      loadAvailability();
      navigate('/orders/active');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('common.error');
      addToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTableRequired = orderType === 'dine-in';

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
          {products.map((product) => {
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
                    <ShoppingBasket size={28} className="text-brand-300" />
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
                  {isOutOfStock && stock.missingItems.length > 0 && (
                    <p className="text-[10px] md:text-xs text-coral-400 mt-1 truncate">
                      Missing: {stock.missingItems.join(', ')}
                    </p>
                  )}
                  <p className="text-brand-400 font-bold mt-1 md:mt-2 text-sm md:text-base">{product.price} MRU</p>
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
            <div>
              <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">{t('pos.orderType')}</label>
              <select
                value={orderType}
                onChange={(e) => {
                  const newType = e.target.value as 'dine-in' | 'takeaway' | 'delivery';
                  setOrderType(newType);
                  if (newType !== 'dine-in') setSelectedTable(null);
                }}
                className="input-field text-sm"
              >
                <option value="dine-in">{t('pos.dineIn')}</option>
                <option value="takeaway">{t('pos.takeaway')}</option>
                <option value="delivery">{t('pos.delivery')}</option>
              </select>
            </div>

            {isTableRequired && (
              <div>
                <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                  {t('pos.selectTable')} <span className="text-coral-400">*</span>
                </label>
                <select
                  value={selectedTable?._id || ''}
                  onChange={(e) => {
                    const table = tables.find((t: TableDTO) => t._id === e.target.value);
                    setSelectedTable(table || null);
                  }}
                  className="input-field text-sm"
                >
                  <option value="">{t('pos.selectTable')}</option>
                  {tables.filter((t: TableDTO) => t.status === 'free').map((table: TableDTO) => (
                    <option key={table._id} value={table._id}>{table.name} (Cap: {table.capacity})</option>
                  ))}
                </select>
              </div>
            )}

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
              <p className="text-surface-400 font-medium">{t('pos.cartEmpty')}</p>
              <p className="text-sm text-surface-500 mt-1">{t('pos.cartEmptyHint')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item: CartItem) => (
                <div key={item.productId} className="bg-white/5 rounded-xl p-3 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                      <p className="text-xs text-surface-400">{item.price} MRU each</p>
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
            <span className="text-surface-300 font-medium">{t('pos.total')} ({getItemCount()} {t('pos.items')})</span>
            <span className="text-2xl font-bold text-white">{getTotal()} MRU</span>
          </div>

          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || items.length === 0 || (isTableRequired && !selectedTable)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={18} />
                {t('pos.createOrder')} - {getTotal()} MRU
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
