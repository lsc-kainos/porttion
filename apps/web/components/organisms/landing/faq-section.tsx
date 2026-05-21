'use client';
import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/atoms/ui/accordion';
import { EditorialSectionHeader } from '@/components/molecules/editorial-section-header';

const ITEMS = ['data', 'recommend', 'import', 'pricing', 'language'] as const;

export function FaqSection() {
  const t = useTranslations('landing.faq');
  return (
    <section id="faq" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <EditorialSectionHeader eyebrow={t('eyebrow')} title={t('title')} />
        <Accordion type="single" collapsible className="mt-8">
          {ITEMS.map((k) => (
            <AccordionItem key={k} value={k}>
              <AccordionTrigger>{t(`items.${k}.q`)}</AccordionTrigger>
              <AccordionContent>{t(`items.${k}.a`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
