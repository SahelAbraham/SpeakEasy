import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AppLogo } from '../../components/AppLogo';
import { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Navigation>();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <AppLogo size={96} style={styles.logo} />
        <Text style={styles.brand}>SpeakEasy</Text>
        <Text style={styles.tagline}>Speech Therapy made Accessible.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.primaryButtonText}>Sign in</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.secondaryButtonText}>Create account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'space-between',
  },
  hero: {
    marginTop: 48,
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    marginBottom: 8,
  },
  brand: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  tagline: {
    fontSize: 18,
    lineHeight: 26,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '600',
  },
});
