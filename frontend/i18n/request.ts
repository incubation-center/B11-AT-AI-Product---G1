import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import en from './translate/en.json';
import km from './translate/km.json';

import { defaultLocale, isLocale } from './config';

const messagesByLocale = {
  en,
  km,
} as const;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get('NEXT_LOCALE')?.value;
  const locale =
    requestedLocale && isLocale(requestedLocale)
      ? requestedLocale
      : defaultLocale;

  return {
    locale,
    messages: messagesByLocale[locale],
  };
});
