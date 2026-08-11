import { View, Text, StyleSheet } from 'react-native';
import { AppLogo } from '../components/AppLogo';
import { useTrackTheme } from '../context/TrackThemeContext';

export function DashboardHeaderTitle() {
  const { theme } = useTrackTheme();

  return (
    <View style={styles.row}>
      <AppLogo size={28} />

      <Text
        style={[
          styles.title,
          {
            color: theme.primaryDark,
          },
        ]}
      >
        SpeakEasy
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
  },
});