import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AlertOption {
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message?: string;
    options: AlertOption[];
    onClose: () => void;
}

export default function CustomAlert({ visible, title, message, options, onClose }: CustomAlertProps) {
    const { theme, isDark } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[
                    styles.container,
                    {
                        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                    }
                ]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                        {message && (
                            <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
                        )}
                    </View>

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]} />

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                style={[
                                    styles.button,
                                    index < options.length - 1 && {
                                        borderBottomWidth: 1,
                                        borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA',
                                    },
                                    option.style === 'cancel' && {
                                        backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                                    },
                                    option.style === 'destructive' && {
                                        backgroundColor: 'rgba(255, 59, 48, 0.08)',
                                    },
                                ]}
                                onPress={() => {
                                    option.onPress();
                                    onClose();
                                }}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        { color: theme.primary },
                                        option.style === 'cancel' && { color: theme.textSecondary, fontWeight: '500' },
                                        option.style === 'destructive' && { color: '#FF3B30' },
                                    ]}
                                >
                                    {option.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── Shared themed button used across the app ─────────────────────────────────

interface AppButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
    disabled?: boolean;
    icon?: React.ReactNode;
    style?: object;
}

export function AppButton({ label, onPress, variant = 'primary', disabled, icon, style }: AppButtonProps) {
    const { theme } = useTheme();

    const bgColor = {
        primary: theme.primary,
        secondary: theme.card,
        destructive: '#FF3B30',
        ghost: 'transparent',
    }[variant];

    const textColor = {
        primary: '#FFFFFF',
        secondary: theme.text,
        destructive: '#FFFFFF',
        ghost: theme.primary,
    }[variant];

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.appButton,
                { backgroundColor: bgColor },
                variant === 'secondary' && { borderWidth: 1, borderColor: theme.border },
                disabled && { opacity: 0.5 },
                style,
            ]}
        >
            {icon}
            <Text style={[styles.appButtonText, { color: textColor }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    container: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 20,
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 20,
    },
    divider: {
        height: 1,
    },
    buttonContainer: {},
    button: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    // Shared AppButton
    appButton: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 24,
    },
    appButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});
