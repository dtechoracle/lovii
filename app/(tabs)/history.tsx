import CustomAlert from '@/components/CustomAlert';
import DrawingViewer from '@/components/DrawingViewer';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { Note, StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_SIZE = (width - 48) / COLUMN_COUNT;

export default function HistoryScreen() {
    const [history, setHistory] = useState<Note[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);

    const loadHistory = async () => {
        const myNotes = await StorageService.getMyHistory();
        const partnerNotes = await StorageService.getPartnerNotes();

        const allNotes = [...myNotes, ...partnerNotes].sort((a, b) => b.timestamp - a.timestamp);
        setHistory(allNotes);
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

    const handleLongPress = (item: Note) => {
        setSelectedNote(item);
        setAlertVisible(true);
    };

    const renderItem = ({ item }: { item: Note }) => {
        return (
            <TouchableOpacity
                style={styles.itemContainer}
                onLongPress={() => handleLongPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.card}>
                    {/* Pin/Bookmark indicators */}
                    {(item.pinned || item.bookmarked) && (
                        <View style={styles.indicators}>
                            {item.pinned && (
                                <View style={styles.indicator}>
                                    <Ionicons name="pin" size={14} color="#FFD60A" />
                                </View>
                            )}
                            {item.bookmarked && (
                                <View style={styles.indicator}>
                                    <Ionicons name="bookmark" size={14} color="#FFD60A" />
                                </View>
                            )}
                        </View>
                    )}

                    {item.type === 'text' ? (
                        <ThemedText style={[styles.noteText, { color: item.color || '#FFF' }]} numberOfLines={3}>
                            {item.content}
                        </ThemedText>
                    ) : item.type === 'collage' && item.images ? (
                        <View style={styles.collagePreview}>
                            {item.images.slice(0, 4).map((img, index) => (
                                <View key={index} style={styles.collageImageWrapper}>
                                    <Image source={{ uri: img }} style={styles.collageImageItem} resizeMode="cover" />
                                </View>
                            ))}
                        </View>
                    ) : (
                        (() => {
                            try {
                                const paths = JSON.parse(item.content || '[]');
                                return (
                                    <DrawingViewer
                                        paths={paths}
                                        color={item.color || '#FFF'}
                                        width={ITEM_SIZE}
                                        height={ITEM_SIZE}
                                        strokeWidth={8}
                                    />
                                );
                            } catch (e) {
                                return (
                                    <ThemedText style={styles.errorText}>
                                        Invalid drawing data
                                    </ThemedText>
                                );
                            }
                        })()
                    )}
                </View>
                <ThemedText style={styles.date}>
                    {new Date(item.timestamp).toLocaleDateString()}
                </ThemedText>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>History</ThemedText>
            </View>
            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={COLUMN_COUNT}
                contentContainerStyle={styles.list}
                columnWrapperStyle={styles.row}
                refreshControl={<RefreshControl refreshing={refreshing} tintColor={Colors.dark.primary} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <ThemedText style={styles.emptyText}>No history yet</ThemedText>
                    </View>
                }
            />

            <CustomAlert
                visible={alertVisible}
                title="Note Options"
                message="Choose an action for this note"
                options={[
                    {
                        text: selectedNote?.pinned ? 'Unpin' : 'Pin',
                        onPress: async () => {
                            if (selectedNote) {
                                await StorageService.togglePin(selectedNote.id, selectedNote.pinned || false);
                                await loadHistory();
                            }
                        },
                    },
                    {
                        text: selectedNote?.bookmarked ? 'Remove Bookmark' : 'Bookmark',
                        onPress: async () => {
                            if (selectedNote) {
                                await StorageService.toggleBookmark(selectedNote.id, selectedNote.bookmarked || false);
                                await loadHistory();
                            }
                        },
                    },
                    {
                        text: 'Send to Widget',
                        onPress: async () => {
                            if (selectedNote) {
                                await StorageService.saveMyNote(selectedNote);
                                await loadHistory();
                            }
                        },
                    },
                    {
                        text: 'Cancel',
                        onPress: () => { },
                        style: 'cancel',
                    },
                ]}
                onClose={() => setAlertVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: '#FFF',
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 120,
    },
    row: {
        justifyContent: 'space-between',
    },
    itemContainer: {
        marginBottom: 16,
        width: ITEM_SIZE,
    },
    card: {
        height: ITEM_SIZE,
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    noteText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    date: {
        marginTop: 8,
        fontSize: 12,
        color: '#8E8E93',
        textAlign: 'center',
    },
    empty: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        color: '#636366',
        fontSize: 16,
    },
    collagePreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        width: '100%',
        height: '100%',
    },
    collageImageWrapper: {
        width: '48%',
        height: '48%',
        borderRadius: 8,
        overflow: 'hidden',
    },
    collageImageItem: {
        width: '100%',
        height: '100%',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        textAlign: 'center',
    },
    indicators: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        gap: 4,
        zIndex: 10,
    },
    indicator: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 12,
        padding: 4,
        minWidth: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    indicatorText: {
        fontSize: 14,
    },
});
