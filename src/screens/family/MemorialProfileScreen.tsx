import { useMemo, useState, type ReactNode } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Screen,
  AppText,
  Card,
  Button,
  Avatar,
  SignedImage,
  TextField,
  Loading,
  EmptyState,
} from '@/components';
import { getPerson } from '@/api/persons';
import { listPhotos, uploadPhoto } from '@/api/media';
import { listMemories } from '@/api/memories';
import {
  listQuotes,
  addQuote,
  listTributes,
  addTribute,
  uploaderName,
} from '@/api/memorial';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { useImagePicker } from '@/hooks/useImagePicker';
import { fullName, formatDate } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { colors, spacing, radius, withAlpha } from '@/theme';
import type { FamilyStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<FamilyStackParamList, 'MemorialProfile'>;

export function MemorialProfileScreen({ navigation, route }: Props) {
  const { personId } = route.params;
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();
  const { pickFromLibrary } = useImagePicker();

  const personQuery = useQuery({ queryKey: qk.person(personId), queryFn: () => getPerson(personId) });
  const galleryQuery = useQuery({
    queryKey: qk.photos(familyId, personId),
    queryFn: () => listPhotos(familyId, { personId }),
  });
  const quotesQuery = useQuery({ queryKey: qk.personQuotes(personId), queryFn: () => listQuotes(personId) });
  const tributesQuery = useQuery({ queryKey: qk.personTributes(personId), queryFn: () => listTributes(personId) });
  const memoriesQuery = useQuery({
    queryKey: qk.memories(familyId, personId),
    queryFn: () => listMemories(familyId, personId),
  });

  const person = personQuery.data;

  const [tributeText, setTributeText] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [quoteContext, setQuoteContext] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addTributeMutation = useMutation({
    mutationFn: () =>
      addTribute({ familyId, personId, text: tributeText.trim(), authorUserId: userId ?? null }),
    onSuccess: () => {
      setTributeText('');
      queryClient.invalidateQueries({ queryKey: qk.personTributes(personId) });
    },
    onError: (e) => setError(friendlyError(e)),
  });

  const addQuoteMutation = useMutation({
    mutationFn: () =>
      addQuote({
        familyId,
        personId,
        text: quoteText.trim(),
        context: quoteContext.trim() || null,
        addedByUserId: userId ?? null,
      }),
    onSuccess: () => {
      setQuoteText('');
      setQuoteContext('');
      queryClient.invalidateQueries({ queryKey: qk.personQuotes(personId) });
    },
    onError: (e) => setError(friendlyError(e)),
  });

  const addPhotoMutation = useMutation({
    mutationFn: async () => {
      const picked = await pickFromLibrary();
      if (!picked) return null;
      return uploadPhoto({
        familyId,
        uploadedBy: userId!,
        localUri: picked.uri,
        personId,
        width: picked.width,
        height: picked.height,
      });
    },
    onSuccess: (res) => {
      if (res) queryClient.invalidateQueries({ queryKey: qk.photos(familyId, personId) });
    },
    onError: (e) => setError(friendlyError(e)),
  });

  // Lebensweg: Geburt → Erinnerungen (mit Datum) → Abschied.
  const timeline = useMemo(() => {
    if (!person) return [] as { key: string; label: string; date: string; icon: 'leaf' | 'star' | 'heart' }[];
    const items: { key: string; label: string; date: string; icon: 'leaf' | 'star' | 'heart' }[] = [];
    if (person.birth_date) {
      items.push({ key: 'birth', label: `Geboren${person.birth_place ? ` in ${person.birth_place}` : ''}`, date: person.birth_date, icon: 'leaf' });
    }
    for (const m of memoriesQuery.data ?? []) {
      if (m.occurred_on) items.push({ key: `m-${m.id}`, label: m.title, date: m.occurred_on, icon: 'star' });
    }
    if (person.death_date) {
      items.push({ key: 'death', label: 'In liebevoller Erinnerung', date: person.death_date, icon: 'heart' });
    }
    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [person, memoriesQuery.data]);

  if (personQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Familienerbe wird geladen …" />
      </Screen>
    );
  }
  if (!person) {
    return (
      <Screen>
        <EmptyState icon="heart-outline" title="Profil nicht gefunden" message="Dieses Profil existiert nicht mehr." />
      </Screen>
    );
  }

  const name = fullName(person.first_name, person.last_name);
  const years = [person.birth_date, person.death_date]
    .map((d) => (d ? new Date(d).getFullYear() : null))
    .filter((y): y is number => y != null)
    .join(' – ');
  const gallery = galleryQuery.data ?? [];
  const quotes = quotesQuery.data ?? [];
  const tributes = tributesQuery.data ?? [];

  return (
    <Screen>
      {/* Profilkopf */}
      <View style={styles.head}>
        {person.avatar_url ? (
          <SignedImage bucket="photos" path={person.avatar_url} style={styles.bigAvatar} />
        ) : (
          <Avatar name={name} size={120} />
        )}
        <AppText variant="display" center>{name}</AppText>
        {years ? (
          <AppText variant="body" color={colors.textSecondary} center>{years}</AppText>
        ) : null}
        <View style={styles.badge}>
          <AppText variant="label" color={colors.bronze}>❤️ Familienerbe</AppText>
        </View>
        <AppText variant="caption" color={colors.textMuted} center style={styles.subtitle}>
          Bewahrt in der Familiengeschichte – für kommende Generationen.
        </AppText>
      </View>

      {/* Galerie */}
      <Section title="Galerie" icon="images-outline" onAction={() => addPhotoMutation.mutate()} actionLabel="Foto" busy={addPhotoMutation.isPending}>
        {gallery.length === 0 ? (
          <Card>
            <AppText variant="body" color={colors.textSecondary}>Noch keine Fotos. Füge das erste Foto hinzu.</AppText>
          </Card>
        ) : (
          <View style={styles.galleryGrid}>
            {gallery.map((ph) => (
              <View key={ph.id} style={styles.galleryItem}>
                <SignedImage bucket="photos" path={ph.storage_path} style={styles.galleryImage} />
                {ph.caption ? (
                  <AppText variant="caption" numberOfLines={1} style={styles.galleryCaption}>{ph.caption}</AppText>
                ) : null}
                <AppText variant="caption" color={colors.textMuted} numberOfLines={1}>
                  Hochgeladen von {uploaderName(ph.uploaded_by)}
                </AppText>
              </View>
            ))}
          </View>
        )}
      </Section>

      {/* Zitate */}
      <Section title="Was sie oft gesagt hat" icon="chatbubble-ellipses-outline">
        {quotes.map((q) => (
          <Card key={q.id} style={styles.quoteCard}>
            <AppText variant="bodyStrong" style={styles.quoteText}>„{q.text}"</AppText>
            {q.context ? (
              <AppText variant="caption" color={colors.textSecondary}>{q.context}</AppText>
            ) : null}
            <AppText variant="caption" color={colors.textMuted}>Hinzugefügt von {q.added_by_name}</AppText>
          </Card>
        ))}
        <Card style={styles.addCard}>
          <TextField
            label="Zitat hinzufügen"
            value={quoteText}
            onChangeText={setQuoteText}
            placeholder="z. B. Wer rastet, der rostet."
          />
          <TextField
            label="Anlass (optional)"
            value={quoteContext}
            onChangeText={setQuoteContext}
            placeholder="z. B. sagte er beim Sonntagskaffee"
          />
          <Button
            label="Zitat speichern"
            icon="add-outline"
            variant="secondary"
            loading={addQuoteMutation.isPending}
            onPress={() => {
              setError(null);
              if (!quoteText.trim()) { setError('Bitte gib ein Zitat ein.'); return; }
              addQuoteMutation.mutate();
            }}
          />
        </Card>
      </Section>

      {/* Erinnerungen an diese Person */}
      <Section title="Erinnerungen an diese Person" icon="heart-outline">
        {tributes.map((t) => (
          <Card key={t.id} style={styles.tributeCard}>
            <AppText variant="body">{t.text}</AppText>
            <AppText variant="caption" color={colors.textMuted}>— {t.author_name}</AppText>
          </Card>
        ))}
        <Card style={styles.addCard}>
          <TextField
            label="Erinnerung hinterlassen"
            value={tributeText}
            onChangeText={setTributeText}
            placeholder="Ich erinnere mich noch daran, wie …"
            multiline
            numberOfLines={4}
            style={styles.tributeInput}
          />
          <Button
            label="Erinnerung hinzufügen"
            icon="add-outline"
            variant="secondary"
            loading={addTributeMutation.isPending}
            onPress={() => {
              setError(null);
              if (!tributeText.trim()) { setError('Bitte schreibe eine Erinnerung.'); return; }
              addTributeMutation.mutate();
            }}
          />
        </Card>
      </Section>

      {/* Lebensgeschichte */}
      {person.biography ? (
        <Section title="Lebensgeschichte" icon="book-outline">
          <Card><AppText variant="body" color={colors.textSecondary}>{person.biography}</AppText></Card>
        </Section>
      ) : null}

      {/* Besonderheiten */}
      {person.traits ? (
        <Section title="Besonderheiten" icon="sparkles-outline">
          <Card><AppText variant="body" color={colors.textSecondary}>{person.traits}</AppText></Card>
        </Section>
      ) : null}

      {/* Zeitstrahl */}
      {timeline.length > 0 ? (
        <Section title="Zeitstrahl" icon="time-outline">
          <Card>
            {timeline.map((e, i) => (
              <View key={e.key} style={[styles.timelineRow, i > 0 && styles.timelineDivider]}>
                <View style={styles.timelineDate}>
                  <AppText variant="caption" color={colors.primaryDark}>{new Date(e.date).getFullYear()}</AppText>
                </View>
                <Ionicons name={e.icon === 'leaf' ? 'leaf-outline' : e.icon === 'heart' ? 'heart' : 'star'} size={16} color={e.icon === 'heart' ? colors.error : colors.gold} />
                <AppText variant="body" style={styles.flex}>{e.label}</AppText>
              </View>
            ))}
          </Card>
        </Section>
      ) : null}

      {error ? <AppText variant="caption" color={colors.error} center>{error}</AppText> : null}

      <Button
        label="Profil bearbeiten"
        icon="create-outline"
        variant="ghost"
        onPress={() => navigation.navigate('PersonForm', { personId })}
        style={styles.editBtn}
      />
    </Screen>
  );
}

function Section({
  title,
  icon,
  onAction,
  actionLabel,
  busy,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
  actionLabel?: string;
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <AppText variant="bodyStrong" style={styles.flex}>{title}</AppText>
        {onAction ? (
          <Pressable onPress={busy ? undefined : onAction} hitSlop={8} style={styles.sectionAction}>
            <Ionicons name="add-circle" size={18} color={colors.primary} />
            <AppText variant="caption" color={colors.primary}>{busy ? '…' : actionLabel}</AppText>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  bigAvatar: { width: 120, height: 120, borderRadius: 60 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.goldSoft, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: 4, marginTop: spacing.xs,
  },
  subtitle: { maxWidth: 300 },

  section: { gap: spacing.sm, marginBottom: spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  galleryItem: { width: '48%', gap: 2 },
  galleryImage: { width: '100%', height: 130, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  galleryCaption: { marginTop: 2 },

  quoteCard: { gap: 4, borderLeftWidth: 3, borderLeftColor: colors.gold },
  quoteText: { fontStyle: 'italic' },
  tributeCard: { gap: spacing.xs, backgroundColor: withAlpha(colors.gold, 0.06) },

  addCard: { gap: spacing.sm, backgroundColor: colors.surfaceAlt },
  tributeInput: { minHeight: 96, textAlignVertical: 'top' },

  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  timelineDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  timelineDate: { width: 48 },

  editBtn: { marginTop: spacing.sm },
});
