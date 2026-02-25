import { useTheme } from '@/context/ThemeContext';
import { Note, StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomAlert from './CustomAlert';
import DrawingViewer from './DrawingViewer';
import NoteOptions from './NoteOptions';
import OutlinedCard from './ui/OutlinedCard';

interface WidgetCardProps {
    note: Note | null;
    onPress: () => void;
    partnerName?: string;
    myUserId?: string;
    onNoteUpdate?: () => void;
}

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.5;
const CARD_WIDTH = width - 48;

export default function WidgetCard({ note, onPress, partnerName = 'Partner', myUserId, onNoteUpdate }: WidgetCardProps) {
    const { theme, isDark } = useTheme();
    const isMyNote = note?.userId === myUserId;
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message?: string;
        options: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
    } | null>(null);

    // Dynamic styles for Dark Mode inverse
    const cardBackgroundColor = isDark ? '#1C1C1E' : theme.card; // Dark grey in dark mode, card color (white) in light
    const textColor = isDark ? '#FFFFFF' : theme.text;
    const secondaryTextColor = isDark ? '#8E8E93' : theme.textSecondary;

    // ... (keep handleAction) ...

    const handleAction = async (action: 'pin' | 'bookmark' | 'widget' | 'delete', selectedNote: Note) => {
        if (action === 'delete') {
            setAlertConfig({
                title: "Delete Note",
                message: "Are you sure you want to delete this note?",
                options: [
                    { text: "Cancel", style: "cancel", onPress: () => setAlertConfig(null) },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            await StorageService.deleteNote(selectedNote.id);
                            onNoteUpdate?.();
                            setAlertConfig(null);
                        }
                    }
                ]
            });
        } else if (action === 'pin') {
            await StorageService.togglePin(selectedNote.id, selectedNote.pinned || false);
            onNoteUpdate?.();
        } else if (action === 'bookmark') {
            await StorageService.toggleBookmark(selectedNote.id, selectedNote.bookmarked || false);
            onNoteUpdate?.();
        } else if (action === 'widget') {
            const resentNote = { ...selectedNote, id: Date.now().toString(), timestamp: Date.now() };
            await StorageService.sendToPartnerWidget(resentNote);
            setAlertConfig({
                title: "Sent!",
                message: "This note will appear on your partner's widget soon!",
                options: [{ text: "OK", style: "default", onPress: () => setAlertConfig(null) }]
            });
            onNoteUpdate?.();
        }
    };


    const renderContent = () => {
        if (!note) {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="heart" size={64} color={theme.primary + '40'} />
                    <Text style={[styles.emptyText, { color: secondaryTextColor }]}>Tap to create your first note</Text>
                    <Text style={[styles.emptySubtext, { color: secondaryTextColor }]}>Share moments together</Text>
                </View>
            );
        }

        if (note.type === 'text') {
            const isNoteColorDefault = note.color === '#FFFFFF' || !note.color;
            const displayColor = (isDark && isNoteColorDefault) ? '#FFFFFF' : (note.color || textColor);

            return (
                <View style={styles.textContent}>
                    <Text
                        style={[
                            styles.noteText,
                            {
                                color: displayColor,
                                fontFamily: note.fontFamily,
                                fontWeight: (note.fontWeight as any) || 'normal',
                                fontStyle: (note.fontStyle as any) || 'normal',
                                textDecorationLine: (note.textDecorationLine as any) || 'none',
                            }
                        ]}
                        numberOfLines={8}
                    >
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

            // Render SVG paths first (ensures transparency for dark mode)
            if (paths.length > 0) {
                // If note color is black/default and we are in dark mode, use white (textColor)
                const isNoteColorDefault = note.color === '#000000' || note.color === '#FFFFFF' || !note.color;
                const drawingColor = (isDark && isNoteColorDefault) ? '#FFFFFF' : (note.color || textColor);

                return (
                    <View style={styles.drawingContent}>
                        <DrawingViewer
                            paths={paths}
                            color={drawingColor}
                            width={CARD_WIDTH}
                            height={CARD_HEIGHT - 100}
                        />
                    </View>
                );
            }

            // Fallback: If no paths but we have a preview image
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
        }

        if (note.type === 'music') {
            let track = note.musicTrack;
            if (!track) {
                try { track = JSON.parse(note.content); } catch (e) { }
            }
            if (track) {
                return (
                    <View style={styles.drawingContent}>
                        <Image
                            source={{ uri: track.coverUrl }}
                            style={{
                                width: CARD_WIDTH - 48,
                                height: CARD_HEIGHT - 120,
                                borderRadius: 20,
                                position: 'absolute',
                                opacity: 0.3
                            }}
                            resizeMode="cover"
                        />
                        <View style={{ alignItems: 'center', backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)', padding: 20, borderRadius: 24, width: '90%' }}>
                            <Ionicons name="musical-notes" size={48} color={theme.primary} />
                            <Text style={{ fontSize: 22, fontWeight: '700', color: textColor, marginTop: 12, textAlign: 'center' }}>{track.title}</Text>
                            <Text style={{ fontSize: 16, fontWeight: '500', color: secondaryTextColor, marginTop: 4, textAlign: 'center' }}>{track.artist}</Text>
                        </View>
                    </View>
                );
            }
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

        if (note.type === 'tasks' && note.tasks && note.tasks.length > 0) {
            const completed = note.tasks.filter(t => t.completed).length;
            const total = note.tasks.length;
            return (
                <View style={styles.tasksContent}>
                    <View style={styles.tasksHeader}>
                        <Ionicons name="checkbox-outline" size={20} color={note.color || theme.primary} />
                        <Text style={[styles.tasksTitle, { color: textColor }]}>Shared Tasks</Text>
                        <View style={[styles.tasksBadge, { backgroundColor: (note.color || theme.primary) + '20' }]}>
                            <Text style={[styles.tasksBadgeText, { color: note.color || theme.primary }]}>
                                {completed}/{total} done
                            </Text>
                        </View>
                    </View>
                    <View style={styles.tasksList}>
                        {note.tasks.slice(0, 5).map(task => (
                            <View key={task.id} style={styles.taskRow}>
                                <Ionicons
                                    name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={20}
                                    color={task.completed ? '#34C759' : secondaryTextColor}
                                />
                                <Text
                                    style={[
                                        styles.taskText,
                                        { color: task.completed ? secondaryTextColor : textColor },
                                        task.completed && { opacity: 0.5 }
                                    ]}
                                    numberOfLines={1}
                                >
                                    {task.text}
                                </Text>
                            </View>
                        ))}
                        {total > 5 && (
                            <Text style={[styles.taskMore, { color: secondaryTextColor }]}>
                                +{total - 5} more tasks
                            </Text>
                        )}
                    </View>
                </View>
            );
        }
    };

    return (
        <>
            <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
                <OutlinedCard style={[styles.card, { backgroundColor: cardBackgroundColor }]}>
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
                            <Text style={[styles.cardTitle, { color: textColor }]}>
                                {note ? 'Latest Note' : 'No Notes Yet'}
                            </Text>
                        </View>
                        {note && (
                            <TouchableOpacity onPress={() => setOptionsVisible(true)} style={styles.menuButton}>
                                <Ionicons name="ellipsis-horizontal" size={24} color={secondaryTextColor} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {renderContent()}

                    {note && (
                        <View style={styles.footer}>
                            <View style={[styles.badge, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                                <Ionicons name="time" size={14} color={secondaryTextColor} style={{ marginRight: 4 }} />
                                <Text style={[styles.badgeText, { color: secondaryTextColor }]}>
                                    {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                    )}
                </OutlinedCard>
            </TouchableOpacity>

            {note && (
                <NoteOptions
                    visible={optionsVisible}
                    onClose={() => setOptionsVisible(false)}
                    note={note}
                    onAction={handleAction}
                />
            )}

            {alertConfig && (
                <CustomAlert
                    visible={!!alertConfig}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    options={alertConfig.options}
                    onClose={() => setAlertConfig(null)}
                />
            )}
        </>
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
    menuButton: {
        padding: 4,
    },
    tasksContent: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    tasksHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    tasksTitle: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    tasksBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tasksBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    tasksList: {
        gap: 12,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    taskText: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    taskMore: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 4,
        paddingLeft: 30,
    },
});
