import { Image, View, ActivityIndicator, StyleSheet, ImageStyle, StyleProp } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getSignedUrl, BucketName } from '@/lib/storage';
import { qk } from '@/api/queryKeys';
import { colors } from '@/theme';

interface SignedImageProps {
  bucket: BucketName;
  path?: string | null;
  style?: StyleProp<ImageStyle>;
}

/** Bild aus einem privaten Bucket über eine signierte URL anzeigen. */
export function SignedImage({ bucket, path, style }: SignedImageProps) {
  const { data, isLoading } = useQuery({
    queryKey: qk.signedUrl(bucket, path ?? ''),
    queryFn: () => getSignedUrl(bucket, path as string),
    enabled: !!path,
    staleTime: 50 * 60 * 1000, // knapp unter der URL-Gültigkeit
  });

  if (isLoading) {
    return (
      <View style={[styles.placeholder, style]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!data) {
    return <View style={[styles.placeholder, style]} />;
  }

  return <Image source={{ uri: data }} style={style} />;
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
