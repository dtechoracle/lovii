import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function FloatingBar() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.bar}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/todo')}>
                    <Ionicons name="checkbox-outline" size={24} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/collage')}>
                    <Ionicons name="grid-outline" size={24} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.plusBtn} onPress={() => router.push('/editor')}>
                    <Ionicons name="add" size={32} color="#000" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/history')}>
                    <Ionicons name="time-outline" size={24} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/connect')}>
                    <Ionicons name="settings-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(28, 28, 30, 0.95)',
        borderRadius: 40,
        paddingHorizontal: 24,
        paddingVertical: 12,
        width: '100%',
        height: 80,
        borderWidth: 1,
        borderColor: '#2C2C2E',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconBtn: {
        padding: 8,
    },
    plusBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.dark.primary, // Yellow
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32, // Pop out effect
        shadowColor: "#FFD60A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
});
