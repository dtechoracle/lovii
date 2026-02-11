import ScreenHeader from '@/components/ScreenHeader';
import OutlinedCard from '@/components/ui/OutlinedCard';
import { useTheme } from '@/context/ThemeContext';
import { Note, StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 48) / 2 - 24;

export default function CollageScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [images, setImages] = useState<string[]>([]);

    const pickImage = async () => {
        if (images.length >= 4) {
            Alert.alert("Limit Reached", "You can only select up to 4 images.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImages([...images, result.assets[0].uri]);
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
                    encoding: FileSystem.EncodingType.Base64,
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
                <OutlinedCard style={styles.card}>
                    <View style={styles.grid}>
                        {images.map((uri, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image source={{ uri }} style={styles.image} />
                                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                                    <Ionicons name="close-circle" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {images.length < 4 && (
                            <TouchableOpacity style={styles.addBtn} onPress={pickImage}>
                                <Ionicons name="add" size={32} color="#4B6EFF" />
                                <Text style={styles.addText}>Add Photo</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </OutlinedCard>

                <Text style={styles.hint}>
                    Select up to 4 photos for your partner's widget.
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
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'center',
    },
    imageWrapper: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
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
