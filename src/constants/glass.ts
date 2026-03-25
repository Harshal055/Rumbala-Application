import { StyleSheet } from 'react-native';

export const glassTokens = {
    background: 'rgba(255, 255, 255, 0.45)',
    border: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1.5,
    borderRadius: 24,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 0,
};

export const glassStyles = StyleSheet.create({
    container: {
        backgroundColor: glassTokens.background,
        borderColor: glassTokens.border,
        borderWidth: glassTokens.borderWidth,
        borderRadius: glassTokens.borderRadius,
        shadowColor: glassTokens.shadowColor,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: glassTokens.shadowOpacity,
        shadowRadius: glassTokens.shadowRadius,
        elevation: glassTokens.elevation,
    },
    header: {
      
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        borderRadius: 28,
        overflow: 'hidden',
    }
});
