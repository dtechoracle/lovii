import ScreenHeader from '@/components/ScreenHeader';
import { Colors } from '@/constants/theme';
import { Note, StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

export default function HistoryScreen() {
    const router = useRouter();
    const [history, setHistory] = useState<Note[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const h = await StorageService.getMyHistory();
        setHistory(h);
    };

    const renderItem = ({ item }: { item: Note }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.date}>
                    {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View style={styles.typeBadge}>
                    <Ionicons
                        name={item.type === 'drawing' ? 'brush' : item.type === 'collage' ? 'images' : 'text'}
                        size={12}
                        color="#000"
                    />
                    <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
                </View>
            </View>

            {item.type === 'text' && (
                <Text style={styles.content}>{item.content}</Text>
            )}

            {item.type === 'drawing' && (
                <View style={styles.imageContainer}>
                    {/* Placeholder for drawing rendering if needed, or just text */}
                    <Text style={styles.placeholderText}>Drawing</Text>
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
    );

    return (
        <View style={styles.container}>
            <ScreenHeader title="History" showBack />
            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="time-outline" size={64} color="#3A3A3C" />
                        <Text style={styles.emptyText}>No history yet.</Text>
                    </View>
                }
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
    list: {
        padding: 20,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    date: {
        color: '#8E8E93',
        fontSize: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#000',
    },
    content: {
        color: '#FFF',
        fontSize: 16,
        lineHeight: 24,
    },
    imageContainer: {
        height: 150,
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: '#636366',
    },
    collageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    collageImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#2C2C2E',
    },
    empty: {
        alignItems: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        color: '#636366',
        fontSize: 16,
    },
});
