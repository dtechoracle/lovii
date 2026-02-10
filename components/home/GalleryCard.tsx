import DrawingViewer from '@/components/DrawingViewer';
import { Note, StorageService } from '@/services/storage';
import { Link } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GalleryCard() {
    const [drawings, setDrawings] = useState<Note[]>([]);

    useEffect(() => {
        loadDrawings();
    }, []);

    const loadDrawings = async () => {
        const history = await StorageService.getMyHistory();
        const partner = await StorageService.getPartnerNotes();
        const all = [...history, ...partner]
            .filter(n => n.type === 'drawing' || n.type === 'collage')
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 4);
        setDrawings(all);
    };

    return (
        <Link href="/history" asChild>
            <TouchableOpacity style={styles.card}>
                <Text style={styles.title}>Images</Text>

                <View style={styles.grid}>
                    {drawings.map((d, i) => (
                        <View key={d.id} style={styles.thumbnail}>
                            {d.type === 'collage' && d.images ? (
                                <View style={styles.collagePreview}>
                                    {d.images.slice(0, 1).map((img, idx) => (
                                        <View key={idx} style={styles.collageThumb} />
                                    ))}
                                </View>
                            ) : (
                                (() => {
                                    try {
                                        const paths = JSON.parse(d.content || '[]');
                                        return (
                                            <DrawingViewer
                                                paths={paths}
                                                color={d.color || '#FFF'}
                                                width={60}
                                                height={60}
                                                strokeWidth={8}
                                            />
                                        );
                                    } catch (e) {
                                        return <Text style={styles.errorText}>!</Text>;
                                    }
                                })()
                            )}
                        </View>
                    ))}
                    {drawings.length === 0 && (
                        <Text style={styles.emptyText}>No drawings</Text>
                    )}
                </View>
            </TouchableOpacity>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: '#1C1C1E',
        borderRadius: 32,
        padding: 20,
        height: 240,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    thumbnail: {
        width: '45%',
        aspectRatio: 1,
        backgroundColor: '#2C2C2E',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    emptyText: {
        color: '#636366',
        fontStyle: 'italic',
    },
    collagePreview: {
        width: '100%',
        height: '100%',
        backgroundColor: '#2C2C2E',
    },
    collageThumb: {
        width: '100%',
        height: '100%',
        backgroundColor: '#3A3A3C',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 24,
        fontWeight: 'bold',
    },
});
