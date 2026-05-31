import type { LocaleStrings } from "./types.js";

export const en: LocaleStrings = {
  "hub.title": "How would you like to reach us?",
  "hub.subtitle": "Choose the option that suits you best",
  "hub.voice": "Talk to {name}",
  "hub.voiceDesc": "Live voice assistant",
  "hub.chat": "Chat with {name}",
  "hub.chatDesc": "Text chat — ask anything",
  "hub.whatsapp": "WhatsApp",
  "hub.whatsappDesc": "Chat with us instantly",
  "hub.callMe": "Call me",
  "hub.callMeDesc": "{name} calls you in seconds",
  "callMe.title": "We'll call you",
  "callMe.placeholder": "+1 (555) 123-4567",
  "callMe.submit": "Call me now",
  "callMe.formNote": "",
  "callMe.calling": "Calling...",
  "callMe.ended": "Call ended",
  "callMe.error": "Could not connect the call",
  "callMe.back": "Back",
};

export const es: LocaleStrings = {
  "hub.title": "¿Cómo prefieres contactarnos?",
  "hub.subtitle": "Elige la opción que más te convenga",
  "hub.voice": "Hablar con {name}",
  "hub.voiceDesc": "Asistente de voz en vivo",
  "hub.chat": "Chatear con {name}",
  "hub.chatDesc": "Chat de texto — preguntá lo que quieras",
  "hub.whatsapp": "WhatsApp",
  "hub.whatsappDesc": "Chatea con nosotros al instante",
  "hub.callMe": "Te llamamos",
  "hub.callMeDesc": "{name} te llama en segundos",
  "callMe.title": "Te llamamos",
  "callMe.placeholder": "+51 987 654 321",
  "callMe.submit": "Llamarme ahora",
  "callMe.formNote": "",
  "callMe.calling": "Llamando...",
  "callMe.ended": "Llamada finalizada",
  "callMe.error": "No se pudo conectar la llamada",
  "callMe.back": "Volver",
};

export const de: LocaleStrings = {
  "hub.title": "Wie möchten Sie uns erreichen?",
  "hub.subtitle": "Wählen Sie die passende Option",
  "hub.voice": "Mit {name} sprechen",
  "hub.voiceDesc": "Live-Sprachassistent",
  "hub.chat": "Mit {name} chatten",
  "hub.chatDesc": "Text-Chat — fragen Sie alles",
  "hub.whatsapp": "WhatsApp",
  "hub.whatsappDesc": "Chatten Sie sofort mit uns",
  "hub.callMe": "Rückruf",
  "hub.callMeDesc": "{name} ruft Sie in Sekunden an",
  "callMe.title": "Wir rufen Sie an",
  "callMe.placeholder": "+49 170 1234567",
  "callMe.submit": "Jetzt anrufen",
  "callMe.formNote": "",
  "callMe.calling": "Anruf wird verbunden...",
  "callMe.ended": "Anruf beendet",
  "callMe.error": "Verbindung fehlgeschlagen",
  "callMe.back": "Zurück",
};

export const pt: LocaleStrings = {
  "hub.title": "Como prefere nos contactar?",
  "hub.subtitle": "Escolha a opção mais conveniente",
  "hub.voice": "Falar com {name}",
  "hub.voiceDesc": "Assistente de voz ao vivo",
  "hub.chat": "Conversar com {name}",
  "hub.chatDesc": "Chat de texto — pergunte o que quiser",
  "hub.whatsapp": "WhatsApp",
  "hub.whatsappDesc": "Converse conosco instantaneamente",
  "hub.callMe": "Ligue-me",
  "hub.callMeDesc": "{name} liga para você em segundos",
  "callMe.title": "Vamos ligar para você",
  "callMe.placeholder": "+55 11 98765-4321",
  "callMe.submit": "Ligar agora",
  "callMe.formNote": "",
  "callMe.calling": "Ligando...",
  "callMe.ended": "Chamada encerrada",
  "callMe.error": "Não foi possível conectar a chamada",
  "callMe.back": "Voltar",
};

const locales: Record<string, LocaleStrings> = { en, es, de, pt };

/**
 * Get a locale string with variable interpolation.
 *
 * @param locale - Locale code ("en", "es", "de", "pt")
 * @param key - Dot-notated string key
 * @param overrides - User-provided label overrides
 * @param vars - Variables to interpolate (e.g. { name: "Florencia" })
 */
export function t(
  locale: string,
  key: keyof LocaleStrings,
  overrides?: Partial<LocaleStrings>,
  vars?: Record<string, string>,
): string {
  const base = locales[locale] ?? locales.en;
  let str = overrides?.[key] ?? base[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}
