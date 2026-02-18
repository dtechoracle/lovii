import CustomAlert from '@/components/CustomAlert';
import ScreenHeader from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import ThemePickerModal from '@/components/ThemePickerModal';
import OutlinedCard from '@/components/ui/OutlinedCard';
import { useTheme } from '@/context/ThemeContext';
import { AuthService } from '@/services/auth';
import { StorageService, UserProfile } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ConnectScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [code, setCode] = useState('');
    const [myCode, setMyCode] = useState('');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [partnerName, setPartnerName] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'none' | 'connecting' | 'connected' | 'failed'>('none');
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        options: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
    }>({ visible: false, title: '', options: [] });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        let p = await StorageService.getProfile();
        if (!p) {
            p = await StorageService.createProfile();
        }
        setProfile(p);
        setMyCode(p.partnerCode);

        // Load existing data
        if (p.partnerName) setPartnerName(p.partnerName);
        if (p.connectedPartnerCode) setCode(p.connectedPartnerCode);
        if (p.avatarUri) setAvatarUri(p.avatarUri);

        // Set initial connection status based on whether we have a verified partner ID
        // A real partner ID won't start with 'partner_' (that's just a temporary placeholder)
        if (p.connectedPartnerId && !p.connectedPartnerId.startsWith('partner_')) {
            setConnectionStatus('connected');
        } else {
            setConnectionStatus('none');
        }
    };

    const handlePickImage = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('Permission Required', 'Please allow access to your photos to set a profile picture.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const uri = result.assets[0].uri;
                setAvatarUri(uri);
                await StorageService.updateAvatar(uri);
            }
        } catch (error) {
            console.error('Image picker error:', error);
        }
    };

    const handleConnect = async () => {
        if (!profile) return;

        setIsConnecting(true);
        setConnectionStatus('connecting');

        try {
            // Save partner name if provided (can be updated anytime)
            if (partnerName && partnerName !== profile.partnerName) {
                const updatedProfile = { ...profile, partnerName };
                await StorageService.saveProfile(updatedProfile);
                setProfile(updatedProfile);
            }

            // Handle partner code connection (only if code is provided)
            if (code) {
                // Validate partner code format (LOVII- + 6 alphanumeric chars = 12 total)
                if (code.length !== 12) {
                    setAlertConfig({
                        visible: true,
                        title: 'Invalid Partner Code',
                        message: 'Partner code must be exactly 12 characters (e.g. LOVII-A7B2X9).',
                        options: [{ text: 'OK', onPress: () => { }, style: 'cancel' }]
                    });
                    setConnectionStatus('failed');
                    setIsConnecting(false);
                    return;
                }

                // Try to connect to partner
                const success = await StorageService.connectToPartner(code);

                if (!success) {
                    console.log('Connection failed');
                    setConnectionStatus('failed');
                    setAlertConfig({
                        visible: true,
                        title: 'Connection Failed',
                        message: 'Could not find a partner with that code. Please check the code and try again.',
                        options: [{
                            text: 'OK',
                            onPress: () => {
                                setCode(''); // Clear the invalid code
                            },
                            style: 'cancel'
                        }]
                    });
                    setIsConnecting(false);
                    return;
                }

                // Success! Refresh profile to get partner details
                const latest = await StorageService.getProfile();
                if (latest) {
                    setProfile(latest);
                    setConnectionStatus('connected');
                }

                setAlertConfig({
                    visible: true,
                    title: '🎉 Connected!',
                    message: `You're now connected to ${latest?.partnerName || 'your partner'}!`,
                    options: [{
                        text: 'OK',
                        onPress: () => {
                            // Keep the code visible
                        },
                        style: 'cancel'
                    }]
                });
            } else if (partnerName) {
                // Only partner name was updated, no code
                setAlertConfig({
                    visible: true,
                    title: 'Saved!',
                    message: 'Partner name updated.',
                    options: [{ text: 'OK', onPress: () => { }, style: 'cancel' }]
                });
            }
        } catch (error) {
            console.error('Connection error:', error);
            setConnectionStatus('failed');
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Something went wrong. Please try again.',
                options: [{ text: 'OK', onPress: () => { }, style: 'cancel' }]
            });
        } finally {
            setIsConnecting(false);
        }
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

    const handleLogout = async () => {
        Alert.alert("Log Out?", "You will return to the login screen.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Log Out",
                style: "destructive",
                onPress: async () => {
                    await AuthService.logout();
                    router.replace('/auth/login');
                }
            }
        ]);
    };

    const handleReset = async () => {
        Alert.alert("Reset App?", "This will clear all data locally. Your account still exists on the server.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Reset",
                style: "destructive",
                onPress: async () => {
                    await StorageService.clearAll();
                    router.replace('/(tabs)'); // Or login?
                    router.replace('/auth/login');
                }
            }
        ]);
    };

    // Helper for input styles
    const inputStyle = {
        backgroundColor: theme.textSecondary + '1A', // 10% opacity of text secondary
        color: theme.text,
        borderColor: theme.border,
        borderWidth: 1,
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScreenHeader title="Settings" showBack />
            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Section */}
                <OutlinedCard style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <ThemedText type="subtitle" style={[styles.label, { color: theme.textSecondary }]}>Profile</ThemedText>
                    <TouchableOpacity style={styles.avatarSection} onPress={handlePickImage}>
                        <View style={[styles.avatarContainer, { backgroundColor: theme.primary, borderColor: theme.card }]}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                            ) : (
                                <Ionicons name="person" size={48} color="#FFF" />
                            )}
                        </View>
                        <View style={[styles.avatarBadge, { borderColor: theme.card }]}>
                            <Ionicons name="camera" size={16} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>Tap to change profile picture</ThemedText>
                </OutlinedCard>

                {/* Theme Section */}
                <OutlinedCard style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <ThemedText type="subtitle" style={[styles.label, { color: theme.textSecondary }]}>Appearance</ThemedText>
                    <TouchableOpacity
                        style={[styles.themeButton, { backgroundColor: theme.primary }]}
                        onPress={() => setShowThemePicker(true)}
                    >
                        <Ionicons name="color-palette" size={20} color="#FFF" />
                        <Text style={styles.themeButtonText}>Customize Theme</Text>
                    </TouchableOpacity>
                </OutlinedCard>

                <OutlinedCard style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <ThemedText type="subtitle" style={[styles.label, { color: theme.textSecondary }]}>My Code</ThemedText>
                    <TouchableOpacity
                        style={[styles.codeContainer, { backgroundColor: theme.textSecondary + '1A' }]}
                        onPress={handleShare}
                    >
                        <ThemedText type="title" style={[styles.code, { color: theme.text }]}>{myCode}</ThemedText>
                        <Ionicons name="copy-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                    <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>Tap to copy & share</ThemedText>
                </OutlinedCard>

                <View style={styles.divider}>
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                    <ThemedText style={[styles.or, { color: theme.textSecondary }]}>Connection</ThemedText>
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                </View>

                <OutlinedCard style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <ThemedText type="subtitle" style={[styles.label, { color: theme.textSecondary }]}>Partner Code</ThemedText>
                    <TextInput
                        style={[styles.input, inputStyle]}
                        placeholder="Ex. LOVII-A7B2X9"
                        placeholderTextColor={theme.textSecondary}
                        value={code}
                        onChangeText={(t) => setCode(t.toUpperCase())}
                        maxLength={12}
                    />

                    <ThemedText type="subtitle" style={[styles.label, { color: theme.textSecondary }]}>Partner Name</ThemedText>
                    <TextInput
                        style={[styles.input, inputStyle]}
                        placeholder="My Love"
                        placeholderTextColor={theme.textSecondary}
                        value={partnerName}
                        onChangeText={setPartnerName}
                        autoCapitalize="words"
                        autoCorrect={true}
                    />

                    {connectionStatus === 'connected' ? (
                        <View style={[styles.connectedBadge, { backgroundColor: '#E8F5E9' }]}>
                            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                            <ThemedText style={[styles.connectedText, { color: '#000' }]}>Connected to {profile?.partnerName || 'Partner'}</ThemedText>
                        </View>
                    ) : connectionStatus === 'connecting' ? (
                        <View style={[styles.notConnectedBadge, { backgroundColor: theme.textSecondary + '1A' }]}>
                            <Ionicons name="sync" size={16} color={theme.primary} />
                            <ThemedText style={[styles.notConnectedText, { color: theme.primary }]}>Connecting...</ThemedText>
                        </View>
                    ) : (
                        <View style={[styles.notConnectedBadge, { backgroundColor: theme.textSecondary + '1A' }]}>
                            <Ionicons name="close-circle" size={16} color="#FF9500" />
                            <ThemedText style={[styles.notConnectedText, { color: '#FF9500' }]}>Not Connected</ThemedText>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.button, isConnecting && styles.buttonDisabled, { backgroundColor: theme.primary }]}
                        onPress={handleConnect}
                        disabled={isConnecting}
                    >
                        <ThemedText style={styles.buttonText}>
                            {isConnecting ? 'Connecting...' : 'Save Changes'}
                        </ThemedText>
                    </TouchableOpacity>
                </OutlinedCard>


                {/* Buttons Container */}
                <View style={{ gap: 16, marginTop: 10 }}>
                    {/* Logout Button */}
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.border, borderWidth: 1 }]} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color={theme.text} style={{ marginRight: 8 }} />
                        <ThemedText style={[styles.actionBtnText, { color: theme.text }]}>Log Out</ThemedText>
                    </TouchableOpacity>

                    {/* Reset Button */}
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: '#FF3B30', borderWidth: 1 }]} onPress={handleReset}>
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
                        <ThemedText style={[styles.actionBtnText, { color: '#FF3B30' }]}>Reset App Data</ThemedText>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.version, { color: theme.textSecondary }]}>v1.0.0</Text>
            </ScrollView>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                options={alertConfig.options}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />

            <ThemePickerModal
                visible={showThemePicker}
                onClose={() => setShowThemePicker(false)}
            />
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
        borderWidth: 1, // Added border for better visibility in dark mode if needed
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 20,
        marginBottom: 8,
    },
    code: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: 2,
    },
    hint: {
        fontSize: 13,
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
    },
    or: {
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        borderRadius: 20,
        padding: 16,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 20,
    },
    button: {
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        marginTop: 8,
        height: 56,
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        height: 56,
        borderRadius: 28,
        width: '100%',
    },
    actionBtnText: {
        fontWeight: '600',
        fontSize: 16,
    },
    connectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    connectedText: {
        fontSize: 14,
        fontWeight: '600',
    },
    notConnectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    notConnectedText: {
        fontSize: 14,
        fontWeight: '600',
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 24,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 16,
        position: 'relative',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 4,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: '35%',
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4B6EFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
    },
    themeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 24,
        gap: 12,
        marginTop: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    themeButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
});
