/** Übersetzt häufige (Supabase-)Fehler in freundliche deutsche Meldungen. */
export function friendlyError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : String(error ?? 'Unbekannter Fehler');

  const map: Record<string, string> = {
    'Invalid login credentials': 'E-Mail oder Passwort ist falsch.',
    'Email not confirmed':
      'Bitte bestätige zuerst deine E-Mail-Adresse. Schau in dein Postfach.',
    'User already registered': 'Diese E-Mail-Adresse ist bereits registriert.',
    'Password should be at least 6 characters':
      'Das Passwort muss mindestens 6 Zeichen haben.',
    'Einladungscode ungültig.': 'Der Einladungscode ist ungültig.',
    'Einladung ist abgelaufen.': 'Diese Einladung ist leider abgelaufen.',
    'Einladung ist nicht mehr gültig.': 'Diese Einladung ist nicht mehr gültig.',
  };

  for (const [key, value] of Object.entries(map)) {
    if (message.includes(key)) return value;
  }
  return message;
}
