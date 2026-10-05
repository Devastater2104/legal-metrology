import { Image, Text, View } from 'react-native';
import { styles } from '../styles';

export default function LogoHeader({ compact = false }) {
  return (
    <View style={compact ? styles.headerCompact : styles.header}>
      <Image
        source={require('../../assets/legal-metrology-logo.png')}
        style={compact ? styles.logoSmall : styles.logo}
        resizeMode="contain"
      />
      {!compact && (
        <View style={styles.headerText}>
          
          <Text style={styles.tagline}>FIELD OFFICER LOGIN</Text>
        </View>
      )}
    </View>
  );
}
