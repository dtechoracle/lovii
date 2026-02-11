import ScreenHeader from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import OutlinedCard from '@/components/ui/OutlinedCard';
import { useTheme } from '@/context/ThemeContext';
import { StorageService, UserProfile } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ConnectScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [code, setCode] = useState('');
    const [myCode, setMyCode] = useState('');
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // New Fields
    const [partnerName, setPartnerName] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        let p = await StorageService.getProfile();
        // Fallback create if somehow missing (should be handled by StorageService now)
        if (!p) {
            p = await StorageService.createProfile();
        }
        setProfile(p);
        setMyCode(p.partnerCode);
        if (p.partnerName) setPartnerName(p.partnerName);
    };

    const handleConnect = async () => {
        if (!profile) return;
        const updatedProfile = { ...profile };

        // Save Code/Name logic
        // We use the optimistic local save from StorageService
        if (code) updatedProfile.connectedPartnerId = 'partner_' + code;
        if (partnerName) updatedProfile.partnerName = partnerName;

        await StorageService.saveProfile(updatedProfile);

        // Try to verify connection (network)
        if (code) {
            await StorageService.connectToPartner(code);
        }

        Alert.alert("Success", "Settings updated!", [{ text: "OK", onPress: () => router.back() }]);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Let's connect on Lovii! My code is: ${myCode}`,
            });
        } catch (error) {
            // ignore
        }
    };

    const handleReset = async () => {
        Alert.alert("Reset App?", "This will clear all data.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Reset",
                style: "destructive",
                onPress: async () => {
                    await StorageService.clearAll();
                    router.replace('/(tabs)');
                }
            }
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScreenHeader title="Settings" showBack />
            <ScrollView contentContainerStyle={styles.content}>
                <OutlinedCard style={styles.card}>
                    <ThemedText type="subtitle" style={styles.label}>My Code</ThemedText>
                    <TouchableOpacity style={styles.codeContainer} onPress={handleShare}>
                        <ThemedText type="title" style={styles.code}>{myCode}</ThemedText>
                        <Ionicons name="copy-outline" size={24} color="#4B6EFF" />
                    </TouchableOpacity>
                    <ThemedText style={styles.hint}>Tap to copy & share</ThemedText>
                </OutlinedCard>

                <View style={styles.divider}>
                    <View style={styles.line} />
                    <ThemedText style={styles.or}>Connection</ThemedText>
                    <View style={styles.line} />
                </View>

                <OutlinedCard style={styles.card}>
                    <ThemedText type="subtitle" style={styles.label}>Partner Code</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex. X7Y2Z9"
                        placeholderTextColor="#C7C7CC"
                        value={code}
                        onChangeText={(t) => setCode(t.toUpperCase())}
                        maxLength={6}
                    />

                    <ThemedText type="subtitle" style={styles.label}>Partner Name</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="My Love"
                        placeholderTextColor="#C7C7CC"
                        value={partnerName}
                        onChangeText={setPartnerName}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleConnect}>
                        <ThemedText style={styles.buttonText}>Save Changes</ThemedText>
                    </TouchableOpacity>
                </OutlinedCard>

                {/* Reset Button - Beefed Up */}
                <TouchableOpacity style={styles.resetBtnWrapper} onPress={handleReset}>
                    <View style={styles.resetBtn}>
                        <Ionicons name="trash-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <ThemedText style={styles.resetText}>Reset Everything</ThemedText>
                    </View>
                </TouchableOpacity>
                <Text style={styles.version}>v1.0.2 - Soft Playful</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    content: {
        padding: 24,
        paddingBottom: 60,
        gap: 24,
    },
    card: {
        padding: 24,
        borderRadius: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F2F2F7',
        padding: 16,
        borderRadius: 20,
        marginBottom: 8,
    },
    code: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: 2,
    },
    hint: {
        fontSize: 13,
        color: '#8E8E93',
        textAlign: 'center',
        marginTop: 8,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginVertical: 8,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5EA',
    },
    or: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
    },
    input: {
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
        padding: 16,
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#4B6EFF', // Soft Blue
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        marginTop: 8,
        height: 56,
        justifyContent: 'center',
        shadowColor: "#4B6EFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
    resetBtnWrapper: {
        marginTop: 20,
        alignItems: 'center',
    },
    resetBtn: {
        backgroundColor: '#FF3B30',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        height: 56,
        borderRadius: 28,
        width: '100%',
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    resetText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
    version: {
        textAlign: 'center',
        color: '#C7C7CC',
        fontSize: 12,
        marginTop: 20,
    },
});
