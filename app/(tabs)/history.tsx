import CustomAlert from '@/components/CustomAlert';
import DrawingViewer from '@/components/DrawingViewer';
import NoteOptions from '@/components/NoteOptions';
import ScreenHeader from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { Note, StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Image,
    RefreshControl,
    SafeAreaView,
    SectionList,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

interface GroupedNotes {
    title: string;
    data: Note[];
}

export default function HistoryScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const [history, setHistory] = useState<Note[]>([]);
    const [groupedHistory, setGroupedHistory] = useState<GroupedNotes[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [myUserId, setMyUserId] = useState<string>('');
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        options: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
    }>({ visible: false, title: '', options: [] });

    // Helper to group notes by date
    const groupNotesByDate = (notes: Note[]): GroupedNotes[] => {
        const groups: { [key: string]: Note[] } = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(thisWeekStart.getDate() - 7);

        notes.forEach(note => {
            const noteDate = new Date(note.timestamp);
            noteDate.setHours(0, 0, 0, 0);

            let key: string;
            if (noteDate.getTime() === today.getTime()) {
                key = 'Today';
            } else if (noteDate.getTime() === yesterday.getTime()) {
                key = 'Yesterday';
            } else if (noteDate >= thisWeekStart) {
                key = 'This Week';
            } else {
                key = noteDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            }

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(note);
        });

        // Convert to array and sort
        const sortOrder = ['Today', 'Yesterday', 'This Week'];
        return Object.entries(groups)
            .sort(([a], [b]) => {
                const aIndex = sortOrder.indexOf(a);
                const bIndex = sortOrder.indexOf(b);
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return b.localeCompare(a);
            })
            .map(([title, data]) => ({ title, data }));
    };

    const loadHistory = async () => {
        try {
            const profile = await StorageService.getProfile();
            if (profile) setMyUserId(profile.id);

            const myNotes = await StorageService.getMyHistory();
            const partnerNotes = await StorageService.getPartnerNotes();

            // Mark notes with userId
            const markedMyNotes = myNotes.map(n => ({ ...n, userId: profile?.id }));
            const markedPartnerNotes = partnerNotes.map(n => ({ ...n, userId: profile?.connectedPartnerId || 'partner' }));

            // Combine and deduplicate by ID to prevent duplicate keys
            const allNotes = [...markedMyNotes, ...markedPartnerNotes];
            const uniqueNotes = Array.from(
                new Map(allNotes.map(note => [note.id, note])).values()
            ).sort((a, b) => b.timestamp - a.timestamp);

            setHistory(uniqueNotes);
            setGroupedHistory(groupNotesByDate(uniqueNotes));
        } catch (error) {
            console.error('History fetch failed', error);
            setHistory([]);
            setGroupedHistory([]);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadHistory();
        setRefreshing(false);
    };

    const handleOptions = (note: Note) => {
        setSelectedNote(note);
        setOptionsVisible(true);
    };

    const handleAction = async (action: 'pin' | 'bookmark' | 'widget' | 'delete', note: Note) => {
        if (action === 'delete') {
            Alert.alert(
                "Delete Note",
                "Are you sure you want to delete this note?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            await StorageService.deleteNote(note.id);
                            await loadHistory();
                        }
                    }
                ]
            );
        } else if (action === 'pin') {
            await StorageService.togglePin(note.id, note.pinned || false);
            await loadHistory();
        } else if (action === 'bookmark') {
            await StorageService.toggleBookmark(note.id, note.bookmarked || false);
            await loadHistory();
        } else if (action === 'widget') {
            // Check if partner is connected
            const profile = await StorageService.getProfile();
            if (!profile?.connectedPartnerId) {
                setAlertConfig({
                    visible: true,
                    title: 'No Partner Connected',
                    message: 'Please connect to your partner first before sending notes to their widget.',
                    options: [
                        {
                            text: 'Go to Settings',
                            onPress: () => router.push('/connect'),
                            style: 'default'
                        },
                        {
                            text: 'Cancel',
                            onPress: () => { },
                            style: 'cancel'
                        }
                    ]
                });
                return;
            }

            const result = await StorageService.sendToPartnerWidget(note);
            if (result.success) {
                setAlertConfig({
                    visible: true,
                    title: 'Sent!',
                    message: "This note will appear on your partner's widget within 5-10 seconds!",
                    options: [{ text: 'OK', onPress: () => { setAlertConfig(prev => ({ ...prev, visible: false })) }, style: 'default' }]
                });
            } else {
                setAlertConfig({
                    visible: true,
                    title: 'Failed to Send',
                    message: result.error || 'Could not send to partner\'s widget. Please check your connection.',
                    options: [{ text: 'OK', onPress: () => { setAlertConfig(prev => ({ ...prev, visible: false })) }, style: 'cancel' }]
                });
            }
        }
    };

    const renderItem = ({ item }: { item: Note }) => {
        const isMyNote = item.userId === myUserId;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onLongPress={() => handleOptions(item)}
                delayLongPress={500}
                style={styles.cardWrapper}
            >
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <View style={styles.cardHeader}>
                        <View style={styles.headerLeft}>
                            <View style={[
                                styles.senderBadge,
                                { backgroundColor: isMyNote ? theme.primary + '20' : theme.secondary + '20' }
                            ]}>
                                <Ionicons
                                    name={isMyNote ? 'person' : 'heart'}
                                    size={12}
                                    color={isMyNote ? theme.primary : theme.tint}
                                />
                                <ThemedText style={[styles.senderText, { color: isMyNote ? theme.primary : theme.tint }]}>
                                    {isMyNote ? 'You' : 'Partner'}
                                </ThemedText>
                            </View>
                            <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </ThemedText>
                        </View>
                        <View style={styles.headerIcons}>
                            {item.pinned && <Ionicons name="pin" size={12} color="#FFD60A" style={{ marginRight: 4 }} />}
                            {item.bookmarked && <Ionicons name="bookmark" size={12} color="#FFD60A" style={{ marginRight: 4 }} />}

                            <View style={[styles.typeBadge, { backgroundColor: theme.background }]}>
                                <Ionicons
                                    name={item.type === 'drawing' ? 'brush' : item.type === 'collage' ? 'images' : 'text'}
                                    size={12}
                                    color={theme.textSecondary}
                                />
                                <ThemedText style={[styles.typeText, { color: theme.textSecondary }]}>{item.type}</ThemedText>
                            </View>
                        </View>
                    </View>

                    {item.type === 'text' && (
                        <ThemedText style={[styles.content, { color: theme.text }]} numberOfLines={3}>
                            {item.content}
                        </ThemedText>
                    )}

                    {item.type === 'drawing' && (
                        <View style={[styles.imageContainer, { backgroundColor: theme.background }]}>
                            {(() => {
                                try {
                                    const paths = JSON.parse(item.content);
                                    return (
                                        <DrawingViewer
                                            paths={paths}
                                            color={item.color || theme.text}
                                            width={300}
                                            height={120}
                                            strokeWidth={3}
                                        />
                                    );
                                } catch (e) {
                                    return <ThemedText style={[styles.placeholderText, { color: theme.textSecondary }]}>Drawing Error</ThemedText>;
                                }
                            })()}
                        </View>
                    )}

                    {item.type === 'collage' && item.images && (
                        <View style={styles.collageGrid}>
                            {item.images.slice(0, 4).map((img, index) => (
                                <Image key={index} source={{ uri: img }} style={styles.collageImage} />
                            ))}
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScreenHeader title="Timeline" showBack />
            <SectionList
                sections={groupedHistory}
                renderItem={renderItem}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>{title}</ThemedText>
                    </View>
                )}
                keyExtractor={(item, index) => `${item.id}-${item.timestamp}-${index}`}
                contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="time-outline" size={64} color={theme.textSecondary} />
                        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No memories yet</ThemedText>
                        <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                            Start creating moments together!
                        </ThemedText>
                    </View>
                }
                stickySectionHeadersEnabled={false}
            />

            <NoteOptions
                visible={optionsVisible}
                onClose={() => setOptionsVisible(false)}
                note={selectedNote}
                onAction={handleAction}
            />

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                options={alertConfig.options}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 80,
        paddingTop: 60,
    },
    list: {
        padding: 24,
        paddingTop: 0,
    },
    cardWrapper: {
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    senderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    senderText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    date: {
        fontSize: 12,
        fontWeight: '600',
    },
    sectionHeader: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        paddingTop: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
        backgroundColor: '#F2F2F7',
    },
    typeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8E8E93',
        textTransform: 'capitalize',
    },
    content: {
        color: '#1C1C1E',
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 24,
    },
    imageContainer: {
        height: 120,
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    placeholderText: {
        color: '#C7C7CC',
        fontWeight: '600',
        fontSize: 14,
    },
    collageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    collageImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#EEE',
    },
    empty: {
        alignItems: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubtext: {
        fontSize: 14,
        fontWeight: '500',
    },
});
