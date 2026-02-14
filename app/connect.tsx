import CustomAlert from '@/components/CustomAlert';
import ScreenHeader from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import ThemePickerModal from '@/components/ThemePickerModal';
import OutlinedCard from '@/components/ui/OutlinedCard';
import { useTheme } from '@/context/ThemeContext';
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
        if (p.partnerId && !p.partnerId.startsWith('partner_')) {
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
                // Validate partner code format (6 characters, alphanumeric)
                if (code.length !== 6) {
                    setAlertConfig({
                        visible: true,
                        title: 'Invalid Partner Code',
                        message: 'Partner code must be exactly 6 characters.',
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
                            setCode(''); // Clear the code input after successful connection
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
                {/* Profile Section */}
                <OutlinedCard style={[styles.card, { backgroundColor: theme.card }]}>
                    <ThemedText type="subtitle" style={[styles.label, { color: theme.textSecondary }]}>Profile</ThemedText>
                    <TouchableOpacity style={styles.avatarSection} onPress={handlePickImage}>
                        <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                            ) : (
                                <Ionicons name="person" size={48} color="#FFF" />
                            )}
                        </View>
                        <View style={styles.avatarBadge}>
                            <Ionicons name="camera" size={16} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>Tap to change profile picture</ThemedText>
                </OutlinedCard>

                {/* Theme Section */}
                <OutlinedCard style={[styles.card, { backgroundColor: theme.card }]}>
                    <ThemedText type="subtitle" style={[styles.label, { color: theme.textSecondary }]}>Appearance</ThemedText>
                    <TouchableOpacity
                        style={[styles.themeButton, { backgroundColor: theme.primary }]}
                        onPress={() => setShowThemePicker(true)}
                    >
                        <Ionicons name="color-palette" size={20} color="#FFF" />
                        <Text style={styles.themeButtonText}>Customize Theme</Text>
                    </TouchableOpacity>
                </OutlinedCard>

                <OutlinedCard style={[styles.card, { backgroundColor: theme.card }]}>
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
                        autoCapitalize="words"
                        autoCorrect={true}
                    />

                    {connectionStatus === 'connected' ? (
                        <View style={styles.connectedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                            <ThemedText style={styles.connectedText}>Connected to {profile?.partnerName || 'Partner'}</ThemedText>
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
                        style={[styles.button, isConnecting && styles.buttonDisabled]} 
                        onPress={handleConnect}
                        disabled={isConnecting}
                    >
                        <ThemedText style={styles.buttonText}>
                            {isConnecting ? 'Connecting...' : 'Save Changes'}
                        </ThemedText>
                    </TouchableOpacity>
                </OutlinedCard>


                {/* Reset Button - Beefed Up */}
                <TouchableOpacity style={styles.resetBtnWrapper} onPress={handleReset}>
                    <View style={styles.resetBtn}>
                        <Ionicons name="trash-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <ThemedText style={styles.resetText}>Reset Everything</ThemedText>
                    </View>
                </TouchableOpacity>

                {/* Account Recovery */}
                <View style={styles.divider}>
                    <View style={styles.line} />
                    <ThemedText style={styles.or}>Recovery</ThemedText>
                    <View style={styles.line} />
                </View>

                <OutlinedCard style={styles.card}>
                    <ThemedText type="subtitle" style={styles.label}>Restore Account</ThemedText>
                    <ThemedText style={[styles.hint, { textAlign: 'left', marginBottom: 12 }]}>
                        Lost your data? Enter your old code to recover your account.
                    </ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="Old Code"
                        placeholderTextColor="#C7C7CC"
                        onChangeText={(t) => {
                            if (t.length === 6) {
                                Alert.alert(
                                    "Recover Account?",
                                    `Attempt to recover account with code ${t}? This will overwrite current data.`,
                                    [
                                        { text: "Cancel", style: 'cancel' },
                                        {
                                            text: "Recover",
                                            onPress: async () => {
                                                const success = await StorageService.recoverProfile(t.toUpperCase());
                                                if (success) {
                                                    Alert.alert("Success", "Account recovered! Restarting app...");
                                                    // Force reload or nav
                                                    router.replace('/(tabs)');
                                                } else {
                                                    Alert.alert("Failed", "Could not find account with that code.");
                                                }
                                            }
                                        }
                                    ]
                                )
                            }
                        }}
                        maxLength={6}
                    />
                </OutlinedCard>

                <Text style={styles.version}>v1.0.0</Text>
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
    buttonDisabled: {
        backgroundColor: '#B0B0B0',
        shadowOpacity: 0.1,
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
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    resetText: {
        color: '#FFF',
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
    version: {
        textAlign: 'center',
        fontSize: 12,
        color: '#8E8E93',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
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
        borderColor: '#FFF',
    },
    themeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 24,
        gap: 12,
        marginTop: 8,
        shadowColor: "#4B6EFF",
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
