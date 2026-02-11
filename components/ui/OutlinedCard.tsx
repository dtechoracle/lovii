import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface SoftCardProps extends ViewProps {
    color?: string;
}

/**
 * Replaces "OutlinedCard" with a "SoftCard" aesthetic.
 * - No Border
 * - High Border Radius (32px)
 * - Soft Shadow
 */
export default function OutlinedCard({ children, style, color = '#FFFFFF', ...props }: SoftCardProps) {
    return (
        <View style={[styles.card, { backgroundColor: color }, style]} {...props}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 32,
        // Soft Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8, // Android
        padding: 0, // Let children handle padding or overflow
        borderWidth: 0, // Explicitly no border
    },
});
