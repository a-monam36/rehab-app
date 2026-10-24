import React from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import HealthSync from '../components/HealthSync';
import { colors } from '../constants/theme';

/**
 * HomeScreen: The entry point for the Fitness AI Coach.
 * This screen provides a high-level overview and navigation to the rating flow.
 */
export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  // Navigation handler with safety checks
  const handleStartRating = () => {
    if (router) {
      router.push('/rating');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.title}>
            Welcome back!
          </Text>
          <Text variant="titleMedium" style={styles.subtitle}>
            Ready to track your progress?
          </Text>
        </View>

        {/* Primary Action Card */}
        <Card elevation={2} style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Muscle Strength Rating
            </Text>
            <Text variant="bodyMedium" style={styles.cardParagraph}>
              Rate your muscle groups from 1-10 to generate your personalized AI workout plan.
            </Text>
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button 
              mode="contained" 
              onPress={handleStartRating}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Start Rating
            </Button>
          </Card.Actions>
        </Card>

        {/* Recent Activity: daily steps / calories synced from Apple Health or Health Connect */}
        <HealthSync />

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            Pro Tip
          </Text>
          <Text variant="bodySmall" style={styles.tipText}>
            Flag injured areas with Rehab Mode so your AI plan trains around them safely.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: Platform.OS === 'ios' ? 0 : 20,
    marginBottom: 32,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 20,
  },
  cardTitle: {
    fontWeight: '700',
    marginBottom: 8,
    color: colors.textPrimary,
  },
  cardParagraph: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    justifyContent: 'flex-start',
    padding: 16,
  },
  button: {
    borderRadius: 8,
    minWidth: 140,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  tipsSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
  },
  tipText: {
    marginTop: 4,
    color: colors.textSecondary,
  },
});
