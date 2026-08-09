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

import { MicButton } from '../components/MicButton';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import api from '../services/auth/api';


export function InitSurvey() {
  const { updateUser } = useAuth();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [occupation, setOccupation] = useState('');

  const [therapyHistory, setTherapyHistory] = useState<
    'current' | 'past' | 'none' | null
  >(null);

  const [goals, setGoals] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);


  const passage =
    'The sun was shining brightly on the quiet street. I walked outside and enjoyed the fresh morning air.';


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
      !goals.trim() ||
      !audioUri
    ) {
      setError(
        'Please answer every question and record your speech sample.'
      );
      return;
    }


    try {
      setSaving(true);

      const surveyPayload={
        name: name.trim(),
        age: Number(age),
        occupation: occupation.trim(),
        therapyHistory,
        goals: goals.trim(),
        baselineAudioUri: audioUri,
      }
      
      //Send to FastAPI
      const response = await api.post('/survey', surveyPayload);
      console.log('Survey sent to FastAPI:', response.data);

      await updateUser({
        completedSurvey: true,
        surveyData: surveyPayload,
      });

      console.log('Survey saved successfully');

    } catch (e) {
      console.error('Survey save failed:', e);

      setError(
        e instanceof Error
          ? e.message
          : 'Failed to save survey.'
      );

    } finally {
      setSaving(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >

      <ScrollView
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.title}>
          Welcome to SpeakEasy
        </Text>

        <Text style={styles.subtitle}>
          Tell us about yourself so we can personalize your speech exercises.
        </Text>


        <View style={styles.card}>

          <Text style={styles.label}>
            Name
          </Text>

          <TextInput
            value={name}
            onChangeText={handleNameChange}
            placeholder="Your name"
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
            style={styles.input}
            importantForAutofill="no"
            autoComplete="off"
            textContentType="none"
          />


          <Text style={styles.label}>
            Therapy history
          </Text>

          <Text style={styles.description}>
            Are you currently seeing a speech therapist?
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
              <Text>
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
              <Text>
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
              <Text>
                No
              </Text>
            </Pressable>

          </View>


          <Text style={styles.label}>
            Goals for speech practice
          </Text>

          <TextInput
            value={goals}
            onChangeText={setGoals}
            placeholder="Example: Improve my stutter..."
            multiline
            style={[
              styles.input,
              styles.textArea,
            ]}
            importantForAutofill="no"
            autoComplete="off"
            textContentType="none"
          />

        </View>



        <View style={styles.card}>

          <Text style={styles.label}>
            Speech baseline recording
          </Text>


          <Text style={styles.description}>
            Read this passage aloud:
          </Text>


          <View style={styles.passageBox}>
            <Text style={styles.passage}>
              {passage}
            </Text>
          </View>


          <MicButton
            onRecordingComplete={(uri) =>
              setAudioUri(uri)
            }
          />


          {audioUri && (
            <Text style={styles.recorded}>
              ✓ Recording saved
            </Text>
          )}

        </View>



        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}



        <Pressable
          style={styles.button}
          onPress={submitSurvey}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              Finish setup
            </Text>
          )}
        </Pressable>


      </ScrollView>

    </KeyboardAvoidingView>
  );
}



const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
  },

  subtitle: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 16,
    marginBottom: 24,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },

  label: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },

  description: {
    color: colors.textMuted,
    marginBottom: 12,
  },

  input: {
    backgroundColor: '#fff',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },

  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },

  optionContainer: {
    gap: 10,
  },

  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
  },

  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#e9f0ff',
  },

  passageBox: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },

  passage: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },

  recorded: {
    textAlign: 'center',
    color: '#2e8b57',
    marginTop: 8,
  },

  error: {
    color: colors.error,
    marginBottom: 12,
  },

  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },

});