import { useTheme } from '@/context/ThemeContext';
import { ThemeMode, ThemePreference } from '@/constants/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ThemePickerModalProps {
    visible: boolean;
    onClose: () => void;
}

const { width } = Dimensions.get('window');

const THEME_OPTIONS: { key: ThemePreference; name: string; color: string; icon: any }[] = [
    { key: 'ocean', name: 'Ocean Blue', color: '#4B6EFF', icon: 'water' },
    { key: 'sunset', name: 'Sunset Pink', color: '#FF4B8B', icon: 'heart' },
    { key: 'lavender', name: 'Lavender', color: '#9D4EDD', icon: 'flower' },
    { key: 'mint', name: 'Mint Green', color: '#06D6A0', icon: 'leaf' },
];

const MODE_OPTIONS: { key: ThemeMode; name: string; icon: any }[] = [
    { key: 'light', name: 'Light', icon: 'sunny' },
    { key: 'dark', name: 'Dark', icon: 'moon' },
    { key: 'auto', name: 'Auto', icon: 'contrast' },
];

export default function ThemePickerModal({ visible, onClose }: ThemePickerModalProps) {
    const { themePreference, themeMode, setThemePreference, setThemeMode } = useTheme();
    const [selectedTheme, setSelectedTheme] = useState<ThemePreference>(themePreference);
    const [selectedMode, setSelectedMode] = useState<ThemeMode>(themeMode);

    const handleSave = async () => {
        await setThemePreference(selectedTheme);
        await setThemeMode(selectedMode);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.container}>
                <View style={styles.blurBg} />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Choose Your Theme</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#8E8E93" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Theme Color Selection */}
                        <Text style={styles.sectionTitle}>Color Palette</Text>
                        <View style={styles.themeGrid}>
                            {THEME_OPTIONS.map((theme) => (
                                <TouchableOpacity
                                    key={theme.key}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.themeCard,
                                        { backgroundColor: theme.color + '20' },
                                        selectedTheme === theme.key && { borderWidth: 3, borderColor: theme.color }
                                    ]}
                                    onPress={() => setSelectedTheme(theme.key)}
                                >
                                    <View style={[styles.iconCircle, { backgroundColor: theme.color }]}>
                                        <Ionicons name={theme.icon} size={32} color="#FFF" />
                                    </View>
                                    <Text style={[styles.themeName, { color: theme.color }]}>{theme.name}</Text>
                                    {selectedTheme === theme.key && (
                                        <View style={[styles.checkmark, { backgroundColor: theme.color }]}>
                                            <Ionicons name="checkmark" size={16} color="#FFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Dark/Light Mode Selection */}
                        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Appearance</Text>
                        <View style={styles.modeRow}>
                            {MODE_OPTIONS.map((mode) => (
                                <TouchableOpacity
                                    key={mode.key}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.modeCard,
                                        selectedMode === mode.key && styles.modeCardActive
                                    ]}
                                    onPress={() => setSelectedMode(mode.key)}
                                >
                                    <Ionicons
                                        name={mode.icon}
                                        size={24}
                                        color={selectedMode === mode.key ? '#4B6EFF' : '#8E8E93'}
                                    />
                                    <Text style={[
                                        styles.modeName,
                                        selectedMode === mode.key && styles.modeNameActive
                                    ]}>
                                        {mode.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save & Apply</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    blurBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    content: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 24,
        paddingTop: 16,
        maxHeight: '80%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1C1C1E',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 16,
    },
    themeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    themeCard: {
        width: (width - 72) / 2,
        height: 140,
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    themeName: {
        fontSize: 16,
        fontWeight: '700',
    },
    checkmark: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modeCard: {
        flex: 1,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    modeCardActive: {
        backgroundColor: '#E8EDFF',
        borderWidth: 2,
        borderColor: '#4B6EFF',
    },
    modeName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    modeNameActive: {
        color: '#4B6EFF',
    },
    saveButton: {
        backgroundColor: '#4B6EFF',
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        shadowColor: "#4B6EFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
});
