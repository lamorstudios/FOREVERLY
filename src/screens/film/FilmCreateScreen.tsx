import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppText, Button, Card, SelectField, TextField } from '@/components';
import type { SelectOption } from '@/components';
import { listPersons } from '@/api/persons';
import { listEvents } from '@/api/familyEvents';
import { createFilmProject } from '@/api/film';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { fullName } from '@/lib/format';
import { colors, spacing } from '@/theme';
import type { HomeStackParamList } from '@/navigation/types';
import type { FilmKind, FilmMusicMood, FilmLock } from '@/types/models';
import { FILM_KIND_META, MUSIC_META, LOCK_META } from './filmMeta';

type Props = NativeStackScreenProps<HomeStackParamList, 'FilmCreate'>;

const KINDS: FilmKind[] = ['event', 'year', 'person', 'documentary', 'legacy'];
const MOODS: FilmMusicMood[] = ['emotional', 'nostalgisch', 'froehlich', 'feierlich', 'dokumentarisch'];
const LOCKS: FilmLock[] = ['none', 'years5', 'years10', 'years20', 'death'];

export function FilmCreateScreen({ navigation, route }: Props) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });
  const eventsQuery = useQuery({ queryKey: qk.events(familyId), queryFn: () => listEvents(familyId) });

  const [kind, setKind] = useState<FilmKind>(route.params?.kind ?? 'event');
  const [eventId, setEventId] = useState<string | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [title, setTitle] = useState('');
  const [music, setMusic] = useState<FilmMusicMood>('emotional');
  const [lock, setLock] = useState<FilmLock>('none');
  const [saving, setSaving] = useState(false);

  const kindOptions: SelectOption<FilmKind>[] = KINDS.map((k) => ({ value: k, label: FILM_KIND_META[k].label }));
  const moodOptions: SelectOption<FilmMusicMood>[] = MOODS.map((m) => ({ value: m, label: `${MUSIC_META[m].emoji} ${MUSIC_META[m].label}` }));
  const lockOptions: SelectOption<FilmLock>[] = LOCKS.map((l) => ({ value: l, label: LOCK_META[l] }));
  const personOptions: SelectOption<string>[] = (personsQuery.data ?? []).map((p) => ({ value: p.id, label: fullName(p.first_name, p.last_name) }));
  const eventOptions: SelectOption<string>[] = (eventsQuery.data ?? []).map((e) => ({ value: e.id, label: e.title }));
  const years = Array.from(new Set([new Date().getFullYear(), ...(eventsQuery.data ?? []).map((e) => new Date(e.event_date).getFullYear())])).filter((y) => !Number.isNaN(y)).sort((a, b) => b - a);
  const yearOptions: SelectOption<string>[] = years.map((y) => ({ value: String(y), label: `Familienjahr ${y}` }));

  function onPickEvent(id: string) { setEventId(id); if (!title.trim()) setTitle(eventsQuery.data?.find((e) => e.id === id)?.title ?? ''); }
  function onPickPerson(id: string) { setPersonId(id); if (!title.trim()) { const p = personsQuery.data?.find((x) => x.id === id); setTitle(p ? `${fullName(p.first_name, p.last_name)} – Lebensfilm` : ''); } }

  const needsEvent = kind === 'event';
  const needsPerson = kind === 'person' || kind === 'documentary' || kind === 'legacy';
  const needsYear = kind === 'year';
  const canSave = !!title.trim() && (!needsEvent || !!eventId) && (!needsPerson || kind === 'legacy' || !!personId) && (!needsYear || !!year);

  async function onCreate() {
    if (!canSave) return;
    setSaving(true);
    try {
      const p = await createFilmProject({
        familyId,
        ownerUserId: userId!,
        kind,
        title: title.trim(),
        subtitle: null,
        music,
        lock,
        options: { eventId: needsEvent ? eventId ?? undefined : undefined, personId: needsPerson ? personId ?? undefined : undefined, year: needsYear ? Number(year) : undefined },
      });
      navigation.replace('FilmPlayer', { projectId: p.id });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen tint={colors.tintMemories}>
      <View style={styles.form}>
        <SelectField label="Art des Films" value={kind} options={kindOptions} onChange={(k) => { setKind(k); setTitle(''); }} />
        {needsEvent ? <SelectField label="Ereignis" placeholder="Ereignis wählen" value={eventId} options={eventOptions} onChange={onPickEvent} /> : null}
        {needsPerson ? <SelectField label={kind === 'legacy' ? 'Person (optional)' : 'Person'} placeholder="Person wählen" value={personId} options={personOptions} onChange={onPickPerson} /> : null}
        {needsYear ? <SelectField label="Jahr" value={year} options={yearOptions} onChange={setYear} /> : null}
        <TextField label="Titel" value={title} onChangeText={setTitle} placeholder="z.B. Sommergrillen" />
        <SelectField label="Musik-Stimmung" value={music} options={moodOptions} onChange={setMusic} />
        <SelectField label="Freigabe / Zeitkapsel" value={lock} options={lockOptions} onChange={setLock} />
      </View>

      <Card>
        <AppText variant="caption" color={colors.textSecondary}>
          🔒 Der Film verwendet nur Inhalte, die du sehen darfst. Bei einer Zeitkapsel wird er erst zum
          gewählten Zeitpunkt bzw. nach der Nachlassfreigabe sichtbar.
        </AppText>
      </Card>

      <Button label="Film erstellen" icon="film-outline" loading={saving} disabled={!canSave} onPress={onCreate} style={styles.cta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, marginBottom: spacing.md },
  cta: { marginTop: spacing.md },
});
