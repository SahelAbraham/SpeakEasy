import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import api from '../services/auth/api';

export function InitSurvey() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');

  const [therapyHistory, setTherapyHistory] = useState<
    'current' | 'past' | 'none' | null
  >(null);

  const [track, setTrack] = useState<
    'Language' | 'Speech' | null
  >(null);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleNameChange = (text: string) => {
    setName(text.replace(/[^a-zA-Z\s]/g, ''));
  };

  const handleAgeChange = (text: string) => {
    setAge(text.replace(/[^0-9]/g, ''));
  };

  const submitSurvey = async () => {
    setError('');

    if (
      !name.trim() ||
      !age.trim() ||
      !occupation.trim() ||
      !therapyHistory ||
      !track
    ) {
      setError('Please answer every question before continuing.');
      return;
    }

    if (!user) {
      setError('No authenticated user was found.');
      return;
    }

    if (!user.username || !user.email || !user.password) {
      setError(
        'Your account credentials could not be found. Please sign in again.',
      );
      return;
    }

    try {
      setSaving(true);

      const surveyPayload = {
        name: name.trim(),
        age: Number(age),
        occupation: occupation.trim(),
        therapyHistory,
        track,
      };

      /*
       * Send both the account information and survey information
       * to FastAPI.
       *
       * Password is intentionally sent in plaintext for this
       * development prototype only.
       */
      const response = await api.post('/survey', {
        username: user.username,
        email: user.email,
        password: user.password,

        ...surveyPayload,
      });

      console.log(
        'Survey sent to FastAPI:',
        response.data,
      );

      await updateUser({
        user_Id: response.data.user_id,
        completedSurvey: true,
        surveyData: surveyPayload,
      });

      console.log('Survey saved successfully');
    } catch (e) {
      console.error('Survey save failed:', e);

      setError(
        e instanceof Error
          ? e.message
          : 'Failed to save survey.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✦</Text>
          </View>

          <Text style={styles.title}>
            Welcome to SpeakEasy
          </Text>

          <Text style={styles.subtitle}>
            Tell us about yourself so we can personalize
            your exercises.
          </Text>
        </View>

        {/* About You */}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.sectionIcon}>
              <Text style={styles.sectionIconText}>👤</Text>
            </View>

            <View>
              <Text style={styles.cardTitle}>
                About You
              </Text>

              <Text style={styles.cardSubtitle}>
                A few quick details
              </Text>
            </View>
          </View>

          <Text style={styles.label}>
            Name
          </Text>

          <TextInput
            value={name}
            onChangeText={handleNameChange}
            placeholder="Your name"
            placeholderTextColor="#9AA3B2"
            style={styles.input}
            autoCapitalize="words"
            importantForAutofill="no"
            autoComplete="off"
            textContentType="none"
          />

          <Text style={styles.label}>
            Age
          </Text>

          <TextInput
            value={age}
            onChangeText={handleAgeChange}
            placeholder="Your age"
            placeholderTextColor="#9AA3B2"
            keyboardType="number-pad"
            maxLength={3}
            style={styles.input}
            importantForAutofill="no"
            autoComplete="off"
            textContentType="none"
          />

          <Text style={styles.label}>
            Current occupation
          </Text>

          <TextInput
            value={occupation}
            onChangeText={setOccupation}
            placeholder="Student, engineer, teacher..."
            placeholderTextColor="#9AA3B2"
            style={styles.input}
            importantForAutofill="no"
            autoComplete="off"
            textContentType="none"
          />

          <Text style={styles.label}>
            Therapy history
          </Text>

          <Text style={styles.description}>
            Are you seeing a speech therapist?
          </Text>

          <View style={styles.optionContainer}>
            <Pressable
              style={[
                styles.option,
                therapyHistory === 'current' &&
                  styles.optionSelected,
              ]}
              onPress={() => setTherapyHistory('current')}
            >
              <View style={styles.radio}>
                {therapyHistory === 'current' && (
                  <View style={styles.radioSelected} />
                )}
              </View>

              <Text
                style={[
                  styles.optionTitle,
                  therapyHistory === 'current' &&
                    styles.optionTitleSelected,
                ]}
              >
                Yes, currently
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.option,
                therapyHistory === 'past' &&
                  styles.optionSelected,
              ]}
              onPress={() => setTherapyHistory('past')}
            >
              <View style={styles.radio}>
                {therapyHistory === 'past' && (
                  <View style={styles.radioSelected} />
                )}
              </View>

              <Text
                style={[
                  styles.optionTitle,
                  therapyHistory === 'past' &&
                    styles.optionTitleSelected,
                ]}
              >
                I have before
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.option,
                therapyHistory === 'none' &&
                  styles.optionSelected,
              ]}
              onPress={() => setTherapyHistory('none')}
            >
              <View style={styles.radio}>
                {therapyHistory === 'none' && (
                  <View style={styles.radioSelected} />
                )}
              </View>

              <Text
                style={[
                  styles.optionTitle,
                  therapyHistory === 'none' &&
                    styles.optionTitleSelected,
                ]}
              >
                No
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Program Selection */}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.sectionIcon}>
              <Text style={styles.sectionIconText}>✦</Text>
            </View>

            <View>
              <Text style={styles.cardTitle}>
                Choose Your Program
              </Text>

              <Text style={styles.cardSubtitle}>
                Pick the area you'd like to focus on
              </Text>
            </View>
          </View>

          <View style={styles.trackContainer}>
            <Pressable
              style={[
                styles.trackOption,
                track === 'Language' &&
                  styles.languageSelected,
              ]}
              onPress={() => setTrack('Language')}
            >
              <View
                style={[
                  styles.trackIcon,
                  styles.languageIcon,
                ]}
              >
                <Text style={styles.trackIconText}>
                  🧠
                </Text>
              </View>

              <View style={styles.trackContent}>
                <Text style={styles.trackTitle}>
                  Language
                </Text>

                <Text style={styles.trackDescription}>
                  Improve your cognitive ability and memory
                </Text>
              </View>

              <View style={styles.trackRadio}>
                {track === 'Language' && (
                  <View style={styles.trackRadioSelected} />
                )}
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.trackOption,
                track === 'Speech' &&
                  styles.speechSelected,
              ]}
              onPress={() => setTrack('Speech')}
            >
              <View
                style={[
                  styles.trackIcon,
                  styles.speechIcon,
                ]}
              >
                <Text style={styles.trackIconText}>
                  🎙️
                </Text>
              </View>

              <View style={styles.trackContent}>
                <Text style={styles.trackTitle}>
                  Speech
                </Text>

                <Text style={styles.trackDescription}>
                  Improve your physical motor skills,
                  fluency, and vocal hygiene
                </Text>
              </View>

              <View style={styles.trackRadio}>
                {track === 'Speech' && (
                  <View style={styles.trackRadioSelected} />
                )}
              </View>
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>!</Text>

            <Text style={styles.error}>
              {error}
            </Text>
          </View>
        ) : null}

        <Pressable
          style={[
            styles.button,
            saving && styles.buttonDisabled,
          ]}
          onPress={submitSurvey}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>
                Finish setup
              </Text>

              <Text style={styles.buttonArrow}>
                →
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FF',
    paddingHorizontal: 20,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  /* Header */

  header: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 24,
  },

  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  iconText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 340,
  },

  /* Cards */

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E7EBF5',
    shadowColor: '#18213A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EEF1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  sectionIconText: {
    fontSize: 20,
    color: colors.primary,
  },

  cardTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },

  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },

  /* Inputs */

  label: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 18,
  },

  description: {
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 20,
  },

  input: {
    backgroundColor: '#F8F9FD',
    borderColor: '#E1E5EF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },

  /* Therapy options */

  optionContainer: {
    gap: 10,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E5EF',
    backgroundColor: '#FAFBFD',
    borderRadius: 12,
    padding: 14,
  },

  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EEF1FF',
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C5CAD8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  optionTitle: {
    color: colors.text,
    fontSize: 15,
  },

  optionTitleSelected: {
    color: colors.primary,
    fontWeight: '700',
  },

  /* Track selection */

  trackContainer: {
    gap: 12,
    marginTop: 16,
  },

  trackOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E1E5EF',
    backgroundColor: '#FAFBFD',
    borderRadius: 16,
    padding: 16,
  },

  languageSelected: {
    borderColor: '#7C6FF2',
    backgroundColor: '#F1EFFF',
  },

  speechSelected: {
    borderColor: '#35A7A0',
    backgroundColor: '#EAF9F7',
  },

  trackIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  languageIcon: {
    backgroundColor: '#E5E0FF',
  },

  speechIcon: {
    backgroundColor: '#D9F2EF',
  },

  trackIconText: {
    fontSize: 23,
  },

  trackContent: {
    flex: 1,
    paddingRight: 8,
  },

  trackTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },

  trackDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 19,
  },

  trackRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C5CAD8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  trackRadioSelected: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },

  /* Error */

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD5D8',
  },

  errorIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E05260',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '800',
    marginRight: 9,
  },

  error: {
    color: '#C43F4D',
    flex: 1,
    fontSize: 14,
  },

  /* Button */

  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 2,
    marginBottom: 30,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
  },

  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    marginLeft: 10,
  },
});