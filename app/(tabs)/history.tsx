import DrawingViewer from '@/components/DrawingViewer';
import NoteOptions from '@/components/NoteOptions';
import ScreenHeader from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { Note, StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

export default function HistoryScreen() {
    const { theme } = useTheme();
    const [history, setHistory] = useState<Note[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [optionsVisible, setOptionsVisible] = useState(false);

    const loadHistory = async () => {
        try {
            const myNotes = await StorageService.getMyHistory();
            const partnerNotes = await StorageService.getPartnerNotes();

            // Combine and deduplicate by ID to prevent duplicate keys
            const allNotes = [...myNotes, ...partnerNotes];
            const uniqueNotes = Array.from(
                new Map(allNotes.map(note => [note.id, note])).values()
            ).sort((a, b) => b.timestamp - a.timestamp);

            setHistory(uniqueNotes);
        } catch (error) {
            console.error('History fetch failed', error);
            setHistory([]);
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
            await StorageService.sendToWidget(note);
            Alert.alert("Widget Updated", "This note is now shown on your widget!");
        }
    };

    const renderItem = ({ item }: { item: Note }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => handleOptions(item)}
            delayLongPress={500}
            style={styles.cardWrapper}
        >
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <ThemedText style={styles.date}>
                        {new Date(item.timestamp).toLocaleDateString()}
                    </ThemedText>
                    <View style={styles.headerIcons}>
                        {item.pinned && <Ionicons name="pin" size={12} color="#FFD60A" style={{ marginRight: 4 }} />}
                        {item.bookmarked && <Ionicons name="bookmark" size={12} color="#FFD60A" style={{ marginRight: 4 }} />}

                        <View style={styles.typeBadge}>
                            <Ionicons
                                name={item.type === 'drawing' ? 'brush' : item.type === 'collage' ? 'images' : 'text'}
                                size={12}
                                color="#8E8E93"
                            />
                            <ThemedText style={styles.typeText}>{item.type}</ThemedText>
                        </View>
                    </View>
                </View>

                {item.type === 'text' && (
                    <ThemedText style={styles.content} numberOfLines={3}>
                        {item.content}
                    </ThemedText>
                )}

                {item.type === 'drawing' && (
                    <View style={styles.imageContainer}>
                        {(() => {
                            try {
                                const paths = JSON.parse(item.content);
                                return (
                                    <DrawingViewer
                                        paths={paths}
                                        color={item.color || '#1C1C1E'}
                                        width={300}
                                        height={120}
                                        strokeWidth={3}
                                    />
                                );
                            } catch (e) {
                                return <ThemedText style={styles.placeholderText}>Drawing Error</ThemedText>;
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

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: 40 }]}>
            <ScreenHeader title="Timeline" showBack />
            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.id}-${item.timestamp}-${index}-${Math.random()}`}
                contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="time-outline" size={64} color="#C7C7CC" />
                        <ThemedText style={styles.emptyText}>No memories yet</ThemedText>
                    </View>
                }
            />

            <NoteOptions
                visible={optionsVisible}
                onClose={() => setOptionsVisible(false)}
                note={selectedNote}
                onAction={handleAction}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 80, // Space for phone's bottom navbar
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
    headerIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    date: {
        color: '#8E8E93',
        fontSize: 13,
        fontWeight: '600',
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
        color: '#8E8E93',
        fontSize: 16,
        fontWeight: '600',
    },
});
