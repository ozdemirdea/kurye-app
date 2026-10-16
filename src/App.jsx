import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Minus, Trash2, RotateCcw, Share2, Check, 
  CreditCard, Banknote, Smartphone, MapPin, 
  DollarSign, ShoppingBag, ArrowRightLeft, ShieldAlert,
  Settings, Edit2, X, RefreshCw, Sparkles, Percent
} from 'lucide-react';

// Varsayılan Menü Listesi (Fabrika Ayarları)
const DEFAULT_MENU_ITEMS = [
  { id: 'd_med', name: 'Medium Dürüm', price: 220, category: 'durum' },
  { id: 'd_lrg', name: 'Large Dürüm', price: 260, category: 'durum' },
  { id: 'd_xl', name: 'XLarge Dürüm', price: 310, category: 'durum' },
  { id: 'd_xxl', name: 'XXLarge Dürüm', price: 400, category: 'durum' },
  { id: 'd_soba', name: 'Soba Borritto', price: 450, category: 'durum' },
  { id: 'dr_soda', name: 'Meyveli Soda', price: 25, category: 'drink' },
  { id: 'dr_su', name: 'Su', price: 15, category: 'drink' },
  { id: 'dr_ayran', name: 'Ayran', price: 30, category: 'drink' },
  { id: 'dr_kutu', name: 'Kutu İçecek', price: 50, category: 'drink' },
  { id: 'dr_1lt', name: '1 Litre İçecek', price: 65, category: 'drink' },
  { id: 'dr_15lt', name: '1.5 Litre İçecek', price: 80, category: 'drink' },
  { id: 'dr_25lt', name: '2.5 Litre İçecek', price: 110, category: 'drink' },
];

