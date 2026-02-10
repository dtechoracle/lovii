import ScreenHeader from '@/components/ScreenHeader';
import { Colors } from '@/constants/theme';
import { Note, StorageService } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 48) / 2 - 8; // 2 columns with gaps

export default function CollageScreen() {
    const router = useRouter();
    const [images, setImages] = useState<string[]>([]);

    const pickImage = async () => {
        if (images.length >= 4) {
            Alert.alert("Limit Reached", "You can only select up to 4 images for the widget.");
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

        const note: Note = {
            id: Date.now().toString(),
            type: 'collage',
            content: '', // Empty for collage
            images: images,
            timestamp: Date.now(),
        };

        await StorageService.saveMyNote(note);
        router.replace('/');
    };

    return (
        <View style={styles.container}>
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
                <View style={styles.previewContainer}>
                    <View style={styles.grid}>
                        {images.map((uri, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image source={{ uri }} style={styles.image} />
                                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {images.length < 4 && (
                            <TouchableOpacity style={styles.addBtn} onPress={pickImage}>
                                <Ionicons name="add" size={40} color="#3A3A3C" />
                                <Text style={styles.addText}>Add Photo</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <Text style={styles.hint}>
                    Select up to 4 photos to display on your partner's widget.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        paddingTop: 60,
    },
    sendText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.dark.primary,
    },
    disabledText: {
        color: '#3A3A3C',
    },
    content: {
        padding: 24,
    },
    previewContainer: {
        backgroundColor: '#1C1C1E',
        borderRadius: 32,
        padding: 16,
        marginBottom: 24,
        minHeight: 300,
        justifyContent: 'center',
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
        borderRadius: 16,
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
    },
    addBtn: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#2C2C2E',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addText: {
        color: '#636366',
        fontWeight: '600',
    },
    hint: {
        color: '#8E8E93',
        textAlign: 'center',
        fontSize: 14,
    },
});
