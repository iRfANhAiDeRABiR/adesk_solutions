import React from 'react';
import { LanguageProvider } from './context/LanguageContext';
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import TrustBadges from './components/TrustBadges';
import ProductCategories from './components/ProductCategories';
import SubscriptionPlans from './components/SubscriptionPlans';
import CrackedVsOfficial from './components/CrackedVsOfficial';
import PreOrderDoubts from './components/PreOrderDoubts';
import WhyChooseUs from './components/WhyChooseUs';
import HowItWorks from './components/HowItWorks';
import OrderSection from './components/OrderSection';
import FAQ from './components/FAQ';
import Testimonials from './components/Testimonials';
import CTASection from './components/CTASection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import FloatingContactButton from './components/FloatingContactButton';

import PaymentGatewayPage from './components/payment/PaymentGatewayPage';
import NotFoundPage from './components/NotFoundPage';
import { useLanguage } from './context/LanguageContext';
import { trackPageView } from './services/pixelService';

function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-cyan-500 selection:text-white relative overflow-x-hidden">
      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Navigation */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-grow">
        {/* 3. Hero Section (Autodesk-focused) */}
        <HeroSection />

        {/* 4. Trust / Quick Benefits Bar */}
        <TrustBadges />

        {/* 5. Product Category Section (6 Categories: BIM, CAD Toolsets, Manufacturing, Vault, 3D VFX, All Apps) */}
        <ProductCategories />

        {/* 6. Subscription Duration Options (1, 2 & 3 Years) */}
        <SubscriptionPlans />

        {/* 7. Cracked vs Official Subscription Comparison (Security & Risk Warning) */}
        <CrackedVsOfficial />

        {/* 8. Pre-Order Common Doubts & Buyer Transparency Section */}
        <PreOrderDoubts />

        {/* 9. Why Software Solutions BD */}
        <WhyChooseUs />

        {/* 10. How to Order (4-Step Installation Guide & Replacement Guarantee on White BG) */}
        <HowItWorks />

        {/* 13. Autodesk Order Form (Default: Autodesk All Apps) */}
        <OrderSection />

        {/* 14. FAQ Section */}
        <FAQ />

        {/* 15. Testimonials Section */}
        <Testimonials />

        {/* 16. Final Full-Width CTA */}
        <CTASection />

        {/* 17. Contact Section */}
        <ContactSection />
      </main>

      {/* 18. Footer */}
      <Footer />

      {/* 19. Floating WhatsApp Widget */}
      <FloatingContactButton />
    </div>
  );
}

function AppContent() {
  const { activePaymentOrder, cancelPayment } = useLanguage();
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);
  const [currentHash, setCurrentHash] = React.useState(window.location.hash);

  React.useEffect(() => {
    trackPageView();
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname);
      setCurrentHash(window.location.hash);
      trackPageView();
    };
    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  const handleGoHome = (targetHash = '') => {
    const basePath = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
    const rootUrl = basePath || '/';
    if (window.location.pathname !== '/' && window.location.pathname !== rootUrl) {
      window.history.pushState({}, '', rootUrl + (targetHash ? targetHash : ''));
    } else {
      window.location.hash = targetHash;
    }
    setCurrentPath(rootUrl);
    setCurrentHash(targetHash);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 404 Route Protection: Recognizes root, index.html, and repository subpaths
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
  const cleanPath = (currentPath || '').replace(/\/+$/, '');
  const validRootPaths = [
    '',
    '/',
    '/index.html',
    basePath,
    `${basePath}/index.html`,
    '/project_03',
    '/project_03/index.html'
  ].map(p => p.toLowerCase());

  const is404 = !validRootPaths.includes(cleanPath.toLowerCase()) && 
                cleanPath !== '' && 
                !cleanPath.endsWith('/index.html');

  if (is404) {
    return <NotFoundPage onGoHome={handleGoHome} />;
  }

  if (currentHash === '#payment' && activePaymentOrder) {
    return (
      <PaymentGatewayPage
        order={activePaymentOrder}
        onCancel={cancelPayment}
      />
    );
  }

  return <LandingPage />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
