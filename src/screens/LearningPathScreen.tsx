import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  Track,
  useTrackTheme,
} from '../context/TrackThemeContext';

type TrackData = {
  title: string;
  description: string;
  icon: 'bulb-outline' | 'mic-outline';
  subtracks: {
    title: string;
    description: string;
    icon:
      | 'bulb-outline'
      | 'sparkles-outline'
      | 'pulse-outline'
      | 'volume-medium-outline';
  }[];
};

const TRACKS: Record<Track, TrackData> = {
  Language: {
    title: 'Language',
    description:
      'Improve your cognitive ability and memory.',
    icon: 'bulb-outline',

    subtracks: [
      {
        title: 'Memory',
        description:
          'Strengthen recall, retention, and working memory.',
        icon: 'bulb-outline',
      },
      {
        title: 'Cognitive Ability',
        description:
          'Build attention, processing, and reasoning skills.',
        icon: 'sparkles-outline',
      },
    ],
  },

  Speech: {
    title: 'Speech',
    description:
      'Improve your physical motor skills, fluency, and vocal hygiene.',
    icon: 'mic-outline',

    subtracks: [
      {
        title: 'Motor Skills & Fluency',
        description:
          'Practice coordination, articulation, and fluent speech.',
        icon: 'pulse-outline',
      },
      {
        title: 'Vocal Hygiene',
        description:
          'Build healthy habits for your voice and speaking.',
        icon: 'volume-medium-outline',
      },
    ],
  },
};

export function LearningPathScreen() {
  const {
    selectedTrack,
    setSelectedTrack,
    theme,
  } = useTrackTheme();

  const track = TRACKS[selectedTrack];

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}

      <Text
        style={[
          styles.title,
          {
            color: theme.text,
          },
        ]}
      >
        Your Learning Path
      </Text>

      <Text
        style={[
          styles.subtitle,
          {
            color: theme.textMuted,
          },
        ]}
      >
        Choose the area you want to focus on. You can
        switch between tracks whenever you want.
      </Text>

      {/* Track selector */}

      <View style={styles.trackSelector}>
        {(Object.keys(TRACKS) as Track[]).map(
          (trackName) => {
            const isSelected =
              selectedTrack === trackName;

            const trackData = TRACKS[trackName];

            return (
              <Pressable
                key={trackName}
                style={[
                  styles.trackOption,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                  isSelected && {
                    backgroundColor: theme.primaryLight,
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() =>
                  setSelectedTrack(trackName)
                }
              >
                <View
                  style={[
                    styles.trackIcon,
                    {
                      backgroundColor:
                        theme.iconBackground,
                    },
                    isSelected && {
                      backgroundColor: theme.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name={trackData.icon}
                    size={25}
                    color={
                      isSelected
                        ? theme.primaryDark
                        : theme.textMuted
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.trackTitle,
                    {
                      color: theme.text,
                    },
                    isSelected && {
                      color: theme.primaryDark,
                    },
                  ]}
                >
                  {trackName}
                </Text>

                <Text
                  style={[
                    styles.trackDescription,
                    {
                      color: theme.textMuted,
                    },
                    isSelected && {
                      color: theme.primaryDark,
                    },
                  ]}
                >
                  {trackData.description}
                </Text>

                {isSelected && (
                  <View
                    style={[
                      styles.selectedIndicator,
                      {
                        backgroundColor:
                          theme.primary,
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                )}
              </Pressable>
            );
          },
        )}
      </View>

      {/* Current path */}

      <View style={styles.pathHeader}>
        <View style={styles.pathHeaderText}>
          <Text
            style={[
              styles.sectionLabel,
              {
                color: theme.textMuted,
              },
            ]}
          >
            CURRENT PATH
          </Text>

          <Text
            style={[
              styles.pathTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {track.title}
          </Text>
        </View>

        <View
          style={[
            styles.pathIcon,
            {
              backgroundColor:
                theme.primaryLight,
            },
          ]}
        >
          <Ionicons
            name={track.icon}
            size={25}
            color={theme.primaryDark}
          />
        </View>
      </View>

      <Text
        style={[
          styles.pathDescription,
          {
            color: theme.textMuted,
          },
        ]}
      >
        {track.description}
      </Text>

      {/* Subtracks */}

      <Text
        style={[
          styles.subtrackLabel,
          {
            color: theme.textMuted,
          },
        ]}
      >
        FOCUS AREAS
      </Text>

      {track.subtracks.map(
        (subtrack, index) => (
          <View
            key={subtrack.title}
            style={[
              styles.subtrackCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.subtrackNumber,
                {
                  backgroundColor:
                    theme.iconBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.subtrackNumberText,
                  {
                    color: theme.primaryDark,
                  },
                ]}
              >
                {index + 1}
              </Text>
            </View>

            <View
              style={[
                styles.subtrackIcon,
                {
                  backgroundColor:
                    theme.primaryLight,
                },
              ]}
            >
              <Ionicons
                name={subtrack.icon}
                size={22}
                color={theme.primary}
              />
            </View>

            <View style={styles.subtrackContent}>
              <Text
                style={[
                  styles.subtrackTitle,
                  {
                    color: theme.text,
                  },
                ]}
              >
                {subtrack.title}
              </Text>

              <Text
                style={[
                  styles.subtrackDescription,
                  {
                    color: theme.textMuted,
                  },
                ]}
              >
                {subtrack.description}
              </Text>
            </View>
          </View>
        ),
      )}

      {/* Info card */}

      <View
        style={[
          styles.infoCard,
          {
            backgroundColor:
              theme.infoBackground,
            borderColor: theme.infoBorder,
          },
        ]}
      >
        <View
          style={[
            styles.infoIcon,
            {
              backgroundColor:
                theme.infoIconBackground,
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={23}
            color={theme.primaryDark}
          />
        </View>

        <View style={styles.infoContent}>
          <Text
            style={[
              styles.infoTitle,
              {
                color: theme.primaryDark,
              },
            ]}
          >
            Your path adapts to you
          </Text>

          <Text
            style={[
              styles.infoText,
              {
                color: theme.textMuted,
              },
            ]}
          >
            As you complete questions, your performance
            will help determine what you should practice
            next.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 35,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
  },

  subtitle: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },

  /* Track selector */

  trackSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },

  trackOption: {
    flex: 1,
    minHeight: 175,
    borderRadius: 18,
    padding: 15,
    borderWidth: 2,
    position: 'relative',
  },

  trackIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  trackTitle: {
    fontSize: 18,
    fontWeight: '800',
  },

  trackDescription: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
  },

  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Current path */

  pathHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  pathHeaderText: {
    flex: 1,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  pathTitle: {
    marginTop: 3,
    fontSize: 24,
    fontWeight: '800',
  },

  pathIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pathDescription: {
    marginTop: 7,
    marginBottom: 22,
    fontSize: 14,
    lineHeight: 20,
  },

  /* Subtracks */

  subtrackLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },

  subtrackCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  subtrackNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  subtrackNumberText: {
    fontSize: 12,
    fontWeight: '800',
  },

  subtrackIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  subtrackContent: {
    flex: 1,
  },

  subtrackTitle: {
    fontSize: 15,
    fontWeight: '800',
  },

  subtrackDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
  },

  /* Info */

  infoCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  infoText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
  },
});