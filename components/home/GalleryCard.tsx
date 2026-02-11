import { StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import OutlinedCard from '../ui/OutlinedCard';

export default function GalleryCard() {
    const [images, setImages] = useState<string[]>([]);

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        const notes = await StorageService.getMyHistory();
        // Extract images from collage notes
        const allImages = notes
            .filter(n => n.type === 'collage' && n.images && n.images.length > 0)
            .flatMap(n => n.images || [])
            .slice(0, 4);

        setImages(allImages);
    };

    return (
        <OutlinedCard style={styles.card}>
            <View style={styles.header}>
                <View style={styles.iconBg}>
                    <Ionicons name="images" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.title}>Gallery</Text>
            </View>

            <View style={styles.grid}>
                {images.length > 0 ? (
                    images.map((img, index) => (
                        <View key={index} style={styles.imageWrapper}>
                            <Image source={{ uri: img }} style={styles.image} />
                        </View>
                    ))
                ) : (
                    <View style={styles.empty}>
                        <Ionicons name="images-outline" size={32} color="#D1D1D6" />
                        <Text style={styles.emptyText}>No Photos</Text>
                    </View>
                )}
            </View>
        </OutlinedCard>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        padding: 20,
        height: 240,
        borderRadius: 32,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    iconBg: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FF3B30', // Soft Red Icon
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    grid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        alignContent: 'center',
    },
    imageWrapper: {
        width: '46%',
        height: '46%',
        borderRadius: 12,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 14,
        fontWeight: '500',
    },
});
