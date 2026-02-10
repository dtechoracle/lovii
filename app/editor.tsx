import NoteEditor from '@/components/NoteEditor';
import { Note, StorageService } from '@/services/storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function EditorScreen() {
    const router = useRouter();

    const handleSend = async (content: string, type: 'text' | 'drawing', color: string) => {
        const newNote: Note = {
            id: Date.now().toString(),
            type,
            content,
            timestamp: Date.now(),
            color,
        };

        await StorageService.saveMyNote(newNote);
        router.back();
    };

    return (
        <View style={styles.container}>
            <NoteEditor
                onSend={handleSend}
                onCancel={() => router.back()}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
