import ScreenHeader from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { StorageService, UserProfile } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export default function ConnectScreen() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [myCode, setMyCode] = useState('');
    const [profile, setProfile] = useState<UserProfile | null>(null);

    // New Fields
    const [partnerName, setPartnerName] = useState('');
    const [anniversary, setAnniversary] = useState(''); // YYYY-MM-DD for simplicity

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        let p = await StorageService.getProfile();
        if (!p) {
            p = {
                id: Math.random().toString(36).substr(2, 9),
                name: 'User',
                partnerCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
            };
            await StorageService.saveProfile(p);
        }
        setProfile(p);
        setMyCode(p.partnerCode);
        if (p.partnerName) setPartnerName(p.partnerName);
        if (p.anniversary) {
            setAnniversary(new Date(p.anniversary).toISOString().split('T')[0]);
        }
    };

    const handleConnect = async () => {
        if (!profile) return;

        const updatedProfile = { ...profile };

        // Update Partner Code if provided
        if (code) {
            if (code === myCode) {
                Alert.alert("Error", "You cannot connect to yourself!");
                return;
            }
            updatedProfile.connectedPartnerId = 'partner_' + code;
        }

        // Update Partner Name
        if (partnerName) {
            updatedProfile.partnerName = partnerName;
        }

        // Update Anniversary
        if (anniversary) {
            const date = new Date(anniversary);
            if (!isNaN(date.getTime())) {
                updatedProfile.anniversary = date.getTime();
            } else {
                Alert.alert("Error", "Invalid Date Format. Use YYYY-MM-DD");
                return;
            }
        }

        await StorageService.saveProfile(updatedProfile);
        Alert.alert("Success", "Settings updated!", [
            { text: "OK", onPress: () => router.back() }
        ]);
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
        await StorageService.clearAll();
        loadProfile();
        Alert.alert("Reset", "App data cleared.");
    };

    return (
        <View style={styles.container}>
            <ScreenHeader title="Settings" showBack />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <ThemedText type="subtitle" style={styles.label}>Your Code</ThemedText>
                    <TouchableOpacity style={styles.codeContainer} onPress={handleShare}>
                        <ThemedText type="title" style={styles.code}>{myCode}</ThemedText>
                        <Ionicons name="share-outline" size={24} color={Colors.dark.primary} />
                    </TouchableOpacity>
                    <ThemedText style={styles.hint}>Share this code with your partner</ThemedText>
                </View>

                <View style={styles.divider}>
                    <View style={styles.line} />
                    <ThemedText style={styles.or}>SETTINGS</ThemedText>
                    <View style={styles.line} />
                </View>

                <View style={styles.card}>
                    <ThemedText type="subtitle" style={styles.label}>Partner's Code</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="ex. X7Y2Z9"
                        placeholderTextColor="#636366"
                        value={code}
                        onChangeText={(t) => setCode(t.toUpperCase())}
                        maxLength={6}
                    />

                    <ThemedText type="subtitle" style={styles.label}>Partner's Nickname</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="My Love"
                        placeholderTextColor="#636366"
                        value={partnerName}
                        onChangeText={setPartnerName}
                    />

                    <ThemedText type="subtitle" style={styles.label}>Anniversary (YYYY-MM-DD)</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="2023-01-01"
                        placeholderTextColor="#636366"
                        value={anniversary}
                        onChangeText={setAnniversary}
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleConnect}
                    >
                        <ThemedText style={styles.buttonText}>Save Settings</ThemedText>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                    <ThemedText style={styles.resetText}>Reset App Data</ThemedText>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        paddingTop: 60,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    label: {
        marginBottom: 12,
        color: '#FFF',
        fontWeight: '600',
        alignSelf: 'flex-start',
        width: '100%',
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#2C2C2E',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    code: {
        letterSpacing: 4,
        color: Colors.dark.primary, // Yellow
        fontSize: 24,
        fontWeight: '800',
    },
    hint: {
        fontSize: 14,
        color: '#8E8E93',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#2C2C2E',
    },
    or: {
        marginHorizontal: 16,
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        width: '100%',
        backgroundColor: '#2C2C2E',
        padding: 16,
        borderRadius: 16,
        fontSize: 18,
        marginBottom: 20,
        color: '#FFF',
        fontWeight: '600',
    },
    button: {
        width: '100%',
        backgroundColor: Colors.dark.primary, // Yellow
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '700',
    },
    resetBtn: {
        marginTop: 40,
        alignItems: 'center',
    },
    resetText: {
        color: '#FF3B30',
        fontWeight: '600',
    },
});
