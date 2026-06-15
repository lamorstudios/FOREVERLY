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
 * Speichert intern als ISO-Datum (YYYY-MM-DD).
 */
export function DateField({ label, value, onChange, error }: DateFieldProps) {
  const display = isoToDisplay(value);

  function handleChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }
    onChange(displayToIso(formatted));
  }

  return (
    <TextField
      label={label}
      value={display}
      onChangeText={handleChange}
      placeholder="TT.MM.JJJJ"
      keyboardType="number-pad"
      maxLength={10}
      error={error}
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
