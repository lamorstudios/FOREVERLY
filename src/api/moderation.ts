/**
 * Moderation: Melden & Blockieren (Grundstruktur).
 * Im Demo-Modus nebenwirkungsarm (lokal protokolliert); im Echtbetrieb in den
 * Tabellen `reports` / `member_blocks` gespeichert (RLS-geschützt).
 */
import { supabase } from '@/lib/supabase';
import { DEMO_MODE } from '@/lib/config';

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'other';
export type ReportTarget = 'user' | 'content';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'inappropriate', label: 'Unangemessener Inhalt' },
  { value: 'harassment', label: 'Belästigung' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Sonstiges' },
];

export interface ReportInput {
  familyId: string;
  reporterId: string;
  targetType: ReportTarget;
  targetId: string;
  reason: ReportReason;
  note?: string;
}

export async function submitReport(input: ReportInput): Promise<void> {
  if (DEMO_MODE) {
    if (typeof console !== 'undefined') console.log('[Moderation · Demo] Meldung', input);
    return;
  }
  const { error } = await supabase.from('reports').insert({
    family_id: input.familyId,
    reporter_id: input.reporterId,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    note: input.note ?? null,
  });
  if (error) throw error;
}

export async function blockMember(input: {
  familyId: string;
  blockerId: string;
  blockedUserId: string;
}): Promise<void> {
  if (DEMO_MODE) {
    if (typeof console !== 'undefined') console.log('[Moderation · Demo] Blockiert', input);
    return;
  }
  const { error } = await supabase.from('member_blocks').insert({
    family_id: input.familyId,
    blocker_id: input.blockerId,
    blocked_user_id: input.blockedUserId,
  });
  if (error) throw error;
}
