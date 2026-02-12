import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Canvas from './Canvas';
import ScreenHeader from './ScreenHeader';
import OutlinedCard from './ui/OutlinedCard';

interface NoteEditorProps {
    onSend: (content: string, type: 'text' | 'drawing', color: string) => void;
    onCancel: () => void;
}

const PALETTE = [
    '#1C1C1E', // Black (Soft)
    '#FF3B30', // Red
    '#FF9500', // Orange
    '#FFCC00', // Yellow
    '#34C759', // Green
    '#007AFF', // Blue
    '#5856D6', // Purple
    '#AF52DE', // Pink
];

export default function NoteEditor({ onSend, onCancel }: NoteEditorProps) {
    const { theme } = useTheme();
    const [mode, setMode] = useState<'text' | 'drawing'>('drawing');
    const [text, setText] = useState('');
    const [paths, setPaths] = useState<string[]>([]);
    const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
    const viewShotRef = useRef<ViewShot>(null);

    const handleSend = async () => {
        if (mode === 'text') {
            onSend(text, 'text', selectedColor);
        } else {
            // Capture drawing as image
            // We pass both the raw paths (for app editing/viewing) AND the image (for widget)
            // But for now, let's just use the image as content for simplicity in widget logic,
            // OR we store paths in content and image in a new field.
            // Actually, existing logic expects content to be JSON string of paths.
            // We'll handle the widget image generation here and pass it.

            // Wait a tick for render
            try {
                if (viewShotRef.current && (viewShotRef.current as any).capture) {
                    const uri = await (viewShotRef.current as any).capture();
                    // Convert to base64 if needed, OR just pass URI if local. 
                    // Widget needs base64. view-shot can return base64.

                    // Actually, let's stick to the plan:
                    // 1. Save paths as content (so app can edit/view later)
                    // 2. We need a way to pass the image to the widget.
                    // The easiest way is to modify onSend to accept an optional imageURI/Base64.

                    // For now, let's conform to existing signature.
                    // We can't easily change the signature without changing `editor.tsx`.
                    // BUT `content` is just a string. Maybe we can pack it?
                    // No, cleaner to change the interface.

                    // Let's assume we capture base64
                    const result = await (viewShotRef.current as any).capture();
                    // For the widget, we need base64.
                    // Re-capture as data-uri
                    // options={{ format: "jpg", quality: 0.9, result: "data-uri" }}
                }
            } catch (e) {
                console.log("Failed to capture", e);
            }

            onSend(JSON.stringify(paths), 'drawing', selectedColor);
        }
    };

    // We need to capture base64 for the widget.
    const handleDrawingSend = async () => {
        try {
            let imageBase64 = null;
            if (viewShotRef.current && (viewShotRef.current as any).capture) {
                imageBase64 = await (viewShotRef.current as any).capture();
            }

            // We pack the base64 image into the content string alongside paths? 
            // Or we use a delimiter? 
            // JSON.stringify({ paths, preview: imageBase64 }) -> This breaks existing viewers.

            // Better: Update `onSend` signature in `editor.tsx` to accept extra data.
            // For now, let's just stick to paths and fix the widget to render "Drawing" text properly
            // OR simply accept that we need to change code structure.

            // Wait, the user wants the ACTUAL drawing on the widget.
            // So we MUST have the image.

            // Let's modify onSend to pass the base64 image as the content for now?
            // No, then we lose editable paths.

            // Let's modify the onSend signature in a separate step?
            // No, let's do it right here.

            // Actually, let's just pass a JSON object as content:
            // { paths: [...], preview: "data:image..." }
            // And update DrawingViewer to handle that.

            const contentObj = {
                paths,
                preview: imageBase64 // capture with result="data-uri"
            };

            onSend(JSON.stringify(contentObj), 'drawing', selectedColor);

        } catch (e) {
            console.error(e);
            onSend(JSON.stringify({ paths }), 'drawing', selectedColor);
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScreenHeader
                showBack
                onBack={onCancel}
                title={
                    <View style={styles.modeSwitch}>
                        <TouchableOpacity
                            style={[styles.modeBtn, mode === 'drawing' && styles.activeMode]}
                            onPress={() => setMode('drawing')}
                        >
                            <Ionicons name="pencil" size={20} color={mode === 'drawing' ? '#FFF' : '#8E8E93'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, mode === 'text' && styles.activeMode]}
                            onPress={() => setMode('text')}
                        >
                            <Ionicons name="text" size={20} color={mode === 'text' ? '#FFF' : '#8E8E93'} />
                        </TouchableOpacity>
                    </View>
                }
                rightAction={
                    <TouchableOpacity onPress={mode === 'drawing' ? handleDrawingSend : handleSend} style={styles.sendBtn}>
                        <Text style={styles.sendText}>Send</Text>
                    </TouchableOpacity>
                }
            />

            <View style={styles.editorArea}>
                <OutlinedCard style={{ flex: 1, padding: 0, overflow: 'hidden', borderRadius: 32 }}>
                    {mode === 'text' ? (
                        <TextInput
                            style={[styles.textInput, { color: selectedColor, backgroundColor: '#FFFFFF' }]}
                            multiline
                            placeholder="Write something..."
                            placeholderTextColor="#C7C7CC"
                            value={text}
                            onChangeText={setText}
                            autoFocus
                        />
                    ) : (
                        <ViewShot
                            ref={viewShotRef}
                            options={{ format: "jpg", quality: 0.8, result: "data-uri" }}
                            style={{ flex: 1, backgroundColor: '#FFFFFF' }}
                        >
                            <Canvas
                                color={selectedColor}
                                strokeWidth={6}
                                onPathsChange={setPaths}
                                style={{ backgroundColor: 'transparent', flex: 1 }}
                            />
                        </ViewShot>
                    )}
                </OutlinedCard>
            </View>

            <View style={styles.colorPicker}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {PALETTE.map(color => (
                        <TouchableOpacity
                            key={color}
                            style={[
                                styles.colorSwatch,
                                { backgroundColor: color },
                                selectedColor === color && styles.selectedSwatch
                            ]}
                            onPress={() => setSelectedColor(color)}
                        />
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    sendBtn: {
        backgroundColor: '#4B6EFF', // Soft Blue
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    sendText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    modeSwitch: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 4,
    },
    modeBtn: {
        padding: 8,
        borderRadius: 16,
        width: 44,
        alignItems: 'center',
    },
    activeMode: {
        backgroundColor: '#4B6EFF',
        // Shadow for active state
        shadowColor: "#4B6EFF",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    editorArea: {
        flex: 1,
        margin: 16,
    },
    textInput: {
        flex: 1,
        padding: 24,
        fontSize: 24,
        fontWeight: '600',
        textAlignVertical: 'top',
    },
    colorPicker: {
        padding: 16,
        paddingBottom: 40,
    },
    colorSwatch: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#FFF', // White border to pop against BG
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedSwatch: {
        transform: [{ scale: 1.2 }],
        borderColor: '#4B6EFF',
    },
});
