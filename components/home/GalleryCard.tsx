import { useTheme } from '@/context/ThemeContext';
import { StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OutlinedCard from '../ui/OutlinedCard';

export default function GalleryCard() {
    const { theme } = useTheme();
    const router = useRouter();
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
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/collage')}>
            <OutlinedCard style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.header}>
                    <View style={[styles.iconBg, { backgroundColor: theme.primary }]}>
                        <Ionicons name="images" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>Gallery</Text>
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
                            <Ionicons name="images-outline" size={40} color={theme.primary + '40'} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No photos yet</Text>
                            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Tap to create a collage!</Text>
                        </View>
                    )}
                </View>
            </OutlinedCard>
        </TouchableOpacity>
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
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
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    emptySubtext: {
        fontSize: 12,
        fontWeight: '500',
    },
});
