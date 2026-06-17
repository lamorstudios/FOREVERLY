import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  AppText,
  Button,
  Card,
  TextField,
  SelectField,
} from '@/components';
import type { SelectOption } from '@/components';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { listPersons, createPerson, createRelationship } from '@/api/persons';
import {
  createSmartInvite,
  buildSmartInviteLink,
  acceptSmartInviteDemo,
} from '@/api/smartInvites';
import { generateSuggestions } from '@/api/suggestions';
import { openWhatsApp, openEmail, copyText, shareText } from '@/lib/share';
import { notify } from '@/lib/confirm';
import { qk } from '@/api/queryKeys';
import {
  RELATIONSHIP_LABELS,
  RELATIONSHIP_TYPE_OPTIONS,
  DEFAULT_CATEGORY_FOR_TYPE,
} from '@/constants/relationships';
import { CLOSENESS_LEVELS, CLOSENESS_ORDER, SUGGESTED_CLOSENESS } from '@/constants/closeness';
import { fullName } from '@/lib/format';
import { friendlyError } from '@/lib/errors';
import { colors, radius, spacing } from '@/theme';
import type { FamilyStackParamList } from '@/navigation/types';
import type { Invitation, RelationshipType, ClosenessLevel, MemberRole } from '@/types/models';

type Props = NativeStackScreenProps<FamilyStackParamList, 'SmartInvite'>;

const NEW_PERSON = '__new__';

