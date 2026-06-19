import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { TextField } from './TextField';

interface DateFieldProps {
  label?: string;
  /** ISO-Datum (YYYY-MM-DD) oder null */
  value: string | null;
  onChange: (iso: string | null) => void;
  error?: string;
}

/**
 * Datumseingabe im deutschen Format TT.MM.JJJJ.
 * - Manuelles Tippen funktioniert (eigener Textzustand, Teil-Eingaben bleiben sichtbar).
 * - Kalender-Icon öffnet auf Web den nativen Date-Picker.
 * Nach außen als ISO-Datum (YYYY-MM-DD) bzw. null (solange unvollständig/ungültig).
 */
export function DateField({ label, value, onChange, error }: DateFieldProps) {
  const [text, setText] = useState(() => isoToDisplay(value));

  // Externe Wertänderung (z. B. über den Picker) in den Anzeigetext spiegeln –
  // aber nie die laufende Tipp-Eingabe überschreiben.
  useEffect(() => {
    if (displayToIso(text) !== value) setText(isoToDisplay(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleChange(input: string) {
    const digits = input.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }
    setText(formatted);
    onChange(displayToIso(formatted));
  }

  function openPicker() {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'date';
    if (value) input.value = value;
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    const cleanup = () => { try { document.body.removeChild(input); } catch { /* noop */ } };
    input.addEventListener('change', () => {
      const iso = input.value || null; // YYYY-MM-DD
      setText(isoToDisplay(iso));
      onChange(iso);
      cleanup();
    });
    input.addEventListener('blur', () => setTimeout(cleanup, 200));
    const withPicker = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof withPicker.showPicker === 'function') withPicker.showPicker();
    else { input.focus(); input.click(); }
  }

  return (
    <TextField
      label={label}
      value={text}
      onChangeText={handleChange}
      placeholder="TT.MM.JJJJ"
      keyboardType="number-pad"
      maxLength={10}
      error={error}
      rightIcon="calendar-outline"
      onRightIconPress={openPicker}
    />
  );
}

function isoToDisplay(iso: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}.${m}.${y}`;
}

/** Wandelt TT.MM.JJJJ in ISO um; gibt null zurück, solange unvollständig/ungültig. */
function displayToIso(display: string): string | null {
  const match = display.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return `${yyyy}-${mm}-${dd}`;
}
