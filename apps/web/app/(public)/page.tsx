import dynamic from 'next/dynamic';
import { LandingShell } from '@/components/templates/landing-shell';
import { LandingHeader } from '@/components/organisms/landing/landing-header';
import { LandingFooter } from '@/components/organisms/landing/landing-footer';
import { HeroSection } from '@/components/organisms/landing/hero-section';
import { ValuePropSection } from '@/components/organisms/landing/value-prop-section';
import { HowItWorksSection } from '@/components/organisms/landing/how-it-works-section';
import { AiSection } from '@/components/organisms/landing/ai-section';
import { ClosingCtaSection } from '@/components/organisms/landing/closing-cta-section';

// Lazy load das seções pesadas abaixo do fold
const UseCasesSection = dynamic(() =>
  import('@/components/organisms/landing/use-cases-section').then((m) => m.UseCasesSection),
);
const TestimonialsSection = dynamic(() =>
  import('@/components/organisms/landing/testimonials-section').then((m) => m.TestimonialsSection),
);
const FaqSection = dynamic(() =>
  import('@/components/organisms/landing/faq-section').then((m) => m.FaqSection),
);

export default function LandingPage() {
  return (
    <LandingShell header={<LandingHeader />} footer={<LandingFooter />}>
      <HeroSection />
      <ValuePropSection />
      <HowItWorksSection />
      <AiSection />
      <UseCasesSection />
      <TestimonialsSection />
      <FaqSection />
      <ClosingCtaSection />
    </LandingShell>
  );
}
