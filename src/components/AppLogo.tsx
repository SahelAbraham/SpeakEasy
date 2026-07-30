import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

type AppLogoProps = {
  size?: number;
  style?: ViewStyle;
};

export function AppLogo({ size = 64, style }: AppLogoProps) {
  return (
    <View style={[styles.wrapper, { width: size, height: size, borderRadius: size * 0.22 }, style]}>
      <Image
        source={require('../../assets/logo.png')}
        style={{ width: size, height: size, borderRadius: size * 0.22 }}
        accessibilityLabel="SpeakEasy logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
});
