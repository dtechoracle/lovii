import { useTheme } from '@/context/ThemeContext';
import { Note } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DrawingViewer from './DrawingViewer';
import OutlinedCard from './ui/OutlinedCard';

interface WidgetCardProps {
    note: Note | null;
    onPress: () => void;
    partnerName?: string;
    myUserId?: string;
}

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.5;
const CARD_WIDTH = width - 48;

export default function WidgetCard({ note, onPress, partnerName = 'Partner', myUserId }: WidgetCardProps) {
    const { theme } = useTheme();
    const isMyNote = note?.userId === myUserId;

    const renderContent = () => {
        if (!note) {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="heart" size={64} color={theme.primary + '40'} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Tap to create your first note</Text>
                    <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Share moments together</Text>
                </View>
            );
        }

        if (note.type === 'text') {
            return (
                <View style={styles.textContent}>
                    <Text style={[styles.noteText, { color: note.color || '#1C1C1E' }]} numberOfLines={8}>
                        {note.content}
                    </Text>
                </View>
            );
        }

        if (note.type === 'drawing') {
            let paths: string[] = [];
            let preview: string | null = null;

            try {
                const parsed = JSON.parse(note.content);
                if (Array.isArray(parsed)) {
                    // Legacy format: just paths
                    paths = parsed;
                } else if (parsed.paths) {
                    // New format: {paths, preview}
                    paths = parsed.paths;
                    preview = parsed.preview;
                }
            } catch (e) {
                console.error('Failed to parse drawing content', e);
            }

            // If we have a preview image, show it instead of rendering SVG paths
            if (preview) {
                return (
                    <View style={styles.drawingContent}>
                        <Image
                            source={{ uri: preview }}
                            style={{
                                width: CARD_WIDTH - 48,
                                height: CARD_HEIGHT - 120,
                                borderRadius: 20
                            }}
                            resizeMode="contain"
                        />
                    </View>
                );
            }

            // Fallback: render SVG paths
            return (
                <View style={styles.drawingContent}>
                    <DrawingViewer
                        paths={paths}
                        color={note.color || '#1C1C1E'}
                        width={CARD_WIDTH}
                        height={CARD_HEIGHT - 100}
                    />
                </View>
            );
        }

        if (note.type === 'collage' && note.images) {
            return (
                <View style={styles.collageContainer}>
                    {note.images.slice(0, 4).map((img, index) => (
                        <View key={index} style={styles.collageItem}>
                            <Image source={{ uri: img }} style={styles.collageImage} resizeMode="cover" />
                        </View>
                    ))}
                </View>
            );
        }
    };

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
            <OutlinedCard style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        {note && (
                            <View style={[
                                styles.senderBadge,
                                { backgroundColor: isMyNote ? theme.primary + '15' : theme.tint + '15' }
                            ]}>
                                <Ionicons
                                    name={isMyNote ? 'person' : 'heart'}
                                    size={14}
                                    color={isMyNote ? theme.primary : theme.tint}
                                />
                                <Text style={[styles.senderText, { color: isMyNote ? theme.primary : theme.tint }]}>
                                    {isMyNote ? 'You' : partnerName}
                                </Text>
                            </View>
                        )}
                        <Text style={[styles.cardTitle, { color: theme.text }]}>
                            {note ? 'Latest Note' : 'No Notes Yet'}
                        </Text>
                    </View>
                    <Ionicons name="ellipsis-horizontal" size={24} color={theme.textSecondary} />
                </View>

                {renderContent()}

                {note && (
                    <View style={styles.footer}>
                        <View style={[styles.badge, { backgroundColor: theme.background }]}>
                            <Ionicons name="time" size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                            <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                                {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    </View>
                )}
            </OutlinedCard>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        height: CARD_HEIGHT,
        padding: 24,
        borderRadius: 40,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    senderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    senderText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
    textContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noteText: {
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 36,
    },
    drawingContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    collageContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
        alignContent: 'center',
    },
    collageItem: {
        width: '46%',
        height: '46%',
        borderRadius: 20,
        overflow: 'hidden',
    },
    collageImage: {
        width: '100%',
        height: '100%',
    },
    footer: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    badgeText: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '600',
    },
});
