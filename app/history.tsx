import DrawingViewer from '@/components/DrawingViewer';
import NoteOptions from '@/components/NoteOptions';
import ScreenHeader from '@/components/ScreenHeader';
import OutlinedCard from '@/components/ui/OutlinedCard';
import { useTheme } from '@/context/ThemeContext';
import { Note, StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HistoryScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    // Robust top padding: (SafeArea OR StatusBar) + extra buffer
    const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;
    const topPadding = Math.max(insets.top, androidStatusBar) + 20;

    const [history, setHistory] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [optionsVisible, setOptionsVisible] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const h = await StorageService.getMyHistory();
        setHistory(h);
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
                            loadHistory();
                        }
                    }
                ]
            );
        } else if (action === 'pin') {
            await StorageService.togglePin(note.id, note.pinned || false);
            loadHistory();
        } else if (action === 'bookmark') {
            await StorageService.toggleBookmark(note.id, note.bookmarked || false);
            loadHistory();
        } else if (action === 'widget') {
            await StorageService.sendToPartnerWidget(note);
            Alert.alert("Widget Updated", "This note is now shown on your widget!");
        }
    };

    const renderItem = ({ item }: { item: Note }) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => handleOptions(item)}
            delayLongPress={500}
        >
            <OutlinedCard style={styles.card} color="#FFFFFF">
                <View style={styles.cardHeader}>
                    <Text style={styles.date}>
                        {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                    <View style={styles.headerIcons}>
                        {item.pinned && <Ionicons name="pin" size={12} color={theme.tint} style={{ marginRight: 4 }} />}
                        {item.bookmarked && <Ionicons name="bookmark" size={12} color="#FFD60A" style={{ marginRight: 4 }} />}

                        <View style={styles.typeBadge}>
                            <Ionicons
                                name={item.type === 'drawing' ? 'brush' : item.type === 'collage' ? 'images' : 'text'}
                                size={12}
                                color="#8E8E93"
                            />
                            <Text style={styles.typeText}>{item.type}</Text>
                        </View>
                    </View>
                </View>

                {item.type === 'text' && (
                    <Text style={styles.content}>{item.content}</Text>
                )}

                {item.type === 'drawing' && (
                    <View style={styles.imageContainer}>
                        {(() => {
                            try {
                                const paths = JSON.parse(item.content);
                                return (
                                    <View style={{ flex: 1, width: '100%', height: '100%' }}>
                                        <DrawingViewer
                                            paths={paths}
                                            color={item.color || '#1C1C1E'}
                                            width={300} // Approximate width, SVG scales
                                            height={120}
                                            strokeWidth={3}
                                        />
                                    </View>
                                );
                            } catch (e) {
                                return <Text style={styles.placeholderText}>Drawing Error</Text>;
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
            </OutlinedCard>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* <Text>Hello</Text> */}
            <View style={{ paddingTop: 10 }}>
                <ScreenHeader title="Timeline" showBack />
            </View>
            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="time-outline" size={64} color="#C7C7CC" />
                        <Text style={styles.emptyText}>No memories yet</Text>
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
        backgroundColor: '#F2F2F7',
        paddingTop: 30,
    },
    list: {
        padding: 24,
    },
    card: {
        marginBottom: 20,
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