export default function App() {
  // Aktif Tab: 'new_order' | 'orders' | 'summary' | 'menu_manage'
  const [activeTab, setActiveTab] = useState('new_order');

  // Menü Yönetimi State (LocalStorage Destekli)
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('kurye_menu_items_v1');
      return saved ? JSON.parse(saved) : DEFAULT_MENU_ITEMS;
    } catch (e) {
      return DEFAULT_MENU_ITEMS;
    }
  });

  // Ürün Ekleme / Düzenleme Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('durum');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sipariş Sepeti: { [itemId]: count }
  const [cart, setCart] = useState({});

  // Dinamik Dürüm Başı Paket Ücreti (Varsayılan 40 TL)
  const [perDurumFee, setPerDurumFee] = useState(40);
  // Manuel Sabit Paket Ücreti Override (50, 100, 200 TL)
  const [overrideDeliveryFee, setOverrideDeliveryFee] = useState(null);

  // Patron İndirimi / Yuvarlama Tutarı (TL)
  const [patronDiscount, setPatronDiscount] = useState('');

  // Parçalı Ödeme Dağılımı
  const [payCash, setPayCash] = useState(0);
  const [payIban, setPayIban] = useState(0);
  const [payPos, setPayPos] = useState(0);

  // Müşteri / Not alanı
  const [orderNote, setOrderNote] = useState('');

  // Kayıtlı Siparişler (LocalStorage)
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('kurye_orders_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Bildirim mesajı
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Menü kayıt
  useEffect(() => {
    try {
      localStorage.setItem('kurye_menu_items_v1', JSON.stringify(products));
    } catch (e) {
      console.error("Menu storage error", e);
    }
  }, [products]);

  // Sipariş kayıt
  useEffect(() => {
    try {
      localStorage.setItem('kurye_orders_v1', JSON.stringify(orders));
    } catch (e) {
      console.error("Storage error", e);
    }
  }, [orders]);

  // Dürüm ve İçecek Kategorilerine Ayırma
  const durumProducts = useMemo(() => products.filter(p => p.category === 'durum'), [products]);
  const drinkProducts = useMemo(() => products.filter(p => p.category === 'drink'), [products]);

  // Sepet hesaplamaları
  const durumCount = useMemo(() => {
    return durumProducts.reduce((sum, item) => sum + (cart[item.id] || 0), 0);
  }, [cart, durumProducts]);

  const drinksCount = useMemo(() => {
    return drinkProducts.reduce((sum, item) => sum + (cart[item.id] || 0), 0);
  }, [cart, drinkProducts]);

  // Restoran Brüt Menü Satış Tutarı
  const restaurantBaseTotal = useMemo(() => {
    let total = 0;
    products.forEach(item => {
      const count = cart[item.id] || 0;
      total += count * (Number(item.price) || 0);
    });
    return total;
  }, [cart, products]);

  // Patron İndirimi Sayısal Değer
  const numericDiscount = useMemo(() => {
    const val = Number(patronDiscount);
    return isNaN(val) || val < 0 ? 0 : val;
  }, [patronDiscount]);

  // İndirim düşülmüş Patron Net Menü Tutarı (Asla sıfırın altına inmez)
  const effectiveRestaurantTotal = useMemo(() => {
    return Math.max(0, restaurantBaseTotal - numericDiscount);
  }, [restaurantBaseTotal, numericDiscount]);

  // Kurye Brüt Paket Ücreti
  const calculatedDeliveryFee = useMemo(() => {
    if (overrideDeliveryFee !== null) {
      return overrideDeliveryFee;
    }
    const rate = Number(perDurumFee) || 0;
    if (durumCount === 0) {
      if (restaurantBaseTotal > 0) {
        return restaurantBaseTotal >= 400 ? 100 : 50;
      }
      return 0;
    }
    return durumCount * rate;
  }, [durumCount, perDurumFee, overrideDeliveryFee, restaurantBaseTotal]);

  // Müşteriden Alınacak Toplam Tutar: (Patron Menü - İndirim) + Kurye Paketi
  const customerTotal = effectiveRestaurantTotal + calculatedDeliveryFee;

  // Sepet veya indirim değiştiğinde ödemeyi varsayılan olarak Nakit'e eşitle
  useEffect(() => {
    setPayCash(customerTotal);
    setPayIban(0);
    setPayPos(0);
  }, [customerTotal]);

  // Parçalı ödeme toplamı & fark
  const totalEnteredPayment = (Number(payCash) || 0) + (Number(payIban) || 0) + (Number(payPos) || 0);
  const paymentDiff = customerTotal - totalEnteredPayment;

  // POS Vergi Hesaplaması Önizleme (%10 KDV + %20 Gelir Vergisi = %30)
  const singleOrderTaxPreview = useMemo(() => {
    if (customerTotal <= 0 || !payPos) return { posCut: 0, netCourier: calculatedDeliveryFee };
    const posRatio = Math.min(1, Math.max(0, (Number(payPos) || 0) / customerTotal));
    const courierGrossInPos = calculatedDeliveryFee * posRatio;
    const taxCut = courierGrossInPos * 0.30;
    const netCourier = calculatedDeliveryFee - taxCut;
    return { posCut: taxCut, netCourier };
  }, [customerTotal, payPos, calculatedDeliveryFee]);

  // Sepet Ürün Arttır/Azalt
  const updateQuantity = (id, delta) => {
    setCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  // Hızlı ödeme butonları
  const setAllTo = (type) => {
    if (type === 'cash') {
      setPayCash(customerTotal);
      setPayIban(0);
      setPayPos(0);
    } else if (type === 'iban') {
      setPayCash(0);
      setPayIban(customerTotal);
      setPayPos(0);
    } else if (type === 'pos') {
      setPayCash(0);
      setPayIban(0);
      setPayPos(customerTotal);
    }
  };

  // Menü Yönetimi İşlemleri
  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormPrice('');
    setFormCategory('durum');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingProduct(item);
    setFormName(item.name);
    setFormPrice(item.price.toString());
    setFormCategory(item.category);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) {
      showToast('Lütfen ürün adını ve fiyatını eksiksiz girin.');
      return;
    }
    const numericPrice = parseFloat(formPrice);
    if (isNaN(numericPrice) || numericPrice < 0) {
      showToast('Geçerli bir fiyat giriniz.');
      return;
    }

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
        ...p,
        name: formName.trim(),
        price: numericPrice,
        category: formCategory
      } : p));
      showToast(`${formName} güncellendi.`);
    } else {
      const newProd = {
        id: `custom_${Date.now()}`,
        name: formName.trim(),
        price: numericPrice,
        category: formCategory
      };
      setProducts(prev => [...prev, newProd]);
      showToast(`${formName} menüye eklendi.`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (id, name) => {
    if (window.confirm(`"${name}" ürününü menüden silmek istediğinize emin misiniz?`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
      setCart(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      showToast(`${name} silindi.`);
    }
  };

  const handleResetMenuToDefault = () => {
    if (window.confirm('Tüm menü ve fiyat değişiklikleri sıfırlanıp orijinal ayarlara dönecek. Emin misiniz?')) {
      setProducts(DEFAULT_MENU_ITEMS);
      showToast('Menü fabrika ayarlarına döndürüldü.');
    }
  };

  // Siparişi Kaydet
  const handleSaveOrder = () => {
    if (customerTotal <= 0 && restaurantBaseTotal <= 0) {
      showToast('Lütfen en az bir ürün seçiniz!');
      return;
    }
    if (Math.abs(paymentDiff) > 0.01) {
      showToast(`Ödeme dağılımı toplam tutara eşit olmalıdır! Fark: ${paymentDiff} TL`);
      return;
    }

    const posAmount = Number(payPos) || 0;
    const cashAmount = Number(payCash) || 0;
    const ibanAmount = Number(payIban) || 0;

    const posRatio = customerTotal > 0 ? (posAmount / customerTotal) : 0;
    const courierGrossInPos = calculatedDeliveryFee * posRatio;
    const taxDeduction = courierGrossInPos * 0.30;
    const netCourierFee = calculatedDeliveryFee - taxDeduction;

    const itemsSummary = [];
    products.forEach(it => {
      if (cart[it.id]) {
        itemsSummary.push({
          name: it.name,
          count: cart[it.id],
          unitPrice: it.price,
          total: cart[it.id] * it.price,
          category: it.category
        });
      }
    });

    const newOrder = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('tr-TR'),
      note: orderNote.trim() || `Paket #${orders.length + 1}`,
      perDurumFee: overrideDeliveryFee ? 'Sabit' : (Number(perDurumFee) || 0),
      durumCount,
      drinksCount,
      items: itemsSummary,
      restaurantBaseTotal,
      patronDiscount: numericDiscount,
      effectiveRestaurantTotal,
      grossCourierFee: calculatedDeliveryFee,
      customerTotal,
      payments: {
        cash: cashAmount,
        iban: ibanAmount,
        pos: posAmount
      },
      posTaxDeduction: taxDeduction,
      netCourierFee: netCourierFee
    };

    setOrders([newOrder, ...orders]);
    setCart({});
    setOrderNote('');
    setPatronDiscount('');
    setOverrideDeliveryFee(null);
    setPayCash(0);
    setPayIban(0);
    setPayPos(0);
    showToast('Paket başarıyla kaydedildi! 🛵💨');
  };

  const handleDeleteOrder = (id) => {
    if (window.confirm('Bu paketi silmek istediğinize emin misiniz?')) {
      setOrders(orders.filter(o => o.id !== id));
      showToast('Paket silindi.');
    }
  };

  // Gün Sonu Toplam Metrikleri
  const summary = useMemo(() => {
    return orders.reduce((acc, order) => {
      acc.totalOrders += 1;
      acc.totalDurum += order.durumCount || 0;
      acc.totalDrinks += order.drinksCount || 0;
      acc.totalCustomerRevenue += order.customerTotal || 0;
      acc.totalRestaurantRaw += order.restaurantBaseTotal || 0;
      acc.totalDiscount += order.patronDiscount || 0;
      acc.totalRestaurantNet += order.effectiveRestaurantTotal ?? (order.restaurantBaseTotal || 0);
      acc.totalGrossCourier += order.grossCourierFee || 0;
      acc.totalTaxDeduction += order.posTaxDeduction || 0;
      acc.totalNetCourier += order.netCourierFee || 0;
      acc.totalCash += order.payments.cash || 0;
      acc.totalIban += order.payments.iban || 0;
      acc.totalPos += order.payments.pos || 0;
      return acc;
    }, {
      totalOrders: 0,
      totalDurum: 0,
      totalDrinks: 0,
      totalCustomerRevenue: 0,
      totalRestaurantRaw: 0,
      totalDiscount: 0,
      totalRestaurantNet: 0,
      totalGrossCourier: 0,
      totalTaxDeduction: 0,
      totalNetCourier: 0,
      totalCash: 0,
      totalIban: 0,
      totalPos: 0
    });
  }, [orders]);

  // IBAN kuryenin şahsi hesabına yattığı için Nakit + IBAN kurye üzerindeki para sayılır[cite: 17]
  const totalCourierCollected = summary.totalCash + summary.totalIban;
  const cashDifference = totalCourierCollected - summary.totalNetCourier;

  const generateWhatsAppReport = () => {
    const today = new Date().toLocaleDateString('tr-TR');
    let text = `*🛵 GÜN SONU KURYE & KASA RAPORU* (${today})\n\n`;
    text += `📦 *Toplam Paket:* ${summary.totalOrders} adet\n`;
    text += `🌯 *Dürüm Adedi:* ${summary.totalDurum} adet\n`;
    text += `🥤 *İçecek Adedi:* ${summary.totalDrinks} adet\n\n`;
    text += `🏢 *Restoran Brüt Satış:* ${summary.totalRestaurantRaw.toLocaleString('tr-TR')} TL\n`;
    if (summary.totalDiscount > 0) {
      text += `🔻 *Patron İndirimi / Yuvarlama:* -${summary.totalDiscount.toLocaleString('tr-TR')} TL\n`;
    }
    text += `🏢 *Restoran Net Menü (Patron):* ${summary.totalRestaurantNet.toLocaleString('tr-TR')} TL\n\n`;
    text += `💳 *TAHSİLAT DAĞILIMI:*\n`;
    text += `• Nakit: ${summary.totalCash.toLocaleString('tr-TR')} TL\n`;
    text += `• IBAN: ${summary.totalIban.toLocaleString('tr-TR')} TL\n`;
    text += `• POS (Kart): ${summary.totalPos.toLocaleString('tr-TR')} TL\n`;
    text += `• *Genel Tahsilat:* ${summary.totalCustomerRevenue.toLocaleString('tr-TR')} TL\n\n`;
    text += `💰 *Kurye Brüt Paket Kazancı:* ${summary.totalGrossCourier.toLocaleString('tr-TR')} TL\n`;
    text += `🧾 *POS Vergi Kesintisi (%10 KDV + %20 GV):* -${summary.totalTaxDeduction.toFixed(1)} TL\n`;
    text += `⭐ *KURYE NET HAK EDİŞİ:* ${summary.totalNetCourier.toFixed(1)} TL\n\n`;
    text += `🤝 *KASA MUTABAKATI & HESAPLAŞMA:*\n`;
    text += `• Kurye Üzerindeki (Nakit + IBAN): ${totalCourierCollected.toLocaleString('tr-TR')} TL\n`;
    text += `• Kurye Net Kazancı: ${summary.totalNetCourier.toFixed(1)} TL\n`;
    
    if (cashDifference > 0) {
      text += `👉 *KURYE PATRONA ${cashDifference.toFixed(1)} TL TESLİM EDECEK.*`;
    } else if (cashDifference < 0) {
      text += `👉 *PATRON KURYEYE ${Math.abs(cashDifference).toFixed(1)} TL ÖDEYECEK.*`;
    } else {
      text += `👉 *KASA TAM TAMINA DENK (0 TL fark).*`;
    }

    navigator.clipboard.writeText(text);
    showToast('Gün sonu raporu panoya kopyalandı!');
  };

  const handleResetDay = () => {
    if (window.confirm('DİKKAT: Bugünün tüm sipariş kayıtları silinecek ve kasa sıfırlanacak. Onaylıyor musunuz?')) {
      setOrders([]);
      showToast('Günün verileri sıfırlandı.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none pb-36">
      {/* Üst Bilgi Barı */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🛵</span>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide leading-tight">Kurye Takip & POS</h1>
              <p className="text-xs text-amber-400 font-medium">Dürüm Başı: {overrideDeliveryFee ? 'Sabit' : `${perDurumFee}₺`}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('menu_manage')}
              title="Menü ve Fiyat Ayarları"
              className={`p-2 rounded-full border transition ${
                activeTab === 'menu_manage' 
                  ? 'bg-amber-500 text-black border-amber-400' 
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveTab('summary')}
              className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1.5 rounded-full font-bold flex items-center gap-1 active:scale-95 transition"
            >
              <span>Net:</span>
              <span className="font-mono">{summary.totalNetCourier.toFixed(0)} ₺</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Bildirim */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black px-4 py-2 rounded-full font-semibold shadow-2xl text-xs flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Ana İçerik */}
      <main className="max-w-2xl mx-auto w-full px-3 pt-3 flex-1">
        {/* TAB 1: YENİ SİPARİŞ GİRİŞİ */}
        {activeTab === 'new_order' && (
          <div className="space-y-4">
            
            {/* DİNAMİK DÜRÜM BAŞI PAKET TARİFESİ */}
            <div className="bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shadow-md space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Dürüm Başı Paket Ücreti
                </label>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  {overrideDeliveryFee !== null ? `${overrideDeliveryFee}₺ (Sabit)` : `${durumCount} Adet × ${perDurumFee}₺ = ${durumCount * (Number(perDurumFee) || 0)}₺`}
                </span>
              </div>

              {/* Hızlı Butonlar + Elle Giriş Alanı */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => { setPerDurumFee(20); setOverrideDeliveryFee(null); }}
                  className={`py-2 px-1 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                    perDurumFee === 20 && overrideDeliveryFee === null
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md font-bold'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-750'
                  }`}
                >
                  <span>20₺</span>
                  <span className="text-[9px] opacity-80">Komşu</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPerDurumFee(40); setOverrideDeliveryFee(null); }}
                  className={`py-2 px-1 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                    perDurumFee === 40 && overrideDeliveryFee === null
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md font-bold'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-750'
                  }`}
                >
                  <span>40₺</span>
                  <span className="text-[9px] opacity-80">Standart</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPerDurumFee(50); setOverrideDeliveryFee(null); }}
                  className={`py-2 px-1 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                    perDurumFee === 50 && overrideDeliveryFee === null
                      ? 'bg-amber-500 text-black border-amber-400 shadow-md font-bold'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-750'
                  }`}
                >
                  <span>50₺</span>
                  <span className="text-[9px] opacity-80">Uzak/Hvlmn</span>
                </button>

                <div className="relative">
                  <input
                    type="number"
                    value={perDurumFee}
                    onChange={(e) => {
                      setPerDurumFee(Number(e.target.value) || 0);
                      setOverrideDeliveryFee(null);
                    }}
                    placeholder="Özel ₺"
                    className="w-full h-full text-center text-xs font-mono font-bold bg-neutral-950 border border-neutral-700 rounded-xl text-amber-400 focus:outline-none focus:border-amber-500 py-1"
                  />
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-neutral-500 pointer-events-none">
                    Elle Yaz
                  </span>
                </div>
              </div>

              {/* Sabit Paket Ücreti Override Seçenekleri (50, 100, 200 TL) */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs px-1">
                <span className="text-neutral-400 text-[11px]">Sabit Paket:</span>
                <div className="flex gap-1.5">
                  {[50, 100, 200].map(fee => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setOverrideDeliveryFee(overrideDeliveryFee === fee ? null : fee)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition ${
                        overrideDeliveryFee === fee 
                          ? 'bg-blue-600 border-blue-400 text-white font-bold'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {fee === 50 ? '50₺ (Yarım)' : fee === 100 ? '100₺ (Tam)' : '200₺ (Çift)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dürüm Menüleri */}
            <div className="bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shadow-md">
              <div className="flex justify-between items-center mb-2 px-1">
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>🌯</span>
                  <span>Dürümler (Paket Ücreti Yansır)</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-400 font-mono font-bold">
                    {durumCount} Adet
                  </span>
                  <button
                    onClick={() => setActiveTab('menu_manage')}
                    className="text-[11px] text-neutral-400 hover:text-amber-400 underline"
                  >
                    Düzenle
                  </button>
                </div>
              </div>

              {durumProducts.length === 0 ? (
                <p className="text-xs text-neutral-500 py-3 text-center">Menüde dürüm bulunmuyor. Ayarlar sekmesinden ekleyebilirsiniz.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {durumProducts.map((item) => {
                    const qty = cart[item.id] || 0;
                    return (
                      <div 
                        key={item.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                          qty > 0 
                            ? 'bg-neutral-800/90 border-amber-500/50 shadow-inner' 
                            : 'bg-neutral-950/40 border-neutral-800/70'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">{item.name}</div>
                          <div className="text-xs text-amber-400/90 font-mono">{item.price} TL</div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={qty === 0}
                            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 text-white flex items-center justify-center font-bold text-sm active:scale-95 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center font-mono font-bold text-sm text-white">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center font-bold text-sm active:scale-95 transition shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* İçecekler / Ekstralar */}
            <div className="bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shadow-md">
              <div className="flex justify-between items-center mb-2 px-1">
                <h2 className="text-sm font-bold text-neutral-300 flex items-center gap-1.5">
                  <span>🥤</span>
                  <span>İçecekler (Paket Farkı Yok)</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-400 font-mono font-bold">
                    {drinksCount} Adet
                  </span>
                  <button
                    onClick={() => setActiveTab('menu_manage')}
                    className="text-[11px] text-neutral-400 hover:text-blue-400 underline"
                  >
                    Düzenle
                  </button>
                </div>
              </div>

              {drinkProducts.length === 0 ? (
                <p className="text-xs text-neutral-500 py-3 text-center">Menüde içecek bulunmuyor.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {drinkProducts.map((item) => {
                    const qty = cart[item.id] || 0;
                    return (
                      <div 
                        key={item.id}
                        className={`p-2 rounded-xl border flex flex-col justify-between transition ${
                          qty > 0 
                            ? 'bg-neutral-800/90 border-blue-500/50' 
                            : 'bg-neutral-950/40 border-neutral-800/70'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-[11px] font-medium text-neutral-200 line-clamp-1">{item.name}</span>
                          <span className="text-[11px] text-blue-400 font-mono font-semibold">{item.price}₺</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            disabled={qty === 0}
                            className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-20 text-white flex items-center justify-center active:scale-95 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono font-bold text-xs text-white">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold active:scale-95 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PATRON İNDİRİMİ / DÜZLEME & MÜŞTERİ NOTU */}
            <div className="bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shadow-md space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5" />
                  Patron İndirimi / Yuvarlama (TL)
                </label>
                <span className="text-[10px] text-neutral-500">Sadece menü cirosundan düşer</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Örn: 40 (1040 yerine düz 1000 TL alındığında)"
                  value={patronDiscount}
                  onChange={(e) => setPatronDiscount(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-rose-300 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition"
                />
                {numericDiscount > 0 && (
                  <button
                    type="button"
                    onClick={() => setPatronDiscount('')}
                    className="px-2.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs"
                  >
                    Temizle
                  </button>
                )}
              </div>

              <input
                type="text"
                placeholder="Not / Adres (Örn: Daire 4, Ahmet Bey, Havalimanı vb.)"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Fiyat & Hakediş Özet Kartı */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-850 p-4 rounded-2xl border border-neutral-700/80 shadow-xl space-y-3">
              <div className="grid grid-cols-3 gap-2 pb-3 border-b border-neutral-800 text-center">
                <div className="bg-neutral-950/60 p-2 rounded-xl">
                  <div className="text-[10px] text-neutral-400 font-medium">Patron Menü</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{effectiveRestaurantTotal} TL</div>
                  {numericDiscount > 0 && (
                    <div className="text-[9px] text-rose-400 line-through font-mono">{restaurantBaseTotal} TL</div>
                  )}
                </div>
                <div className="bg-neutral-950/60 p-2 rounded-xl border border-amber-500/30">
                  <div className="text-[10px] text-amber-400 font-medium">Kurye Brüt Paket</div>
                  <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">+{calculatedDeliveryFee} TL</div>
                  <div className="text-[9px] text-neutral-400">
                    {overrideDeliveryFee ? 'Sabit' : `${durumCount} × ${perDurumFee}₺`}
                  </div>
                </div>
                <div className="bg-neutral-950/60 p-2 rounded-xl border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400 font-medium">Tahsil Edilecek</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{customerTotal} TL</div>
                </div>
              </div>

              {/* Parçalı Ödeme Dağılımı */}
              <div>
                <div className="flex justify-between items-center mb-1.5 px-0.5">
                  <span className="text-xs font-semibold text-neutral-300">Ödeme Şekli (Parçalı Giriş)</span>
                  <div className="flex gap-1 text-[11px]">
                    <button 
                      type="button" 
                      onClick={() => setAllTo('cash')} 
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-medium transition"
                    >
                      Nakit
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setAllTo('iban')} 
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-medium transition"
                    >
                      IBAN
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setAllTo('pos')} 
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-medium transition"
                    >
                      POS
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Banknote className="w-3 h-3 text-emerald-400" /> Nakit
                    </label>
                    <input
                      type="number"
                      value={payCash === 0 ? '' : payCash}
                      placeholder="0"
                      onChange={(e) => setPayCash(Number(e.target.value) || 0)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-sm font-mono text-white text-center focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-blue-400" /> IBAN
                    </label>
                    <input
                      type="number"
                      value={payIban === 0 ? '' : payIban}
                      placeholder="0"
                      onChange={(e) => setPayIban(Number(e.target.value) || 0)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-sm font-mono text-white text-center focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-purple-400" /> POS Kart
                    </label>
                    <input
                      type="number"
                      value={payPos === 0 ? '' : payPos}
                      placeholder="0"
                      onChange={(e) => setPayPos(Number(e.target.value) || 0)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-sm font-mono text-white text-center focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="mt-2 text-xs flex justify-between items-center px-1">
                  <span className="text-neutral-400 text-[11px]">Girilmiş Toplam: {totalEnteredPayment} ₺</span>
                  {Math.abs(paymentDiff) > 0.01 ? (
                    <span className="text-red-400 font-semibold font-mono text-[11px]">
                      {paymentDiff > 0 ? `Eksik: ${paymentDiff} ₺` : `Fazla: ${Math.abs(paymentDiff)} ₺`}
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-medium">
                      <Check className="w-3 h-3" /> Tutar Eşit
                    </span>
                  )}
                </div>
              </div>

              {payPos > 0 && (
                <div className="bg-purple-950/30 border border-purple-800/50 rounded-xl p-2.5 text-[11px] text-purple-200 space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                      POS Vergi Kesintisi (%10 KDV + %20 GV = %30):
                    </span>
                    <span className="text-red-300 font-mono">-{singleOrderTaxPreview.posCut.toFixed(1)} TL</span>
                  </div>
                  <div className="text-neutral-400 text-[10px] flex justify-between">
                    <span>Bu Paketten Kuryeye Kalan Net:</span>
                    <span className="text-emerald-300 font-bold font-mono">
                      {singleOrderTaxPreview.netCourier.toFixed(1)} TL
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={customerTotal === 0 || Math.abs(paymentDiff) > 0.01}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-[0.98] transition-all"
              >
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>PAKETİ KAYDET ({customerTotal} TL)</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: BUGÜNKÜ PAKETLER */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Gidilen Paketler ({orders.length})</span>
              </h2>
              <span className="text-xs text-neutral-400 font-mono">Bugün</span>
            </div>

            {orders.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500 text-xs space-y-2">
                <div className="text-3xl">🛵</div>
                <p>Henüz kayıtlı paket yok.</p>
                <button
                  onClick={() => setActiveTab('new_order')}
                  className="px-3 py-1.5 bg-neutral-800 text-amber-400 rounded-lg text-xs font-semibold inline-block"
                >
                  Yeni Paket Ekle
                </button>
              </div>
            ) : (
              orders.map((ord) => (
                <div 
                  key={ord.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-md space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{ord.note}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-amber-950 text-amber-300 border border-amber-800">
                          {ord.perDurumFee === 'Sabit' ? 'Sabit Paket' : `Birim: ${ord.perDurumFee}₺`}
                        </span>
                        {ord.patronDiscount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-rose-950 text-rose-300 border border-rose-800">
                            İndirim: -{ord.patronDiscount}₺
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">{ord.timestamp}</span>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <div>
                        <div className="text-xs font-bold text-white font-mono">{ord.customerTotal} TL</div>
                        <div className="text-[10px] text-emerald-400 font-mono font-medium">
                          Net: {ord.netCourierFee.toFixed(1)} ₺
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteOrder(ord.id)}
                        className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-neutral-950/60 p-2 rounded-lg text-[11px] text-neutral-300 space-y-0.5">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.count}x {it.name}</span>
                        <span className="font-mono text-neutral-400">{it.total} TL</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] pt-1 border-t border-neutral-800 text-neutral-400">
                    {ord.payments.cash > 0 && (
                      <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-emerald-300 font-mono">
                        Nakit: {ord.payments.cash} ₺
                      </span>
                    )}
                    {ord.payments.iban > 0 && (
                      <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-blue-300 font-mono">
                        IBAN: {ord.payments.iban} ₺
                      </span>
                    )}
                    {ord.payments.pos > 0 && (
                      <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-purple-300 font-mono">
                        POS: {ord.payments.pos} ₺ (Vergi: -{ord.posTaxDeduction.toFixed(1)} ₺)
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: GÜN SONU HESAPLAŞMA */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            
            <div className={`p-4 rounded-2xl border shadow-2xl relative overflow-hidden ${
              cashDifference > 0 
                ? 'bg-gradient-to-br from-amber-950/60 to-neutral-900 border-amber-500/50' 
                : cashDifference < 0
                  ? 'bg-gradient-to-br from-emerald-950/60 to-neutral-900 border-emerald-500/50'
                  : 'bg-neutral-900 border-neutral-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                  Kasa Mutabakatı (Hesaplaşma)
                </span>
                <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-mono">
                  Canlı Durum
                </span>
              </div>

              <div className="my-3">
                {cashDifference > 0 ? (
                  <div>
                    <div className="text-xs text-neutral-300">Kurye Patrona Teslim Edecek:</div>
                    <div className="text-3xl font-black text-amber-400 font-mono mt-0.5">
                      {cashDifference.toFixed(1)} TL
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Üzerinizde toplam <strong className="text-white font-mono">{totalCourierCollected} TL</strong> (Nakit: {summary.totalCash} TL, IBAN: {summary.totalIban} TL) tahsilat var. Net hak edişiniz olan <strong className="text-emerald-400 font-mono">{summary.totalNetCourier.toFixed(1)} TL</strong>'yi alıp kalanı dükkana teslim edeceksiniz.
                    </p>
                  </div>
                ) : cashDifference < 0 ? (
                  <div>
                    <div className="text-xs text-neutral-300">Patron Kuryeye Ödeyecek:</div>
                    <div className="text-3xl font-black text-emerald-400 font-mono mt-0.5">
                      {Math.abs(cashDifference).toFixed(1)} TL
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      POS ağırlıklı tahsilat yapıldığı için üzerinizdeki tahsilat (<span className="text-white font-mono">{totalCourierCollected} TL</span>) net hak edişinizi karşılamıyor. Patron aradaki farkı kuryeye ödemelidir.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-white font-mono">Kasa Tamamen Denk (0 TL)</div>
                    <p className="text-xs text-neutral-400 mt-1">Üzerinizdeki Nakit + IBAN tutarı tam olarak kurye net hak edişine eşittir.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-800/80 text-xs">
                <div className="bg-neutral-950/50 p-2 rounded-xl">
                  <span className="text-[10px] text-neutral-400 block">Kurye Üzerindeki (Nakit + IBAN)</span>
                  <span className="text-sm font-bold text-white font-mono">{totalCourierCollected.toLocaleString('tr-TR')} TL</span>
                </div>
                <div className="bg-neutral-950/50 p-2 rounded-xl">
                  <span className="text-[10px] text-neutral-400 block">Kurye Net Kazancı</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">{summary.totalNetCourier.toFixed(1)} TL</span>
                </div>
              </div>
            </div>

            {/* İstatistikler */}
            <div className="bg-neutral-900 p-3.5 rounded-2xl border border-neutral-800 space-y-3">
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Finansal Dağılım & Ciro
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Toplam Müşteri Tahsilatı:</span>
                  <span className="font-bold font-mono text-white text-sm">
                    {summary.totalCustomerRevenue.toLocaleString('tr-TR')} TL
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Restoran Brüt Menü Satışı:</span>
                  <span className="font-bold font-mono text-neutral-200">
                    {summary.totalRestaurantRaw.toLocaleString('tr-TR')} TL
                  </span>
                </div>

                {summary.totalDiscount > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-neutral-800/60 text-rose-300">
                    <span className="flex items-center gap-1">Patron İndirimi / Yuvarlama:</span>
                    <span className="font-bold font-mono">
                      -{summary.totalDiscount.toLocaleString('tr-TR')} TL
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Patron Net Menü Cirosu:</span>
                  <span className="font-bold font-mono text-white">
                    {summary.totalRestaurantNet.toLocaleString('tr-TR')} TL
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Kurye Brüt Paket Ücretleri:</span>
                  <span className="font-bold font-mono text-amber-400">
                    +{summary.totalGrossCourier.toLocaleString('tr-TR')} TL
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    Patrona Bırakılan POS Vergisi (%30):
                  </span>
                  <span className="font-bold font-mono text-red-400">
                    -{summary.totalTaxDeduction.toFixed(1)} TL
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 bg-emerald-950/20 px-2 rounded-lg border border-emerald-900/50">
                  <span className="text-emerald-400 font-semibold">Kurye Net Hak Ediş:</span>
                  <span className="font-black font-mono text-emerald-400 text-base">
                    {summary.totalNetCourier.toFixed(1)} TL
                  </span>
                </div>
              </div>
            </div>

            {/* Tahsilat Kanalları */}
            <div className="bg-neutral-900 p-3.5 rounded-2xl border border-neutral-800 space-y-2">
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Ödeme Yöntemleri
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <div className="text-[10px] text-emerald-400 font-medium">Nakit</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{summary.totalCash} TL</div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <div className="text-[10px] text-blue-400 font-medium">IBAN</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{summary.totalIban} TL</div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <div className="text-[10px] text-purple-400 font-medium">POS Kart</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">{summary.totalPos} TL</div>
                </div>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={generateWhatsAppReport}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
              >
                <Share2 className="w-4 h-4" />
                <span>WHATSAPP RAPORUNU KOPYALA</span>
              </button>

              <button
                type="button"
                onClick={handleResetDay}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-red-950/40 text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-800/50 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Günü Bitir & Verileri Sıfırla</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 4: MENÜ & FİYAT YÖNETİMİ */}
        {activeTab === 'menu_manage' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Menü & Fiyat Yönetimi</span>
                </h2>
                <p className="text-[11px] text-neutral-400">Ürün ekle, çıkar veya fiyatları anında güncelle.</p>
              </div>

              <button
                type="button"
                onClick={openAddModal}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Ürün</span>
              </button>
            </div>

            {/* Dürüm Kalemleri */}
            <div className="bg-neutral-900 p-3 rounded-2xl border border-neutral-800 space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  🌯 Dürümler ({durumProducts.length})
                </span>
                <span className="text-[10px] text-neutral-400">Paket farkı işletilir</span>
              </div>

              <div className="space-y-1.5">
                {durumProducts.map(item => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-2.5 bg-neutral-950/60 border border-neutral-800 rounded-xl"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{item.name}</div>
                      <div className="text-xs font-mono text-amber-400 font-bold">{item.price} TL</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg hover:bg-neutral-700 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(item.id, item.name)}
                        className="p-1.5 text-neutral-400 hover:text-red-400 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* İçecek Kalemleri */}
            <div className="bg-neutral-900 p-3 rounded-2xl border border-neutral-800 space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                  🥤 İçecekler ({drinkProducts.length})
                </span>
                <span className="text-[10px] text-neutral-400">Paket farkı eklenmez</span>
              </div>

              <div className="space-y-1.5">
                {drinkProducts.map(item => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-2.5 bg-neutral-950/60 border border-neutral-800 rounded-xl"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{item.name}</div>
                      <div className="text-xs font-mono text-blue-400 font-bold">{item.price} TL</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg hover:bg-neutral-700 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(item.id, item.name)}
                        className="p-1.5 text-neutral-400 hover:text-red-400 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fabrika Ayarlarına Dön */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetMenuToDefault}
                className="w-full py-2.5 px-3 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 hover:text-amber-400 border border-neutral-800 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Orijinal Varsayılan Menüyü Yükle</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Ürün Ekleme / Düzenleme Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-sm p-4 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {editingProduct ? <Edit2 className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
                <span>{editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Ürün Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Double Dürüm, Ayran 300ml..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Satış Fiyatı (TL)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="250"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Kategori (Paket Ücreti Kuralı)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormCategory('durum')}
                    className={`p-2 rounded-xl border text-xs flex flex-col items-center gap-0.5 transition ${
                      formCategory === 'durum' 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold' 
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    <span>🌯 Dürüm</span>
                    <span className="text-[9px] opacity-75">Paket ücreti ekler</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormCategory('drink')}
                    className={`p-2 rounded-xl border text-xs flex flex-col items-center gap-0.5 transition ${
                      formCategory === 'drink' 
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500 font-bold' 
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    <span>🥤 İçecek</span>
                    <span className="text-[9px] opacity-75">Paket ücreti yok</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow-lg transition"
                >
                  {editingProduct ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alt Mobil Navigasyon Çubuğu */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 py-2 px-4">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('new_order')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'new_order' 
                ? 'text-amber-400 bg-neutral-800/80 font-bold' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Yeni Paket</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition relative ${
              activeTab === 'orders' 
                ? 'text-amber-400 bg-neutral-800/80 font-bold' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Paketler</span>
            {orders.length > 0 && (
              <span className="absolute top-1 right-4 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center">
                {orders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'summary' 
                ? 'text-amber-400 bg-neutral-800/80 font-bold' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Gün Sonu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('menu_manage')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'menu_manage' 
                ? 'text-amber-400 bg-neutral-800/80 font-bold' 
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Menü/Fiyat</span>
          </button>
        </div>
      </nav>
    </div>
  );
}