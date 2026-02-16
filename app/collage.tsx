import ScreenHeader from '@/components/ScreenHeader';
import OutlinedCard from '@/components/ui/OutlinedCard';
import { useTheme } from '@/context/ThemeContext';
import { Note, StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const GRID_PADDING = 24;
const GRID_GAP = 12;
const MAX_IMAGES = 9; // Support up to 9 images (3x3 grid)
const COLUMNS = 3; // Always use 3 columns for better layout
const IMAGE_SIZE = (width - (GRID_PADDING * 2) - (GRID_GAP * (COLUMNS - 1))) / COLUMNS;

export default function CollageScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [images, setImages] = useState<string[]>([]);

    const pickImage = async () => {
        if (images.length >= MAX_IMAGES) {
            Alert.alert("Limit Reached", `You can only select up to ${MAX_IMAGES} images.`);
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: MAX_IMAGES - images.length,
            allowsEditing: false, // Disable editing to support multiple selection
            quality: 0.8,
        });

        if (!result.canceled) {
            const newImages = result.assets.map(asset => asset.uri);
            const totalImages = [...images, ...newImages].slice(0, MAX_IMAGES);
            setImages(totalImages);

            if (totalImages.length >= MAX_IMAGES) {
                Alert.alert("Maximum Reached", `You've reached the maximum of ${MAX_IMAGES} images.`);
            }
        }
    };

    const removeImage = (index: number) => {
        const updated = [...images];
        updated.splice(index, 1);
        setImages(updated);
    };

    const handleSend = async () => {
        if (images.length === 0) return;

        // Compress and Convert to Base64
        const processedImages: string[] = [];
        try {
            for (const uri of images) {
                // Resize to max 800px width to keep payload reasonable
                const manipulated = await ImageManipulator.manipulateAsync(
                    uri,
                    [{ resize: { width: 800 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );

                const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
                    encoding: 'base64',
                });

                processedImages.push(`data:image/jpeg;base64,${base64}`);
            }

            const note: Note = {
                id: Date.now().toString(),
                type: 'collage',
                content: '',
                images: processedImages,
                timestamp: Date.now(),
            };

            await StorageService.saveMyNote(note);
            router.replace('/');
        } catch (error) {
            Alert.alert("Error", "Failed to process images. Please try fewer images.");
            console.error(error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScreenHeader
                title="Create Collage"
                showBack
                rightAction={
                    <TouchableOpacity onPress={handleSend} disabled={images.length === 0}>
                        <Text style={[styles.sendText, images.length === 0 && styles.disabledText]}>Send</Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={styles.content}>
                <OutlinedCard style={[styles.card, { backgroundColor: theme.card }]}>
                    <View style={styles.grid}>
                        {Array.from({ length: Math.ceil(MAX_IMAGES / COLUMNS) }).map((_, rowIndex) => (
                            <View key={rowIndex} style={styles.row}>
                                {Array.from({ length: COLUMNS }).map((_, colIndex) => {
                                    const index = rowIndex * COLUMNS + colIndex;
                                    const hasImage = images[index];
                                    const canAddMore = images.length < MAX_IMAGES;

                                    if (hasImage) {
                                        return (
                                            <View key={index} style={styles.imageWrapper}>
                                                <Image source={{ uri: images[index] }} style={styles.image} />
                                                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                                                    <Ionicons name="close-circle" size={24} color="#FFF" />
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    } else if (index === images.length && canAddMore) {
                                        // Show "Add" button only for the next available slot
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                style={[styles.addBtn, { backgroundColor: theme.background }]}
                                                onPress={pickImage}
                                            >
                                                <Ionicons name="add" size={32} color={theme.primary} />
                                                <Text style={[styles.addText, { color: theme.primary }]}>Add</Text>
                                            </TouchableOpacity>
                                        );
                                    } else {
                                        // Empty slot (hidden)
                                        return <View key={index} style={styles.emptySlot} />;
                                    }
                                })}
                            </View>
                        ))}
                    </View>
                </OutlinedCard>

                <Text style={[styles.hint, { color: theme.textSecondary }]}>
                    Select up to {MAX_IMAGES} photos • Tap + to add multiple images at once
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    sendText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B6EFF',
    },
    disabledText: {
        opacity: 0.3,
        color: '#8E8E93',
    },
    content: {
        padding: 24,
    },
    card: {
        padding: 24,
        marginBottom: 24,
        minHeight: 300,
        justifyContent: 'center',
        borderRadius: 32,
    },
    grid: {
        gap: GRID_GAP,
    },
    row: {
        flexDirection: 'row',
        gap: GRID_GAP,
        justifyContent: 'center',
    },
    imageWrapper: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
    },
    emptySlot: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    removeBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
    },
    addBtn: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#E5E5EA',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FAFAFA',
    },
    addText: {
        color: '#4B6EFF',
        fontWeight: '600',
        fontSize: 14,
    },
    hint: {
        color: '#8E8E93',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '400',
    },
});