export function SmartInviteScreen({ navigation, route }: Props) {
  const { activeFamily } = useFamily();
  const { userId } = useAuth();
  const familyId = activeFamily!.id;
  const queryClient = useQueryClient();
  const lockedPersonId = route.params?.personId;

  const personsQuery = useQuery({ queryKey: qk.persons(familyId), queryFn: () => listPersons(familyId) });
  const persons = personsQuery.data ?? [];
  const myPerson = persons.find((p) => p.user_id === userId);

  const [target, setTarget] = useState<string | null>(lockedPersonId ?? null);
  const [newName, setNewName] = useState('');
  const [relType, setRelType] = useState<RelationshipType>('bruder');
  const [closeness, setCloseness] = useState<ClosenessLevel>('familie');
  const [role, setRole] = useState<MemberRole>('member');
  const [message, setMessage] = useState(
    'Ich lade dich ein, Teil unserer Familiengeschichte auf FAMII zu werden. 💛',
  );
  const [result, setResult] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const personOptions: SelectOption<string>[] = [
    ...persons
      .filter((p) => !p.user_id && p.id !== myPerson?.id)
      .map((p) => ({ value: p.id, label: fullName(p.first_name, p.last_name) })),
    { value: NEW_PERSON, label: '➕ Neue Person anlegen' },
  ];

  const relOptions: SelectOption<RelationshipType>[] = RELATIONSHIP_TYPE_OPTIONS.map((t) => ({
    value: t,
    label: RELATIONSHIP_LABELS[t],
  }));
  const closenessOptions: SelectOption<ClosenessLevel>[] = CLOSENESS_ORDER.map((l) => ({
    value: l,
    label: `${CLOSENESS_LEVELS[l].emoji} ${CLOSENESS_LEVELS[l].label}`,
  }));

  function onRelChange(t: RelationshipType) {
    setRelType(t);
    setCloseness(SUGGESTED_CLOSENESS[t] ?? 'familie');
  }

  const lockedPerson = lockedPersonId ? persons.find((p) => p.id === lockedPersonId) : null;

  const createMutation = useMutation({
    mutationFn: async () => {
      let personId = lockedPersonId ?? (target && target !== NEW_PERSON ? target : null);

      // Falls neue Person: Profil + Beziehung sofort anlegen
      if (!personId) {
        if (!newName.trim()) throw new Error('Bitte gib einen Namen ein oder wähle eine Person.');
        const created = await createPerson(familyId, userId!, { first_name: newName.trim() });
        personId = created.id;
        if (myPerson) {
          await createRelationship({
            family_id: familyId,
            from_person_id: myPerson.id,
            to_person_id: personId,
            type: relType,
            category: DEFAULT_CATEGORY_FOR_TYPE[relType],
            created_by: userId!,
          });
        }
      }

      return createSmartInvite({
        familyId,
        invitedBy: userId!,
        role,
        personId,
        inviterPersonId: myPerson?.id ?? null,
        relationshipType: relType,
        suggestedCloseness: closeness,
        message: message.trim() || null,
      });
    },
    onSuccess: (inv) => {
      setResult(inv);
      queryClient.invalidateQueries({ queryKey: qk.persons(familyId) });
      queryClient.invalidateQueries({ queryKey: qk.relationships(familyId) });
      queryClient.invalidateQueries({ queryKey: qk.smartInvites(familyId) });
    },
    onError: (e) => setError(friendlyError(e)),
  });

  const acceptMutation = useMutation({
    mutationFn: async (code: string) => {
      const inv = await acceptSmartInviteDemo(code);
      await generateSuggestions(familyId, userId!);
      return inv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.persons(familyId) });
      queryClient.invalidateQueries({ queryKey: qk.relationships(familyId) });
      queryClient.invalidateQueries({ queryKey: qk.smartInvites(familyId) });
      queryClient.invalidateQueries({ queryKey: qk.suggestions(familyId) });
      queryClient.invalidateQueries({ queryKey: ['closeness', familyId] });
      Alert.alert(
        'Beigetreten! 🎉',
        'Die eingeladene Person ist der Familie beigetreten und erscheint jetzt korrekt im Familiennetzwerk.',
      );
    },
    onError: (e) => Alert.alert('Fehler', friendlyError(e)),
  });

  function inviteText(inv: Invitation): string {
    const link = buildSmartInviteLink(inv.code);
    return `${inv.message ?? 'Du bist eingeladen, Teil unserer Familie auf FAMII zu werden.'}\n\n${link}`;
  }
  function shareLink(inv: Invitation) {
    void shareText(inviteText(inv));
  }
  async function copyLink(inv: Invitation) {
    const ok = await copyText(buildSmartInviteLink(inv.code));
    notify('Einladungslink', ok ? 'Link in die Zwischenablage kopiert.' : buildSmartInviteLink(inv.code));
  }

  // Ergebnis-Ansicht
  if (result) {
    const link = buildSmartInviteLink(result.code);
    const name = result.person_id
      ? fullName(persons.find((p) => p.id === result.person_id)?.first_name, persons.find((p) => p.id === result.person_id)?.last_name)
      : 'dein Familienmitglied';
    return (
      <Screen contentStyle={styles.content}>
        <Card style={styles.invite}>
          <Ionicons name="heart" size={40} color={colors.gold} />
          <AppText variant="title" center color={colors.primaryDark}>
            Einladung erstellt
          </AppText>
          <AppText variant="body" center color={colors.textSecondary}>
            {result.message}
          </AppText>
          <View style={styles.linkBox}>
            <AppText variant="caption" color={colors.textMuted}>
              Einladungslink
            </AppText>
            <AppText variant="bodyStrong" color={colors.primaryDark}>
              {link}
            </AppText>
          </View>
        </Card>

        <View style={styles.shareRow}>
          <View style={styles.shareCell}>
            <Button label="WhatsApp" icon="logo-whatsapp" variant="secondary" onPress={() => openWhatsApp(inviteText(result))} />
          </View>
          <View style={styles.shareCell}>
            <Button label="E-Mail" icon="mail-outline" variant="secondary" onPress={() => openEmail('Einladung zu FAMII', inviteText(result))} />
          </View>
          <View style={styles.shareCell}>
            <Button label="Link kopieren" icon="copy-outline" variant="secondary" onPress={() => copyLink(result)} />
          </View>
        </View>
        <Button label="Einladung teilen" icon="share-social-outline" onPress={() => shareLink(result)} />
        <Button
          label="Einladung annehmen (Vorschau)"
          icon="checkmark-done-outline"
          variant="secondary"
          loading={acceptMutation.isPending}
          onPress={() => acceptMutation.mutate(result.code)}
        />
        <AppText variant="caption" color={colors.textMuted} center>
          „{name}" wird nach der Registrierung automatisch mit dem Profil
          verknüpft und erhält die Familiennähe {CLOSENESS_LEVELS[closeness].emoji}{' '}
          {CLOSENESS_LEVELS[closeness].label} – kein automatischer Vollzugriff.
        </AppText>
        <Button label="Fertig" variant="ghost" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="body" color={colors.textSecondary}>
        Lade ein Familienmitglied per Link ein. Nach der Registrierung erscheint
        es automatisch an der richtigen Stelle im Familiennetzwerk.
      </AppText>

      {lockedPerson ? (
        <Card>
          <AppText variant="caption" color={colors.textMuted}>
            Einladung für
          </AppText>
          <AppText variant="subheading">{fullName(lockedPerson.first_name, lockedPerson.last_name)}</AppText>
        </Card>
      ) : (
        <>
          <SelectField
            label="Wen möchtest du einladen?"
            placeholder="Person wählen oder neu anlegen"
            value={target}
            options={personOptions}
            onChange={setTarget}
          />
          {target === NEW_PERSON ? (
            <TextField label="Name der neuen Person" value={newName} onChangeText={setNewName} placeholder="z. B. Max" />
          ) : null}
        </>
      )}

      <SelectField label="Beziehung zu dir" value={relType} options={relOptions} onChange={onRelChange} />
      <SelectField label="Vorgeschlagene Familiennähe" value={closeness} options={closenessOptions} onChange={setCloseness} />
      <SelectField
        label="Rolle"
        value={role}
        options={[
          { value: 'member', label: 'Familienmitglied' },
          { value: 'admin', label: 'Administrator' },
        ]}
        onChange={setRole}
      />
      <TextField label="Persönliche Nachricht" value={message} onChangeText={setMessage} multiline />

      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : null}

      <Button label="Einladungslink erstellen" icon="link-outline" onPress={() => createMutation.mutate()} loading={createMutation.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingTop: spacing.md },
  shareRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  shareCell: { flexGrow: 1, flexBasis: '30%' },
  invite: { alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surfaceAlt },
  linkBox: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 2,
  },
});
