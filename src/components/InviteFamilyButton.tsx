import { useEffect, useRef, useState } from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Share,
  Platform,
  Alert,
  Animated,
  Easing,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { colors, spacing, radius, shadow, touch, gradients } from '@/theme';
import type { RelationshipType, ClosenessLevel, Invitation } from '@/types/models';

interface RelationOption { label: string; type: RelationshipType }
interface RelationGroup { title: string; emoji: string; options: RelationOption[] }

// Anzeigelabel + nächstliegender (gültiger) Beziehungstyp für die Verknüpfung.
const RELATION_GROUPS: RelationGroup[] = [
  {
    title: 'Enge Familie',
    emoji: '👨‍👩‍👧‍👦',
    options: [
      { label: 'Mutter', type: 'mutter' },
      { label: 'Vater', type: 'vater' },
      { label: 'Schwester', type: 'schwester' },
      { label: 'Bruder', type: 'bruder' },
      { label: 'Tochter', type: 'tochter' },
      { label: 'Sohn', type: 'sohn' },
      { label: 'Oma', type: 'oma' },
      { label: 'Opa', type: 'opa' },
    ],
  },
  {
    title: 'Partner',
    emoji: '❤️',
    options: [
      { label: 'Partner/in', type: 'lebenspartner' },
      { label: 'Ehepartner/in', type: 'ehepartner' },
    ],
  },
  {
    title: 'Patchwork-Familie',
    emoji: '🔄',
    options: [
      { label: 'Stiefmutter', type: 'stiefmutter' },
      { label: 'Stiefvater', type: 'stiefvater' },
      { label: 'Stiefschwester', type: 'schwester' },
      { label: 'Stiefbruder', type: 'bruder' },
      { label: 'Halbschwester', type: 'schwester' },
      { label: 'Halbbruder', type: 'bruder' },
    ],
  },
  {
    title: 'Erweiterte Familie',
    emoji: '🌳',
    options: [
      { label: 'Tante', type: 'tante' },
      { label: 'Onkel', type: 'onkel' },
      { label: 'Cousine', type: 'cousine' },
      { label: 'Cousin', type: 'cousin' },
      { label: 'Nichte', type: 'nichte' },
      { label: 'Neffe', type: 'neffe' },
      { label: 'Schwägerin', type: 'sonstige' },
      { label: 'Schwager', type: 'sonstige' },
      { label: 'Patentante', type: 'tante' },
      { label: 'Patenonkel', type: 'onkel' },
    ],
  },
  {
    title: 'Adoption & Pflege',
    emoji: '💜',
    options: [
      { label: 'Adoptivmutter', type: 'mutter' },
      { label: 'Adoptivvater', type: 'vater' },
      { label: 'Adoptivschwester', type: 'schwester' },
      { label: 'Adoptivbruder', type: 'bruder' },
      { label: 'Pflegeeltern', type: 'sonstige' },
      { label: 'Pflegekind', type: 'pflegekind' },
    ],
  },
  {
    title: 'Sonstige',
    emoji: '✨',
    options: [{ label: 'Sonstige Person', type: 'sonstige' }],
  },
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

  const [selected, setSelected] = useState<RelationOption | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ 'Enge Familie': true });
  const [closeness, setCloseness] = useState<ClosenessLevel>('familie');
  const [creating, setCreating] = useState(false);
  const [invite, setInvite] = useState<{ link: string; message: string; relLabel: string } | null>(null);

  const inviterName = profileQuery.data?.full_name ?? 'Ein Familienmitglied';
  const inviterPersonId = personsQuery.data?.find((p) => p.user_id === userId)?.id ?? null;

  function toggleGroup(title: string) {
    setOpenGroups((g) => ({ ...g, [title]: !g[title] }));
  }
  function reset() {
    setSelected(null);
    setOpenGroups({ 'Enge Familie': true });
    setCloseness('familie');
    setInvite(null);
  }
  function close() {
    reset();
    onClose();
  }

  async function createLink() {
    if (!selected) return;
    const rel = selected;
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
                {selected ? (
                  <AppText variant="caption" color={colors.primary}>Ausgewählt: {selected.label}</AppText>
                ) : null}
                {RELATION_GROUPS.map((group) => {
                  const open = !!openGroups[group.title];
                  return (
                    <View key={group.title} style={styles.group}>
                      <Pressable style={styles.groupHeader} onPress={() => toggleGroup(group.title)}>
                        <AppText variant="bodyStrong" style={styles.flex}>
                          {group.emoji}  {group.title}
                        </AppText>
                        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
                      </Pressable>
                      {open ? (
                        <View style={styles.chips}>
                          {group.options.map((o) => (
                            <Chip
                              key={o.label}
                              label={o.label}
                              selected={selected?.label === o.label}
                              onPress={() => setSelected(o)}
                            />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}

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
                  disabled={!selected}
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
export function InviteFamilyButton({ variant }: { variant?: 'primary' | 'secondary' }) {
  void variant; // einheitlicher Premium-Stil
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(0);

  const shine = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;

  // Shiny-Effekt: ~1,2 s Lauf, dann Pause (alle ~5 s). JS-Driver, damit es
  // auch im Web (react-native-web) zuverlässig sichtbar läuft.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(3800),
        Animated.timing(shine, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(shine, { toValue: 0, duration: 0, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shine]);

  const animatePress = (to: number) =>
    Animated.spring(press, { toValue: to, useNativeDriver: false, friction: 6, tension: 140 }).start();

  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] });
  const shineW = 90;
  const translateX = shine.interpolate({ inputRange: [0, 1], outputRange: [-shineW, (width || 320) + shineW] });
  const shineOpacity = shine.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.85, 0.85, 0] });

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  return (
    <>
      <Animated.View style={[styles.glowWrap, { transform: [{ scale }] }]}>
        <Pressable
          onPress={() => setOpen(true)}
          onPressIn={() => animatePress(1)}
          onPressOut={() => animatePress(0)}
          onHoverIn={() => animatePress(1)}
          onHoverOut={() => animatePress(0)}
          onLayout={onLayout}
          accessibilityRole="button"
          accessibilityLabel="Familienmitglied einladen"
          style={styles.premiumBtn}
        >
          {/* Verlaufsfüllung lt. Mockup (Flieder -> Periwinkle -> Blau) */}
          <LinearGradient
            colors={gradients.brand as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* statischer heller Schimmer oben – hebt den Button optisch ab */}
          <View pointerEvents="none" style={styles.sheen} />

          <Ionicons name="person-add-outline" size={20} color={colors.textOnAccent} style={styles.btnIcon} />
          <AppText variant="button" color={colors.textOnAccent}>Familienmitglied einladen</AppText>

          {/* Dezente Lichtreflexion (läuft langsam von links nach rechts) */}
          <Animated.View pointerEvents="none" style={[styles.shine, { width: shineW, opacity: shineOpacity, transform: [{ translateX }, { skewX: '-18deg' }] }]} />
        </Pressable>
      </Animated.View>
      <InviteSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  // Premium-Trigger
  glowWrap: {
    borderRadius: 30,
    backgroundColor: '#5B7CFF',
    // Weicher, farbpassender Glow (Blau) – passend zum Verlauf, kein Gelb.
    shadowColor: '#5B7CFF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 34,
    elevation: 8,
  },
  premiumBtn: {
    minHeight: touch.minHeight,
    borderRadius: 30,
    // Keine Border: der Verlauf (absoluteFill) füllt randlos bis zur Rundung.
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btnIcon: { marginRight: spacing.sm },
  // statischer, heller Gold-Schimmer oben (dezenter „Verlauf")
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  shine: {
    position: 'absolute',
    top: -24,
    bottom: -24,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
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
  group: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingTop: spacing.xs },
  cta: { marginTop: spacing.md },
  preview: { backgroundColor: colors.surfaceAlt, gap: spacing.xs, marginVertical: spacing.md },
  linkBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  flex: { flex: 1 },
  note: { marginTop: spacing.md },
});
