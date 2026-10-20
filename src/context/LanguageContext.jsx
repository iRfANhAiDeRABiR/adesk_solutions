import React, { createContext, useContext, useState } from 'react';
import { translations } from '../data/translations';
import { autodeskProducts, autodeskSixCategories, autodeskAllAppsPlans } from '../data/autodeskData';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('softwaresolutions_lang') || 'en';
  });

  const defaultAllApps = autodeskAllAppsPlans[0];
  const [selectedProduct, setSelectedProduct] = useState(defaultAllApps);
  const [selectedDuration, setSelectedDuration] = useState('1 Year');

  const toggleLanguage = () => {
    setLang((prev) => {
      const next = prev === 'en' ? 'bn' : 'en';
      localStorage.setItem('softwaresolutions_lang', next);
      return next;
    });
  };

  const handleSelectProduct = (product, duration = '1 Year') => {
    const matchedPlan = autodeskAllAppsPlans.find(
      (p) => p.id === product?.id || p.duration === duration || p.duration === product?.duration
    );

    let category = autodeskSixCategories.find(
      (c) => c.id === product?.id || c.name === product?.name || c.nameBn === product?.name
    );

    if (!category && product?.name) {
      const pName = product.name.toLowerCase();
      category = autodeskSixCategories.find((c) =>
        c.matchKeywords?.some((kw) => pName.includes(kw))
      );
    }

    const resolved = matchedPlan || (category ? {
      ...category,
      selectedApp: product?.selectedApp || (product?.name !== category.name ? product?.name : null)
    } : (product || autodeskSixCategories[0]));

    setSelectedProduct(resolved);
    setSelectedDuration(duration);

    const orderSection = document.getElementById('order');
    if (orderSection) {
      orderSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [activePaymentOrder, setActivePaymentOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('softwaresolutions_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const startPayment = (order) => {
    setActivePaymentOrder(order);
    try {
      localStorage.setItem('softwaresolutions_active_order', JSON.stringify(order));
    } catch (e) {}
    window.location.hash = '#payment';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelPayment = () => {
    setActivePaymentOrder(null);
    try {
      localStorage.removeItem('softwaresolutions_active_order');
    } catch (e) {}
    window.location.hash = '#order';
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLanguage,
        t,
        selectedProduct,
        setSelectedProduct,
        selectedDuration,
        setSelectedDuration,
        handleSelectProduct,
        activePaymentOrder,
        startPayment,
        cancelPayment,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
