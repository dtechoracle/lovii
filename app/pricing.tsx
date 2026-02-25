import ScreenHeader from '@/components/ScreenHeader';
import OutlinedCard from '@/components/ui/OutlinedCard';
import { useTheme } from '@/context/ThemeContext';
import { StorageService, UserProfile } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const costBreakdown = [
    { icon: '📝', label: 'Send a Note', cost: 1 },
    { icon: '🎨', label: 'Send a Drawing', cost: 1 },
    { icon: '🖼️', label: 'Upload a Collage', cost: 2 },
    { icon: '🎵', label: 'Song Upload', cost: 2 },
];

export default function PricingScreen() {
    const { theme, isDark } = useTheme();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [customAmount, setCustomAmount] = useState('');
    const [pointsToGet, setPointsToGet] = useState(0);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const p = await StorageService.getProfile();
        setProfile(p);
    };

    const handleAmountChange = (text: string) => {
        const numeric = text.replace(/[^0-9]/g, '');
        setCustomAmount(numeric);
        if (numeric) {
            // $2 = 10 points -> $1 = 5 points
            setPointsToGet(parseInt(numeric) * 5);
        } else {
            setPointsToGet(0);
        }
    };

    const handleTopUp = async () => {
        if (!customAmount || parseInt(customAmount) <= 0) {
            Alert.alert('Invalid Amount', 'Please enter an amount to top up.');
            return;
        }

        Alert.alert(
            'Top Up Points',
            `Purchase ${pointsToGet} points for $${customAmount}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Buy Now',
                    onPress: async () => {
                        const success = await StorageService.topUpPoints(pointsToGet);
                        if (success) {
                            Alert.alert('Success! 🎉', `${pointsToGet} points have been added to your balance.`);
                            loadProfile(); // Refresh balance
                            setCustomAmount(''); // Clear input
                            setPointsToGet(0);
                        } else {
                            Alert.alert('Error', 'Failed to add points. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScreenHeader title="Get Points" showBack />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.emoji}>💫</Text>
                    <Text style={[styles.title, { color: theme.text }]}>Lovii Points</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Top up anytime. No subscriptions, no surprises.
                    </Text>
                </View>

                {/* Points Status */}
                <View style={styles.pointsStatus}>
                    <Text style={[styles.currentPointsLabel, { color: theme.textSecondary }]}>Your Balance</Text>
                    <View style={styles.pointsDisplay}>
                        <Ionicons name="diamond" size={24} color="#FF6B6B" />
                        <Text style={[styles.pointsValue, { color: theme.text }]}>{profile?.points || 0}</Text>
                        <Text style={[styles.pointsUnit, { color: theme.textSecondary }]}>Points</Text>
                    </View>
                </View>

                {/* Rate Banner */}
                <LinearGradient
                    colors={isDark ? ['#3D1A1A', '#2C1010'] : ['#FFF0F5', '#FFE4EE']}
                    style={styles.rateBanner}
                >
                    <Text style={[styles.rateText, { color: '#FF6B6B' }]}>$1</Text>
                    <Text style={[styles.rateEquals, { color: theme.textSecondary }]}>=</Text>
                    <Text style={[styles.ratePoints, { color: theme.text }]}>5 Points</Text>
                </LinearGradient>

                {/* Custom Amount Selector */}
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Enter Amount ($)</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.currencyPrefix, { color: theme.text }]}>$</Text>
                    <TextInput
                        style={[styles.amountInput, { color: theme.text }]}
                        value={customAmount}
                        onChangeText={handleAmountChange}
                        placeholder="0"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                    />
                </View>

                {/* Buy Button */}
                <TouchableOpacity
                    style={[styles.buyButton, (!customAmount || parseInt(customAmount) <= 0) && { opacity: 0.5 }]}
                    onPress={handleTopUp}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={['#FF8A8A', '#FF6B6B']}
                        style={styles.buyButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="heart" size={18} color="#FFF" />
                        <Text style={styles.buyButtonText}>
                            {pointsToGet > 0 ? `Get ${pointsToGet} Points for $${customAmount}` : 'Enter amount to buy'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Cost Breakdown */}
                <OutlinedCard style={[styles.breakdownCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.breakdownTitle, { color: theme.text }]}>What costs what</Text>
                    {costBreakdown.map((item, i) => (
                        <View
                            key={i}
                            style={[
                                styles.breakdownRow,
                                i < costBreakdown.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border + '40' },
                            ]}
                        >
                            <Text style={styles.breakdownIcon}>{item.icon}</Text>
                            <Text style={[styles.breakdownLabel, { color: theme.text }]}>{item.label}</Text>
                            <View style={[styles.costBadge, item.cost === 2 && styles.costBadgeHighlight]}>
                                <Text style={[styles.costBadgeText, item.cost === 2 && styles.costBadgeTextHighlight]}>
                                    {item.cost} pt{item.cost > 1 ? 's' : ''}
                                </Text>
                            </View>
                        </View>
                    ))}
                </OutlinedCard>

                <Text style={[styles.footer, { color: theme.textSecondary }]}>
                    Points never expire. One-time purchase only.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60 },
    content: { padding: 20, paddingBottom: 48 },

    header: { alignItems: 'center', marginBottom: 24 },
    emoji: { fontSize: 44, marginBottom: 8 },
    title: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
    subtitle: { fontSize: 14, textAlign: 'center', maxWidth: '80%', lineHeight: 20 },

    pointsStatus: {
        alignItems: 'center',
        marginBottom: 28,
        backgroundColor: 'rgba(255,107,107,0.1)',
        padding: 20,
        borderRadius: 24,
    },
    currentPointsLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
    pointsDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pointsValue: { fontSize: 36, fontWeight: '800' },
    pointsUnit: { fontSize: 16, fontWeight: '600', marginTop: 10 },

    rateBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderRadius: 16,
        padding: 18,
        marginBottom: 28,
    },
    rateText: { fontSize: 32, fontWeight: '800' },
    rateEquals: { fontSize: 24, fontWeight: '300' },
    ratePoints: { fontSize: 32, fontWeight: '800' },

    sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 64,
        borderRadius: 16,
        borderWidth: 1.5,
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    currencyPrefix: { fontSize: 24, fontWeight: '700', marginRight: 4 },
    amountInput: {
        flex: 1,
        fontSize: 28,
        fontWeight: '700',
        padding: 0,
    },

    buyButton: { borderRadius: 28, overflow: 'hidden', marginBottom: 28 },
    buyButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 28,
    },
    buyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    breakdownCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 20 },
    breakdownTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },
    breakdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
    },
    breakdownIcon: { fontSize: 20, width: 28 },
    breakdownLabel: { flex: 1, fontSize: 14 },
    costBadge: {
        backgroundColor: 'rgba(0,0,0,0.06)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    costBadgeHighlight: { backgroundColor: '#FF6B6B20' },
    costBadgeText: { fontSize: 12, fontWeight: '600', color: '#888' },
    costBadgeTextHighlight: { color: '#FF6B6B' },

    footer: { textAlign: 'center', fontSize: 12 },
});
