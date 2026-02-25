import CustomAlert from '@/components/CustomAlert';
import NoteEditor from '@/components/NoteEditor';
import { Note, StorageService } from '@/services/storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function EditorScreen() {
    const router = useRouter();
    const [isSending, setIsSending] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        options: { text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
    } | null>(null);

    const handleSend = async (
        content: string,
        type: 'text' | 'drawing' | 'music',
        color: string,
        sendToWidget: boolean = false,
        fontStyles?: {
            fontFamily?: string;
            fontWeight?: string;
            fontStyle?: string;
            textDecorationLine?: string;
        },
        musicTrack?: {
            title: string;
            artist: string;
            coverUrl: string;
            previewUrl?: string;
            externalUrl?: string;
        }
    ) => {
        if (isSending) return;

        setIsSending(true);

        try {
            const newNote: Note = {
                id: Date.now().toString(),
                type,
                content,
                timestamp: Date.now(),
                color,
                // Add font styles if present
                ...(fontStyles || {}),
                musicTrack,
            };

            if (sendToWidget) {
                // Send to partner's widget (verifies partner and fetches their widget status)
                const result = await StorageService.sendToPartnerWidget(newNote);

                if (!result.success) {
                    setAlertConfig({
                        visible: true,
                        title: 'Failed to Send',
                        message: result.error || 'Could not send to partner\'s widget',
                        options: [{ text: 'OK', onPress: () => { setAlertConfig(prev => prev ? { ...prev, visible: false } : null) } }]
                    });
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

                setAlertConfig({
                    visible: true,
                    title: '✅ Sent!',
                    message,
                    options: [{
                        text: 'OK', onPress: () => {
                            setAlertConfig(prev => prev ? { ...prev, visible: false } : null);
                            router.back();
                        }
                    }]
                });
            } else {
                // Just save locally
                await StorageService.saveMyNote(newNote);
                router.back();
            }
        } catch (error) {
            console.error('Error sending note:', error);
            setAlertConfig({
                visible: true,
                title: 'Error',
                message: 'Something went wrong. Please try again.',
                options: [{ text: 'OK', onPress: () => { setAlertConfig(prev => prev ? { ...prev, visible: false } : null) } }]
            });
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

            {alertConfig && (
                <CustomAlert
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    options={alertConfig.options}
                    onClose={() => setAlertConfig(prev => prev ? { ...prev, visible: false } : null)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
