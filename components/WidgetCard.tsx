import { Note } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DrawingViewer from './DrawingViewer';

interface WidgetCardProps {
    note: Note | null;
    onPress: () => void;
}

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.55;
const CARD_WIDTH = width - 48;

export default function WidgetCard({ note, onPress }: WidgetCardProps) {

    const renderContent = () => {
        if (!note) {
            return (
                <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={48} color="#3A3A3C" />
                    <Text style={styles.emptyText}>Tap to send a note</Text>
                </View>
            );
        }

        if (note.type === 'text') {
            return (
                <View style={styles.textContent}>
                    <Text style={[styles.noteText, { color: note.color || '#FFF' }]} numberOfLines={8}>
                        {note.content}
                    </Text>
                </View>
            );
        }

        if (note.type === 'drawing') {
            let paths: string[] = [];
            try {
                paths = JSON.parse(note.content);
            } catch (e) {
                console.error('Failed to parse drawing paths', e);
            }

            return (
                <View style={styles.drawingContent}>
                    <DrawingViewer
                        paths={paths}
                        color={note.color || '#FFF'}
                        width={CARD_WIDTH}
                        height={CARD_HEIGHT - 100}
                    />
                </View>
            );
        }

        if (note.type === 'collage' && note.images) {
            // Simple 2x2 grid or list depending on count
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
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Widget</Text>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#8E8E93" />
                </View>

                {renderContent()}

                <View style={styles.footer}>
                    <View style={styles.badge}>
                        <Ionicons name="time-outline" size={14} color="#8E8E93" style={{ marginRight: 4 }} />
                        <Text style={styles.badgeText}>
                            {note ? new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#000000', // Black background as requested
        borderRadius: 32,
        height: CARD_HEIGHT,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2C2C2E',
        marginBottom: 24,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFF',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    emptyText: {
        color: '#636366',
        fontSize: 18,
        fontWeight: '600',
    },
    textContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noteText: {
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 34,
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
        gap: 8,
        justifyContent: 'center',
        alignContent: 'center',
    },
    collageItem: {
        width: '48%',
        height: '48%',
        borderRadius: 12,
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
        backgroundColor: '#1C1C1E',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        color: '#8E8E93',
        fontSize: 12,
        fontWeight: '600',
    },
});
