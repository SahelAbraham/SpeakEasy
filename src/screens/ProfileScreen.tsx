import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import { useTrackTheme } from '../context/TrackThemeContext';

function initials(username: string): string {
  const parts = username.trim().split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }

  return username.slice(0, 2).toUpperCase();
}

function showPrototypeAlert(action: string) {
  Alert.alert(
    'Coming soon',
    `${action} will be available in a future release.`,
  );
}

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { theme } = useTrackTheme();

  if (!user) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: theme.primary,
            borderColor: theme.primaryLight,
          },
        ]}
      >
        <Text style={styles.avatarText}>
          {initials(user.username)}
        </Text>
      </View>

      <Text
        style={[
          styles.username,
          {
            color: theme.text,
          },
        ]}
      >
        {user.username}
      </Text>

      <Text
        style={[
          styles.email,
          {
            color: theme.textMuted,
          },
        ]}
      >
        {user.email}
      </Text>

      <View style={styles.section}>
        <Pressable
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
            },
          ]}
          onPress={() =>
            showPrototypeAlert('Username reset')
          }
        >
          <Text
            style={[
              styles.actionButtonText,
              {
                color: theme.primary,
              },
            ]}
          >
            Reset username
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
            },
          ]}
          onPress={() =>
            showPrototypeAlert('Password reset')
          }
        >
          <Text
            style={[
              styles.actionButtonText,
              {
                color: theme.primary,
              },
            ]}
          >
            Reset password
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.signOutButton}
        onPress={() => void signOut()}
      >
        <Text style={styles.signOutText}>
          Sign out
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },

  username: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '700',
  },

  email: {
    marginTop: 4,
    fontSize: 16,
  },

  section: {
    marginTop: 32,
    width: '100%',
    gap: 12,
  },

  actionButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },

  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  signOutButton: {
    marginTop: 'auto',
    marginBottom: 32,
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D96B6B',
    backgroundColor: '#FFF8F8',
    alignItems: 'center',
  },

  signOutText: {
    color: '#D96B6B',
    fontSize: 16,
    fontWeight: '600',
  },
});