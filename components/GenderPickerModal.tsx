import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GenderPickerModalProps {
    visible: boolean;
    onSelect: () => void;
}

const { width } = Dimensions.get('window');

/**
 * Soft UI Gender Picker
 * Rounded corners (32px), No borders, Soft Shadows
 */
export default function GenderPickerModal({ visible, onSelect }: GenderPickerModalProps) {
    const { setGender } = useTheme();

    const handleSelect = async (gender: 'male' | 'female') => {
        await setGender(gender);
        onSelect();
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.container}>
                <View style={styles.blurBg} />
                <View style={styles.content}>
                    <Text style={styles.title}>Welcome to Lovii</Text>
                    <Text style={styles.subtitle}>Choose your side to begin.</Text>

                    <View style={styles.row}>
                        {/* HER Option */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.card, { backgroundColor: '#FFD1DC' }]} // Pastel Pink
                            onPress={() => handleSelect('female')}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name="heart" size={48} color="#FF2D55" />
                            </View>
                            <Text style={[styles.cardText, { color: '#FF2D55' }]}>Her</Text>
                        </TouchableOpacity>

                        {/* HIM Option */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.card, { backgroundColor: '#D1E3FF' }]} // Pastel Blue
                            onPress={() => handleSelect('male')}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name="male" size={48} color="#007AFF" />
                            </View>
                            <Text style={[styles.cardText, { color: '#007AFF' }]}>Him</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)', // Very light overlay
    },
    blurBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    content: {
        width: width - 48,
        backgroundColor: '#FFFFFF',
        borderRadius: 40,
        padding: 32,
        alignItems: 'center',
        // Soft Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1C1C1E',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 17,
        color: '#8E8E93',
        marginBottom: 32,
        fontWeight: '500',
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    card: {
        flex: 1,
        height: 160,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.5)',
        padding: 12,
        borderRadius: 20,
    },
    cardText: {
        fontSize: 20,
        fontWeight: '700',
    },
});
