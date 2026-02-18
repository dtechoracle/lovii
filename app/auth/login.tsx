import { AuthService } from '@/services/auth';
import { StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!code || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        const formattedCode = code.toUpperCase().trim();
        const result = await AuthService.login(formattedCode, password);

        if (result.success && result.user) {
            await StorageService.setSession(result.user);
            router.replace('/(tabs)');
        } else {
            Alert.alert('Login Failed', result.error || 'Invalid credentials');
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            {/* Full Screen Image Background */}
            <Image
                source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop' }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={500}
            />

            {/* Gradient Overlay (Fade to Black/Dark at bottom) */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', '#000000']}
                locations={[0, 0.4, 1]}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>

                    {/* Top Section (Spacer) */}
                    <View style={{ flex: 1 }} />

                    {/* Bottom Content */}
                    <View style={styles.formContainer}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to continue your journey</Text>

                        {/* Glassmorphism Inputs */}
                        <BlurView intensity={30} tint="dark" style={styles.glassContainer}>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="key-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your Code"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={code}
                                    onChangeText={setCode}
                                    autoCapitalize="characters"
                                    maxLength={10}
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </BlurView>

                        {/* Main Action Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                            style={styles.buttonContainer}
                        >
                            <LinearGradient
                                colors={['#FFFFFF', '#E0E0E0']}
                                style={styles.button}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text style={styles.buttonText}>Sign In</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Footer Link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <Link href="/auth/register" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.linkText}>Register</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
    },
    formContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 8,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 32,
    },
    glassContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.2)',
        marginBottom: 24,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 64,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#FFF',
        fontWeight: '500',
        height: '100%',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginLeft: 52,
    },
    buttonContainer: {
        shadowColor: "#FFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    button: {
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
    linkText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
