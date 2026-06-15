import React, { ReactNode } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';

interface State {
  error: Error | null;
}

/**
 * Fängt Render-Fehler ab und zeigt die Meldung sichtbar auf dem Bildschirm
 * (statt nur weißem Screen). Hilfreich für die Web-Vorschau-Diagnose.
 */
export class ErrorBoundary extends React.Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('Foreverly ErrorBoundary:', error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Es ist ein Fehler aufgetreten</Text>
          <Text style={styles.label}>Meldung:</Text>
          <Text style={styles.message}>{error.message || String(error)}</Text>
          {error.stack ? (
            <>
              <Text style={styles.label}>Details:</Text>
              <Text style={styles.stack}>{error.stack}</Text>
            </>
          ) : null}
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBF6EE' },
  content: { padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#B4524A' },
  label: { fontSize: 16, fontWeight: '700', color: '#3A2F24', marginTop: 8 },
  message: { fontSize: 16, color: '#3A2F24' },
  stack: { fontSize: 12, color: '#6F6253', fontFamily: 'monospace' },
});
