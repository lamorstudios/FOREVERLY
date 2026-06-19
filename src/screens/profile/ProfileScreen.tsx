import { View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Screen,
  AppText,
  Button,
  Card,
  Avatar,
  Chip,
  Loading,
  SectionHeader,
  InviteFamilyButton,
} from '@/components';
import { SignedImage } from '@/components/SignedImage';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '@/api/profiles';
import { qk } from '@/api/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { useFamily } from '@/context/FamilyContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { colors, spacing } from '@/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { userId, signOut } = useAuth();
  const { activeFamily, families, setActiveFamily } = useFamily();
  const { restartIntro } = useOnboarding();

  const profileQuery = useQuery({
    queryKey: qk.profile(userId!),
    queryFn: () => getProfile(userId!),
  });

  function handleSignOut() {
    Alert.alert(
      'Abmelden',
      'Möchtest du dich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: () => {
            void signOut();
          },
        },
      ],
    );
  }

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <Loading message="Profil wird geladen …" />
      </Screen>
    );
  }

  const profile = profileQuery.data;

  return (
    <Screen
      refreshing={profileQuery.isRefetching}
      onRefresh={() => {
        void profileQuery.refetch();
      }}
    >
      <View style={styles.header}>
        {profile?.avatar_url ? (
          <SignedImage
            bucket="avatars"
            path={profile.avatar_url}
            style={styles.avatar}
          />
        ) : (
          <Avatar name={profile?.full_name} size={120} />
        )}
        <AppText variant="title" center style={styles.name}>
          {profile?.full_name ?? 'Mein Profil'}
        </AppText>
        {profile?.email ? (
          <AppText variant="caption" center color={colors.textSecondary}>
            {profile.email}
          </AppText>
        ) : null}
        {profile?.bio ? (
          <AppText variant="body" center style={styles.bio}>
            {profile.bio}
          </AppText>
        ) : null}
      </View>

      <View style={styles.actions}>
        <InviteFamilyButton />

        <Card onPress={() => navigation.navigate('EditProfile')}>
          <View style={styles.row}>
            <Ionicons
              name="person-circle-outline"
              size={32}
              color={colors.primary}
            />
            <AppText variant="bodyStrong" style={styles.rowLabel}>
              Profil bearbeiten
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textMuted}
            />
          </View>
        </Card>

        <Card onPress={() => navigation.navigate('FamilySettings')}>
          <View style={styles.row}>
            <Ionicons name="people-outline" size={32} color={colors.primary} />
            <AppText variant="bodyStrong" style={styles.rowLabel}>
              Familie verwalten
            </AppText>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textMuted}
            />
          </View>
        </Card>

        <Card onPress={() => navigation.navigate('Settings')}>
          <View style={styles.row}>
            <Ionicons name="settings-outline" size={32} color={colors.primary} />
            <View style={styles.rowLabel}>
              <AppText variant="bodyStrong">Einstellungen</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Premium · Rollen · Datenschutz · Feedback
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
          </View>
        </Card>

        <Card onPress={() => navigation.navigate('VaultHub')}>
          <View style={styles.row}>
            <Ionicons name="file-tray-full-outline" size={32} color={colors.primary} />
            <View style={styles.rowLabel}>
              <AppText variant="bodyStrong">Dokumente & Nachlass</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Family Vault · Vermächtnisse · Vertrauenspersonen
              </AppText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textMuted}
            />
          </View>
        </Card>

        <Card onPress={restartIntro}>
          <View style={styles.row}>
            <Ionicons name="help-buoy-outline" size={32} color={colors.primary} />
            <View style={styles.rowLabel}>
              <AppText variant="bodyStrong">Hilfe & Einführung erneut starten</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Vollbild-Onboarding & interaktive Tour neu abspielen
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
          </View>
        </Card>
      </View>

      {families.length > 1 ? (
        <View style={styles.section}>
          <SectionHeader title="Familie wechseln" />
          {families.map(({ family, role }) => {
            const isActive = activeFamily?.id === family.id;
            return (
              <Card key={family.id} onPress={() => setActiveFamily(family.id)}>
                <View style={styles.row}>
                  <Ionicons
                    name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
                    size={32}
                    color={isActive ? colors.success : colors.textMuted}
                  />
                  <AppText variant="bodyStrong" style={styles.rowLabel}>
                    {family.name}
                  </AppText>
                  <Chip
                    label={role === 'admin' ? 'Admin' : 'Mitglied'}
                    selected
                    color={role === 'admin' ? colors.gold : colors.primary}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      ) : null}

      <View style={styles.signOut}>
        <Button
          label="Abmelden"
          icon="log-out-outline"
          variant="danger"
          onPress={handleSignOut}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  name: { marginTop: spacing.sm },
  bio: { marginTop: spacing.xs },
  actions: { gap: spacing.md },
  section: { marginTop: spacing.xl, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowLabel: { flex: 1 },
  signOut: { marginTop: spacing.xxl },
});
