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
                setAvatarUri(uri); // Show immediately
                await StorageService.updateAvatar(uri);
                // Re-read profile to get Cloudinary URL if upload finished
                const updated = await StorageService.getProfile();
                if (updated?.avatarUri) setAvatarUri(updated.avatarUri);
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

    const handleLogout = () => {
        setAlertConfig({
            visible: true,
            title: 'Log Out?',
            message: 'You will return to the login screen.',
            options: [
                { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                {
                    text: 'Log Out',
                    onPress: async () => {
                        await AuthService.logout();
                        router.replace('/auth/login');
                    },
                    style: 'destructive'
                }
            ]
        });
    };

    const handleReset = () => {
        setAlertConfig({
            visible: true,
            title: 'Reset App?',
            message: 'This will clear all data locally. Your account still exists on the server.',
            options: [
                { text: 'Cancel', onPress: () => { }, style: 'cancel' },
                {
                    text: 'Reset',
                    onPress: async () => {
                        await StorageService.clearAll();
                        router.replace('/auth/login');
                    },
                    style: 'destructive'
                }
            ]
        });
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

                {/* ─── Partner Connection ─── */}
                <OutlinedCard style={[styles.card, { backgroundColor: theme.card }]}>
                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionIconBg, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="heart" size={18} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText type="subtitle" style={[styles.label, { color: theme.textSecondary }]}>
                                Connect
                            </ThemedText>
                            {connectionStatus === 'connected' && (
                                <View style={styles.connectedPill}>
                                    <View style={styles.connectedDot} />
                                    <Text style={styles.connectedPillText}>
                                        Connected to {profile?.partnerName || 'Partner'}
                                    </Text>
                                </View>
                            )}
                        </View>
                        {connectionStatus === 'connected' && (
                            <TouchableOpacity
                                onPress={() => handleDisconnect(profile?.connectedPartnerId || '', profile?.partnerName || '')}
                                style={[styles.disconnectChip, { borderColor: '#FF3B3040' }]}
                            >
                                <Ionicons name="close" size={14} color="#FF3B30" />
                                <Text style={styles.disconnectChipText}>Disconnect</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Partner Code Field */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PARTNER CODE</Text>
                        <View style={[styles.fieldBox, { backgroundColor: theme.background, borderColor: code ? theme.primary + '60' : theme.border }]}>
                            <Ionicons name="link-outline" size={18} color={code ? theme.primary : theme.textSecondary} />
                            <TextInput
                                style={[styles.fieldInput, { color: theme.text }]}
                                placeholder="LOVII-XXXXXX"
                                placeholderTextColor={theme.textSecondary + '80'}
                                value={code}
                                onChangeText={(t) => setCode(t.toUpperCase())}
                                maxLength={12}
                                autoCapitalize="characters"
                                underlineColorAndroid="transparent"
                                selectionColor={theme.primary}
                            />
                            {code.length > 0 && (
                                <TouchableOpacity onPress={() => setCode('')}>
                                    <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Partner Name Field */}
                    <View style={[styles.fieldGroup, { marginBottom: 20 }]}>
                        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PARTNER NAME</Text>
                        <View style={[styles.fieldBox, { backgroundColor: theme.background, borderColor: partnerName ? theme.primary + '60' : theme.border }]}>
                            <Ionicons name="person-outline" size={18} color={partnerName ? theme.primary : theme.textSecondary} />
                            <TextInput
                                style={[styles.fieldInput, { color: theme.text }]}
                                placeholder="What do you call them?"
                                placeholderTextColor={theme.textSecondary + '80'}
                                value={partnerName}
                                onChangeText={setPartnerName}
                                autoCapitalize="words"
                                autoCorrect={false}
                                underlineColorAndroid="transparent"
                                selectionColor={theme.primary}
                            />
                        </View>
                    </View>

                    {/* Status badge for non-connected states */}
                    {connectionStatus === 'connecting' && (
                        <View style={[styles.statusBadge, { backgroundColor: '#007AFF15', marginBottom: 16 }]}>
                            <Ionicons name="sync" size={14} color="#007AFF" />
                            <Text style={[styles.statusBadgeText, { color: '#007AFF' }]}>Connecting...</Text>
                        </View>
                    )}
                    {connectionStatus === 'failed' && (
                        <View style={[styles.statusBadge, { backgroundColor: '#FF3B3015', marginBottom: 16 }]}>
                            <Ionicons name="close-circle-outline" size={14} color="#FF3B30" />
                            <Text style={[styles.statusBadgeText, { color: '#FF3B30' }]}>Connection failed. Try again.</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.connectBtn, { backgroundColor: theme.primary }, isConnecting && { opacity: 0.6 }]}
                        onPress={handleConnect}
                        disabled={isConnecting}
                        activeOpacity={0.85}
                    >
                        <Ionicons name={connectionStatus === 'connected' ? 'save-outline' : 'heart'} size={18} color="#FFF" />
                        <Text style={styles.connectBtnText}>
                            {isConnecting ? 'Saving...' : connectionStatus === 'connected' ? 'Save Changes' : 'Connect'}
                        </Text>
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

    // ─── Partner Connection Section (rebuilt) ───
    sectionIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    connectedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
    },
    connectedDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#34C759',
    },
    connectedPillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#34C759',
    },
    disconnectChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    disconnectChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FF3B30',
    },
    fieldGroup: {
        marginBottom: 14,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    fieldBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        paddingVertical: 4,
        gap: 10,
    },
    fieldInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
        fontWeight: '600',
        borderBottomWidth: 0,
        borderWidth: 0,
        padding: 0,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    connectBtn: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    connectBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
