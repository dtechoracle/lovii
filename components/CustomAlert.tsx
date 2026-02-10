import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message?: string;
    options: {
        text: string;
        onPress: () => void;
        style?: 'default' | 'cancel' | 'destructive';
    }[];
    onClose: () => void;
}

export default function CustomAlert({ visible, title, message, options, onClose }: CustomAlertProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        {message && <Text style={styles.message}>{message}</Text>}
                    </View>

                    <View style={styles.buttonContainer}>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    option.style === 'cancel' && styles.cancelButton,
                                    option.style === 'destructive' && styles.destructiveButton,
                                ]}
                                onPress={() => {
                                    option.onPress();
                                    onClose();
                                }}
                            >
                                <Text
                                    style={[
                                        styles.buttonText,
                                        option.style === 'cancel' && styles.cancelText,
                                        option.style === 'destructive' && styles.destructiveText,
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

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        width: '100%',
        maxWidth: 340,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    header: {
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
    },
    buttonContainer: {
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    button: {
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2E',
    },
    cancelButton: {
        backgroundColor: '#2C2C2E',
    },
    destructiveButton: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFD60A',
    },
    cancelText: {
        color: '#8E8E93',
    },
    destructiveText: {
        color: '#FF3B30',
    },
});
