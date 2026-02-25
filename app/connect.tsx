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
        // 1. Get cached profile first for immediate UI
        let p = await StorageService.getProfile();
        if (p) {
            setProfile(p);
            setMyCode(p.partnerCode);
            if (p.partnerName) setPartnerName(p.partnerName);
            if (p.connectedPartnerCode) setCode(p.connectedPartnerCode);
            if (p.avatarUri) setAvatarUri(p.avatarUri);

            if (p.connectedPartnerId && !p.connectedPartnerId.startsWith('partner_')) {
                setConnectionStatus('connected');
            } else {
                setConnectionStatus('none');
            }
        }

        // 2. Force a sync to get the latest profile
        const userId = await StorageService.getProfile().then(prof => prof?.id);
        if (userId) {
            const synced = await StorageService.syncProfile(userId);
            if (synced) {
                setProfile(synced);
                if (synced.partnerName) setPartnerName(synced.partnerName);
                if (synced.connectedPartnerCode) setCode(synced.connectedPartnerCode);
                if (synced.avatarUri) setAvatarUri(synced.avatarUri);
                if (synced.connectedPartnerId && !synced.connectedPartnerId.startsWith('partner_')) {
                    setConnectionStatus('connected');
                }
            }
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
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
                const result = await StorageService.connectToPartner(code);

                if (!result.success) {
                    console.log('Connection failed:', result.error);
                    setConnectionStatus('failed');

                    // Handle insufficient points specifically
                    if (result.error?.includes('points')) {
                        setAlertConfig({
                            visible: true,
                            title: 'Need More Points! 💝',
                            message: result.error,
                            options: [
                                { text: 'Back', onPress: () => { }, style: 'cancel' },
                                {
                                    text: 'Get Points',
                                    onPress: () => { router.push('/pricing') },
                                    style: 'default'
                                }
                            ]
                        });
                    } else {
                        setAlertConfig({
                            visible: true,
                            title: 'Connection Failed',
                            message: result.error || 'Could not find a partner with that code.',
                            options: [{
                                text: 'OK',
                                onPress: () => { setCode(''); },
                                style: 'cancel'
                            }]
                        });
                    }
                    setIsConnecting(false);
                    return;
                }

                // Success! Force a fresh sync directly to ensure state is updated
                const userId = profile.id;
                const latest = await StorageService.syncProfile(userId);
                if (latest) {
                    setProfile(latest);
                    setConnectionStatus('connected');
                    setCode(''); // Clear input on success
                }

                setAlertConfig({
                    visible: true,
                    title: '🎉 Connected!',
                    message: `Successfully connected! ${(result as any).pointsDeducted ? '5 points deducted. 💝' : ''}`,
                    options: [{
                        text: 'Amazing!',
                        onPress: () => { },
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

    const handleDisconnect = (partnerId: string, partnerName: string) => {
        setAlertConfig({
            visible: true,
            title: 'Disconnect?',
            message: `Are you sure you want to disconnect from ${partnerName || 'this partner'}?`,
            options: [
                { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                {
                    text: 'Disconnect',
                    onPress: async () => {
                        const success = await StorageService.disconnectFromPartner(partnerId);
                        if (success) {
                            await loadProfile();
                        } else {
                            Alert.alert('Error', 'Failed to disconnect. Please try again.');
                        }
                    },
                    style: 'destructive'
                }
            ]
        });
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
        borderColor: 'transparent',
        borderWidth: 0,
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScreenHeader title="Settings" showBack />
            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Section */}
                <OutlinedCard style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-circle-outline" size={24} color={theme.primary} />
                        <ThemedText type="subtitle" style={[styles.label, { color: theme.textSecondary }]}>Your Profile</ThemedText>
                    </View>
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
                    <ThemedText style={[styles.nameDisplay, { color: theme.text }]}>{profile?.name}</ThemedText>
                    <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>Tap to change profile picture</ThemedText>
                </OutlinedCard>

                {/* My Code Section */}
                <OutlinedCard style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="share-social-outline" size={22} color={theme.primary} />
                        <ThemedText type="subtitle" style={[styles.label, { color: theme.textSecondary }]}>Share Code</ThemedText>
                    </View>
                    <TouchableOpacity
                        style={[styles.codeContainer, { backgroundColor: theme.textSecondary + '1A' }]}
                        onPress={handleShare}
                    >
                        <ThemedText type="title" style={[styles.code, { color: theme.text }]}>{myCode}</ThemedText>
                        <Ionicons name="copy-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                    <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>Give this code to your partner to connect</ThemedText>
                </OutlinedCard>

                <View style={[styles.divider, { marginVertical: 20 }]}>
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                    <ThemedText style={[styles.or, { color: theme.textSecondary }]}>Connection</ThemedText>
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                </View>

                <OutlinedCard style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <ThemedText type="subtitle" style={[styles.label, { color: theme.textSecondary }]}>Partner Code</ThemedText>
                    <TextInput
                        style={[styles.input, inputStyle, { marginBottom: 16 }]}
                        placeholder="Ex. X7Y2Z9"
                        placeholderTextColor={theme.textSecondary}
                        value={code}
                        onChangeText={(t) => setCode(t.toUpperCase())}
                        maxLength={12}
                        underlineColorAndroid="transparent"
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
                        underlineColorAndroid="transparent"
                    />

                    {connectionStatus === 'connected' ? (
                        <View style={styles.connectedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                            <ThemedText style={styles.connectedText}>Connected to {profile?.partnerName || 'Partner'}</ThemedText>

                            <TouchableOpacity
                                style={[styles.disconnectIcon, { marginLeft: 'auto' }]}
                                onPress={() => handleDisconnect(profile?.connectedPartnerId || '', profile?.partnerName || '')}
                            >
                                <Ionicons name="close-circle" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    ) : connectionStatus === 'connecting' ? (
                        <View style={styles.notConnectedBadge}>
                            <Ionicons name="sync" size={16} color="#007AFF" />
                            <ThemedText style={[styles.notConnectedText, { color: '#007AFF' }]}>Connecting...</ThemedText>
                        </View>
                    ) : (
                        <View style={styles.notConnectedBadge}>
                            <Ionicons name="close-circle" size={16} color="#FF9500" />
                            <ThemedText style={styles.notConnectedText}>Not Connected</ThemedText>
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

                {/* Appearance Section */}
                <OutlinedCard style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="color-palette-outline" size={22} color={theme.primary} />
                        <ThemedText type="subtitle" style={[styles.label, { color: theme.textSecondary }]}>Appearance</ThemedText>
                    </View>
                    <TouchableOpacity
                        style={[styles.themeButton, { backgroundColor: theme.primary }]}
                        onPress={() => setShowThemePicker(true)}
                    >
                        <Ionicons name="color-wand" size={20} color="#FFF" />
                        <Text style={styles.themeButtonText}>Customize Theme</Text>
                    </TouchableOpacity>
                </OutlinedCard>

                {/* Account Actions */}
                <View style={{ gap: 12, marginTop: 8 }}>
                    <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.border, borderWidth: 1 }]} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color={theme.text} style={{ marginRight: 8 }} />
                        <Text style={[styles.actionBtnText, { color: theme.text }]}>Log Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { borderColor: '#FF3B3020', backgroundColor: '#FF3B3008' }]} onPress={handleReset}>
                        <Ionicons name="refresh-outline" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
                        <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Reset App Data</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.version, { color: theme.textSecondary }]}>Lovii v1.0.0 • Premium Rewards</Text>
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
        gap: 20,
    },
    card: {
        padding: 20,
        borderRadius: 28,
        borderWidth: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 0,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 12,
        position: 'relative',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: '35%',
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#4B6EFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
    },
    nameDisplay: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
    hint: { fontSize: 13, textAlign: 'center', opacity: 0.7 },

    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 20,
    },
    code: { fontSize: 24, fontWeight: '800', letterSpacing: 2 },

    partnersList: { gap: 12, marginTop: 4 },
    partnerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    partnerAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    partnerAvatarImg: { width: 44, height: 44, borderRadius: 22 },
    partnerInfo: { flex: 1 },
    partnerName: { fontSize: 15, fontWeight: '700' },
    partnerCodeText: { fontSize: 12, opacity: 0.6 },
    activeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    disconnectIcon: { padding: 4 },

    emptyPartners: { alignItems: 'center', paddingVertical: 20 },

    divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    line: { flex: 1, height: 1, opacity: 0.3 },
    or: { fontSize: 14, fontWeight: '600' },

    inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 4 },
    input: {
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },

    button: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    themeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 28,
        gap: 10,
    },
    themeButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },

    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 28,
    },
    actionBtnText: { fontSize: 16, fontWeight: '600' },

    version: { textAlign: 'center', fontSize: 12, marginTop: 12, opacity: 0.5 },

    connectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    connectedText: {
        color: '#34C759',
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
        backgroundColor: '#FFF3E0',
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    notConnectedText: {
        color: '#FF9500',
        fontSize: 14,
        fontWeight: '600',
    },
});
