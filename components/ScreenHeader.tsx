import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScreenHeaderProps {
    title?: string | React.ReactNode;
    showBack?: boolean;
    rightAction?: React.ReactNode;
    onBack?: () => void;
}

export default function ScreenHeader({ title, showBack = false, rightAction, onBack }: ScreenHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                {showBack && (
                    <TouchableOpacity style={styles.iconBtn} onPress={handleBack}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.titleContainer}>
                {typeof title === 'string' ? <Text style={styles.title}>{title}</Text> : title}
            </View>

            <View style={styles.rightContainer}>
                {rightAction || <View style={{ width: 44 }} />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 24,
        height: 50,
    },
    leftContainer: {
        minWidth: 44,
        alignItems: 'flex-start',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    rightContainer: {
        minWidth: 44,
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1C1C1E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
});
