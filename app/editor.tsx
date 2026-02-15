import NoteEditor from '@/components/NoteEditor';
import { Note, StorageService } from '@/services/storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function EditorScreen() {
    const router = useRouter();
    const [isSending, setIsSending] = useState(false);

    const handleSend = async (content: string, type: 'text' | 'drawing', color: string, sendToWidget: boolean = false) => {
        if (isSending) return;

        setIsSending(true);

        try {
            const newNote: Note = {
                id: Date.now().toString(),
                type,
                content,
                timestamp: Date.now(),
                color,
            };

            if (sendToWidget) {
                // Send to partner's widget (verifies partner and fetches their widget status)
                const result = await StorageService.sendToPartnerWidget(newNote);

                if (!result.success) {
                    Alert.alert(
                        'Failed to Send',
                        result.error || 'Could not send to partner\'s widget',
                        [{ text: 'OK' }]
                    );
                    setIsSending(false);
                    return;
                }

                // Show success with partner widget status
                let message = `Note sent to ${result.partner?.name || 'your partner'}!`;

                if (result.partnerWidget) {
                    if (result.partnerWidget.hasNote) {
                        const lastNoteTime = new Date(result.partnerWidget.lastNote.timestamp).toLocaleString();
                        message += `\n\n📱 Their widget shows:\n"${result.partnerWidget.lastNote.content.slice(0, 50)}${result.partnerWidget.lastNote.content.length > 50 ? '...' : ''}"\n\nLast updated: ${lastNoteTime}`;
                    } else {
                        message += '\n\n📱 Their widget is empty (no notes yet)';
                    }
                }

                Alert.alert(
                    '✅ Sent!',
                    message,
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                // Just save locally
                await StorageService.saveMyNote(newNote);
                router.back();
            }
        } catch (error) {
            console.error('Error sending note:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <View style={styles.container}>
            <NoteEditor
                onSend={handleSend}
                onCancel={() => router.back()}
                isSending={isSending}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
