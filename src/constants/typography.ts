import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const typography = StyleSheet.create({
    // Headings
    h1: {
        fontFamily: theme.typography.headingBlack,
        fontSize: 32,
        lineHeight: 40,
        color: theme.colors.dark.text,
    },
    h2: {
        fontFamily: theme.typography.heading,
        fontSize: 28,
        lineHeight: 36,
        color: theme.colors.dark.text,
    },
    h3: {
        fontFamily: theme.typography.heading,
        fontSize: 24,
        lineHeight: 32,
        color: theme.colors.dark.text,
    },
    h4: {
        fontFamily: theme.typography.heading,
        fontSize: 20,
        lineHeight: 28,
        color: theme.colors.dark.text,
    },

    // Body text
    body: {
        fontFamily: theme.typography.body,
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.dark.text,
    },
    bodyMedium: {
        fontFamily: theme.typography.bodyMedium,
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.dark.text,
    },
    bodyBold: {
        fontFamily: theme.typography.bodyBold,
        fontSize: 16,
        lineHeight: 24,
        color: theme.colors.dark.text,
    },

    // Small text
    small: {
        fontFamily: theme.typography.body,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.dark.text,
    },
    smallMedium: {
        fontFamily: theme.typography.bodyMedium,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.dark.text,
    },
    smallBold: {
        fontFamily: theme.typography.bodyBold,
        fontSize: 14,
        lineHeight: 20,
        color: theme.colors.dark.text,
    },

    // Extra small text
    xs: {
        fontFamily: theme.typography.body,
        fontSize: 12,
        lineHeight: 16,
        color: theme.colors.dark.text,
    },
    xsMedium: {
        fontFamily: theme.typography.bodyMedium,
        fontSize: 12,
        lineHeight: 16,
        color: theme.colors.dark.text,
    },
    xsBold: {
        fontFamily: theme.typography.bodyBold,
        fontSize: 12,
        lineHeight: 16,
        color: theme.colors.dark.text,
    },

    // Button text
    button: {
        fontFamily: theme.typography.heading,
        fontSize: 16,
        lineHeight: 24,
        color: '#fff',
    },

    // Label text
    label: {
        fontFamily: theme.typography.bodyMedium,
        fontSize: 13,
        lineHeight: 18,
        color: theme.colors.dark.text,
    },
});

