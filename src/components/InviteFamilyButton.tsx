import { useState } from 'react';
import { View, Modal, Pressable, StyleSheet, ScrollView, Share, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { AppText } from './AppText';
import { Button } from './Button';
import { Chip } from './Chip';
import { Card } from './Card';
import { listPersons } from '@/api/persons';
import { getProfile } from '@/api/profiles';
import { createSmartInvite, buildSmartInviteLink } from '@/api/smartInvites';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { fullName } from '@/lib/format';
import { colors, spacing, radius, shadow } from '@/theme';
import type { RelationshipType, ClosenessLevel, Invitation } from '@/types/models';

const RELATIONS: { label: string; type: RelationshipType }[] = [
  { label: 'Mutter', type: 'mutter' },
  { label: 'Vater', type: 'vater' },
  { label: 'Schwester', type: 'schwester' },
  { label: 'Bruder', type: 'bruder' },
  { label: 'Tochter', type: 'tochter' },
  { label: 'Sohn', type: 'sohn' },
  { label: 'Oma', type: 'oma' },
  { label: 'Opa', type: 'opa' },
  { label: 'Partner/in', type: 'ehepartner' },
  { label: 'Stiefmutter', type: 'stiefmutter' },
  { label: 'Stiefvater', type: 'stiefvater' },
  { label: 'Halbschwester', type: 'schwester' },
  { label: 'Halbbruder', type: 'bruder' },
  { label: 'Sonstige', type: 'sonstige' },
];

const CLOSENESS: { label: string; value: ClosenessLevel }[] = [
  { label: '❤️ Inner Circle', value: 'inner' },
  { label: '💛 Sehr nah', value: 'sehr_nah' },
  { label: '💙 Familie', value: 'familie' },
  { label: '🤍 Erweiterter Kreis', value: 'erweitert' },
];

interface SheetProps {
  visible: boolean;
  onClose: () => void;
}

function InviteSheet({ visible, onClose }: SheetProps) {
  const { userId } = useAuth();
  const { activeFamily } = useFamily();
  const familyId = activeFamily!.id;

  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId), enabled: visible });
  const profileQuery = useQuery({ queryKey: qk.profile(userId!), queryFn: () => getProfile(userId!), enabled: visible });

  const [relIndex, setRelIndex] = useState<number | null>(null);
  const [closeness, setCloseness] = useState<ClosenessLevel>('familie');
  const [creating, setCreating] = useState(false);
  const [invite, setInvite] = useState<{ link: string; message: string; relLabel: string } | null>(null);

  const inviterName = profileQuery.data?.full_name ?? 'Ein Familienmitglied';
  const inviterPersonId = personsQuery.data?.find((p) => p.user_id === userId)?.id ?? null;

  function reset() {
    setRelIndex(null);
    setCloseness('familie');
    setInvite(null);
  }
  function close() {
    reset();
    onClose();
  }

  async function createLink() {
    if (relIndex === null) return;
    const rel = RELATIONS[relIndex]!;
    setCreating(true);
    try {
      const message = `${inviterName} lädt dich ein, Teil der Familiengeschichte auf Foreverly zu werden. Erstelle dein Profil und bewahrt eure Erinnerungen gemeinsam.`;
      const inv: Invitation = await createSmartInvite({
        familyId,
        invitedBy: userId!,
        role: 'member',
        personId: null,
        inviterPersonId,
        relationshipType: rel.type,
        suggestedCloseness: closeness,
        message,
      });
      const link = `${buildSmartInviteLink(inv.code)}?fam=${familyId}&rel=${rel.type}&closeness=${closeness}`;
      setInvite({ link, message: `${message}\n\n${link}`, relLabel: rel.label });
    } finally {
      setCreating(false);
    }
  }

  async function share() {
    if (!invite) return;
    try {
      await Share.share({ message: invite.message, title: 'Einladung zu Foreverly' });
    } catch {
      /* abgebrochen */
    }
  }

  async function copy() {
    if (!invite) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(invite.link);
      Alert.alert('Kopiert', 'Der Einladungslink wurde in die Zwischenablage kopiert.');
    } else {
      await Share.share({ message: invite.link });
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            {!invite ? (
              <>
                <AppText variant="heading">Familie einladen</AppText>
                <AppText variant="body" color={colors.textSecondary} style={styles.intro}>
                  In 2 Schritten ein neues Familienmitglied einladen.
                </AppText>

                <AppText variant="bodyStrong" style={styles.step}>1 · Wen lädst du ein?</AppText>
                <View style={styles.chips}>
                  {RELATIONS.map((r, i) => (
                    <Chip key={r.label} label={r.label} selected={relIndex === i} onPress={() => setRelIndex(i)} />
                  ))}
                </View>

                <AppText variant="bodyStrong" style={styles.step}>2 · Familiennähe</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Neue Mitglieder erhalten keinen Vollzugriff – nur das, was du freigibst.
                </AppText>
                <View style={styles.chips}>
                  {CLOSENESS.map((c) => (
                    <Chip key={c.value} label={c.label} selected={closeness === c.value} onPress={() => setCloseness(c.value)} />
                  ))}
                </View>

                <Button
                  label="Einladungslink erstellen"
                  icon="link-outline"
                  loading={creating}
                  disabled={relIndex === null}
                  onPress={createLink}
                  style={styles.cta}
                />
              </>
            ) : (
              <>
                <AppText variant="heading">Einladung bereit 💛</AppText>
                <Card style={styles.preview}>
                  <AppText variant="bodyStrong" center>Willkommen bei Foreverly</AppText>
                  <AppText variant="body" center color={colors.textSecondary}>
                    {inviterName} lädt dich ein, als {invite.relLabel} Teil der Familiengeschichte zu werden.
                  </AppText>
                </Card>

                <View style={styles.linkBox}>
                  <Ionicons name="link-outline" size={18} color={colors.textMuted} />
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.flex}>
                    {invite.link}
                  </AppText>
                </View>

                <Button label="Teilen (WhatsApp, SMS, E-Mail …)" icon="share-social-outline" onPress={share} />
                <Button label="Link kopieren" icon="copy-outline" variant="secondary" onPress={copy} style={styles.cta} />
                <Button label="Weitere Person einladen" icon="add-outline" variant="ghost" onPress={reset} />

                <AppText variant="caption" center color={colors.textMuted} style={styles.note}>
                  So läuft es: Link öffnen → registrieren → Profil wird automatisch als „{invite.relLabel}"
                  mit deiner Familie verknüpft. Die Beziehung kann beim Beitritt bestätigt werden.
                </AppText>
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Prominenter „Familie einladen"-Button mit 2-Schritt-Einladungsflow. */
export function InviteFamilyButton({ variant = 'primary' }: { variant?: 'primary' | 'secondary' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button label="Familienmitglied einladen" icon="person-add-outline" variant={variant} onPress={() => setOpen(true)} />
      <InviteSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    maxHeight: '85%',
    ...shadow.floating,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: spacing.md },
  intro: { marginBottom: spacing.md },
  step: { marginTop: spacing.md, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  cta: { marginTop: spacing.md },
  preview: { backgroundColor: colors.surfaceAlt, gap: spacing.xs, marginVertical: spacing.md },
  linkBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  flex: { flex: 1 },
  note: { marginTop: spacing.md },
});
