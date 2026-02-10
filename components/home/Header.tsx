import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function Header() {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.menuBtn}>
                <Ionicons name="menu" size={24} color="#FFF" />
            </TouchableOpacity>

            <Link href="/connect" asChild>
                <TouchableOpacity>
                    {/* Placeholder for profile pic - using a gray circle or icon if no image */}
                    <View style={styles.profilePic}>
                        <Ionicons name="person" size={20} color="#FFF" />
                    </View>
                </TouchableOpacity>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    menuBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1C1C1E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    profilePic: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2C2C2E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#3A3A3C',
        overflow: 'hidden',
    },
});
