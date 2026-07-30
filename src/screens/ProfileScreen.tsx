import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

function initials(username: string): string {
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

function showPrototypeAlert(action: string) {
  Alert.alert('Coming soon', `${action} will be available in a future release.`);
}

export function ProfileScreen() {
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(user.username)}</Text>
      </View>

      <Text style={styles.username}>{user.username}</Text>
      <Text style={styles.email}>{user.email}</Text>

      <View style={styles.section}>
        <Pressable
          style={styles.actionButton}
          onPress={() => showPrototypeAlert('Username reset')}
        >
          <Text style={styles.actionButtonText}>Reset username</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => showPrototypeAlert('Password reset')}
        >
          <Text style={styles.actionButtonText}>Reset password</Text>
        </Pressable>
      </View>

      <Pressable style={styles.signOutButton} onPress={() => void signOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  username: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  email: {
    marginTop: 4,
    fontSize: 16,
    color: colors.textMuted,
  },
  section: {
    marginTop: 32,
    width: '100%',
    gap: 12,
  },
  actionButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  signOutButton: {
    marginTop: 'auto',
    marginBottom: 32,
    paddingVertical: 12,
  },
  signOutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
