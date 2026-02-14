import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FloatingBar() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
            <View style={[styles.bar, { backgroundColor: theme.card }]}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/todo')}>
                    <Ionicons name="checkbox" size={24} color={theme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/collage')}>
                    <Ionicons name="grid" size={24} color={theme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/editor')}>
                    <View style={[styles.plusBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
                        <Ionicons name="add" size={32} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/history')}>
                    <Ionicons name="time" size={24} color={theme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/connect')}>
                    <Ionicons name="settings" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 32,
        paddingHorizontal: 24,
        paddingVertical: 12,
        width: '100%',
        height: 80,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    iconBtn: {
        padding: 8,
    },
    plusBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
});
