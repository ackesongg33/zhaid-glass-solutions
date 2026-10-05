import { useCallback, useState } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Products from '@/components/Products';
import GlassTypes from '@/components/GlassTypes';
import Frames from '@/components/Frames';
import CustomMeasurements, { type CustomInput } from '@/components/CustomMeasurements';
import Gallery from '@/components/Gallery';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import SaidAI from '@/components/SaidAI';
import WelcomeIntro from '@/components/WelcomeIntro';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { QuoteResult } from '@/lib/pricing';

export default function App() {
  const [aiOpen, setAiOpen] = useState(false);
  const [initialAiProduct, setInitialAiProduct] = useState<string | null>(null);
  const [pendingQuote, setPendingQuote] = useState<{
    result: QuoteResult;
    input: CustomInput;
  } | null>(null);

  useScrollReveal();

  const openAI = useCallback(() => setAiOpen(true), []);

  const closeAI = useCallback(() => {
    setAiOpen(false);
    setInitialAiProduct(null);
  }, []);

  const sendToAI = useCallback((result: QuoteResult, input: CustomInput) => {
    setPendingQuote({ result, input });
    setAiOpen(true);
  }, []);

  const requestProduct = useCallback((productName: string) => {
    const normalizedProduct = productName
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    const initialProduct = (() => {
      if (/puerta/.test(normalizedProduct)) return 'puerta';
      if (/ventana/.test(normalizedProduct)) return 'ventana';
      if (/mampara/.test(normalizedProduct)) return 'mampara';
      if (/baranda/.test(normalizedProduct)) return 'baranda';
      if (/espejo/.test(normalizedProduct)) return 'espejo';
      if (/techo|cubierta/.test(normalizedProduct)) return 'techo';
      if (
        /vidrio|templado|laminado|reflectivo|esmerilado|insulado/.test(
          normalizedProduct
        )
      )
        return 'vidrio';
      if (/fachada/.test(normalizedProduct)) return 'fachada';
      if (/aluminio/.test(normalizedProduct)) return 'aluminio';
      if (/cerramiento|estructura|especial|proyecto/.test(normalizedProduct))
        return 'proyecto especial';

      return normalizedProduct;
    })();

    setPendingQuote(null);
    setInitialAiProduct(initialProduct);
    setAiOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <WelcomeIntro />

      <Navbar onQuoteClick={openAI} />

      <main>
        <Hero onQuoteClick={openAI} />
        <Services onMoreInfo={requestProduct} />
        <Products onRequestProduct={requestProduct} />
        <GlassTypes onRequestQuote={requestProduct} />
        <Frames />
        <CustomMeasurements onSendToAI={sendToAI} />
        <Gallery />
        <About />
        <Contact onQuoteClick={openAI} />
      </main>

      <Footer />

      <FloatingWhatsApp onOpenAI={openAI} />

      <SaidAI
        open={aiOpen}
        onClose={closeAI}
        pendingQuote={pendingQuote}
        clearPending={() => setPendingQuote(null)}
        initialProduct={initialAiProduct}
      />
    </div>
  );
}