import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { AppLogo } from '../components/AppLogo';
import { colors } from '../theme/colors';

export function DashboardHeaderTitle() {
  return (
    <View style={styles.row}>
      <AppLogo size={28} />
      <Text style={styles.title}>SpeakEasy</Text>
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
    color: colors.primaryDark,
  },
});
