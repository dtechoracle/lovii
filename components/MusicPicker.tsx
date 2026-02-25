import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface MusicTrack {
    title: string;
    artist: string;
    coverUrl: string;
    previewUrl?: string;
    externalUrl?: string;
}

interface MusicPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (track: MusicTrack) => void;
}

export default function MusicPicker({ visible, onClose, onSelect }: MusicPickerProps) {
    const { theme } = useTheme();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2) {
                searchMusic(query);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const searchMusic = async (term: string) => {
        setLoading(true);
        try {
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=20`);
            const data = await response.json();

            const tracks = data.results.map((item: any) => ({
                title: item.trackName,
                artist: item.artistName,
                coverUrl: item.artworkUrl100.replace('100x100', '600x600'), // Get higher res
                previewUrl: item.previewUrl,
                externalUrl: item.trackViewUrl
            }));

            setResults(tracks);
        } catch (error) {
            console.error('Music search failed', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.title, { color: theme.text }]}>Pick a Song</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close-circle" size={30} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
                        <Ionicons name="search" size={20} color={theme.textSecondary} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Search songs, artists..."
                            placeholderTextColor={theme.textSecondary}
                            value={query}
                            onChangeText={setQuery}
                            autoFocus
                        />
                        {loading && <ActivityIndicator size="small" color={theme.primary} />}
                    </View>
                </View>

                {/* Results */}
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.previewUrl || item.title}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.trackItem, { borderBottomColor: theme.border }]}
                            onPress={() => onSelect(item)}
                        >
                            <Image source={{ uri: item.coverUrl }} style={styles.coverArt} />
                            <View style={styles.trackInfo}>
                                <Text style={[styles.trackTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                                <Text style={[styles.trackArtist, { color: theme.textSecondary }]} numberOfLines={1}>{item.artist}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 4,
    },
    searchContainer: {
        padding: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 40,
    },
    trackItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 16,
    },
    coverArt: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#eee',
    },
    trackInfo: {
        flex: 1,
    },
    trackTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    trackArtist: {
        fontSize: 14,
    },
});
