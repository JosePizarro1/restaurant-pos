import React, { ReactNode, useEffect } from 'react';
import { useAtom } from 'jotai';
import { Settings } from 'luxon';
import i18n from '@/lib/i18n.ts';
import { DEFAULT_LANGUAGE, DEFAULT_TEXT_DIRECTION, isSupportedLanguage, isTextDirection } from '@/lib/languages.ts';
import { appPage } from '@/store/jotai.ts';

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [page, setPage] = useAtom(appPage);
  
  // If page.language is missing or 'en' (old default), force 'es'
  const activeLanguage = (!page.language || page.language === 'en' || !isSupportedLanguage(page.language)) 
    ? DEFAULT_LANGUAGE 
    : page.language;
    
  const direction = isTextDirection(page.direction) ? page.direction : DEFAULT_TEXT_DIRECTION;

  useEffect(() => {
    if (!page.language || page.language === 'en') {
      setPage(prev => ({ ...prev, language: DEFAULT_LANGUAGE }));
    }
  }, [page.language, setPage]);

  useEffect(() => {
    if (i18n.language !== activeLanguage) {
      void i18n.changeLanguage(activeLanguage);
    }
    Settings.defaultLocale = activeLanguage;
    document.documentElement.lang = activeLanguage;
    document.documentElement.dir = direction;
  }, [activeLanguage, direction]);

  return <>{children}</>;
};
