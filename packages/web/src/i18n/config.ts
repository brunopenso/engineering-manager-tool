import i18n from 'i18next';
import type { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  DEFAULT_LANGUAGE_PREFERENCE,
  LANGUAGE_PREFERENCES,
} from '../types/profilePreferences.js';

import enUSCommon from '../locales/en-US/common.json';
import enUSShell from '../locales/en-US/shell.json';
import enUSAuth from '../locales/en-US/auth.json';
import enUSProfile from '../locales/en-US/profile.json';
import enUSDeliverables from '../locales/en-US/deliverables.json';
import enUSLeader from '../locales/en-US/leader.json';
import enUSAdmin from '../locales/en-US/admin.json';

import ptBRCommon from '../locales/pt-BR/common.json';
import ptBRShell from '../locales/pt-BR/shell.json';
import ptBRAuth from '../locales/pt-BR/auth.json';
import ptBRProfile from '../locales/pt-BR/profile.json';
import ptBRDeliverables from '../locales/pt-BR/deliverables.json';
import ptBRLeader from '../locales/pt-BR/leader.json';
import ptBRAdmin from '../locales/pt-BR/admin.json';

export const I18N_NAMESPACES = [
  'common',
  'shell',
  'auth',
  'profile',
  'deliverables',
  'leader',
  'admin',
] as const;

const resources = {
  'en-US': {
    common: enUSCommon,
    shell: enUSShell,
    auth: enUSAuth,
    profile: enUSProfile,
    deliverables: enUSDeliverables,
    leader: enUSLeader,
    admin: enUSAdmin,
  },
  'pt-BR': {
    common: ptBRCommon,
    shell: ptBRShell,
    auth: ptBRAuth,
    profile: ptBRProfile,
    deliverables: ptBRDeliverables,
    leader: ptBRLeader,
    admin: ptBRAdmin,
  },
} as const;

const initOptions: InitOptions = {
  resources,
  fallbackLng: DEFAULT_LANGUAGE_PREFERENCE,
  supportedLngs: [...LANGUAGE_PREFERENCES],
  defaultNS: 'common',
  ns: [...I18N_NAMESPACES],
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ['navigator'],
    caches: [],
    convertDetectedLanguage: (language: string) => {
      if (language.startsWith('pt')) {
        return 'pt-BR';
      }
      if (language.startsWith('en')) {
        return 'en-US';
      }
      return DEFAULT_LANGUAGE_PREFERENCE;
    },
  },
  react: {
    useSuspense: false,
  },
};

void i18n.use(LanguageDetector).use(initReactI18next).init(initOptions);

export default i18n;
