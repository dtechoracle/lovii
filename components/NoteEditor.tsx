import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Canvas, { PathData } from './Canvas';
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

// Cross-platform fonts that work on both iOS and Android
const FONTS = [
    {
        name: 'Default',
        value: Platform.OS === 'ios' ? 'System' : 'Roboto',
        fallback: undefined // Use system default
    },
    {
        name: 'Serif',
        value: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fallback: 'serif'
    },
    {
        name: 'Monospace',
        value: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fallback: 'monospace'
    },
    {
        name: 'Cursive',
        value: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
        fallback: 'cursive'
    },
    {
        name: 'Modern',
        value: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
        fallback: 'sans-serif'
    },
];

export default function NoteEditor({ onSend, onCancel }: NoteEditorProps) {
    const { theme } = useTheme();
    const [mode, setMode] = useState<'text' | 'drawing'>('drawing');
    const [text, setText] = useState('');
    const [paths, setPaths] = useState<PathData[]>([]);
    const [selectedColor, setSelectedColor] = useState(PALETTE[0]);
    const [selectedFont, setSelectedFont] = useState<string | undefined>(FONTS[0].fallback);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const viewShotRef = useRef<ViewShot>(null);

    const handleUndo = () => {
        if (paths.length > 0) {
            const newPaths = paths.slice(0, -1);
            setPaths(newPaths);
        }
    };

    const handleClear = () => {
        setPaths([]);
    };

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

    const handleDrawingSend = async () => {
        try {
            let imageBase64 = null;
            if (viewShotRef.current && (viewShotRef.current as any).capture) {
                imageBase64 = await (viewShotRef.current as any).capture();
            }

            const contentObj = {
                paths,
                preview: imageBase64
            };

            onSend(JSON.stringify(contentObj), 'drawing', selectedColor);

        } catch (e) {
            console.error(e);
            onSend(JSON.stringify({ paths }), 'drawing', selectedColor);
        }
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={80}
        >
            <ScreenHeader
                showBack
                onBack={onCancel}
                title={
                    <View style={[styles.modeSwitch, { backgroundColor: theme.card }]}>
                        <TouchableOpacity
                            style={[styles.modeBtn, mode === 'drawing' && [styles.activeMode, { backgroundColor: theme.primary, shadowColor: theme.primary }]]}
                            onPress={() => setMode('drawing')}
                        >
                            <Ionicons name="pencil" size={20} color={mode === 'drawing' ? '#FFF' : theme.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, mode === 'text' && [styles.activeMode, { backgroundColor: theme.primary, shadowColor: theme.primary }]]}
                            onPress={() => setMode('text')}
                        >
                            <Ionicons name="text" size={20} color={mode === 'text' ? '#FFF' : theme.textSecondary} />
                        </TouchableOpacity>
                    </View>
                }
                rightAction={
                    <TouchableOpacity onPress={mode === 'drawing' ? handleDrawingSend : handleSend} style={[styles.sendBtn, { backgroundColor: theme.primary }]}>
                        <Text style={styles.sendText}>Send</Text>
                    </TouchableOpacity>
                }
            />

            <View style={styles.editorArea}>
                <OutlinedCard style={{ flex: 1, padding: 0, overflow: 'hidden', borderRadius: 32, backgroundColor: theme.card }}>
                    {mode === 'text' ? (
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    {
                                        color: selectedColor,
                                        fontFamily: selectedFont,
                                        fontWeight: isBold ? 'bold' : 'normal',
                                        fontStyle: isItalic ? 'italic' : 'normal',
                                        textDecorationLine: isUnderline ? 'underline' : 'none',
                                    }
                                ]}
                                multiline
                                placeholder="Write something..."
                                placeholderTextColor="#C7C7CC"
                                value={text}
                                onChangeText={setText}
                                autoFocus
                                autoCapitalize="sentences"
                                autoCorrect={true}
                            />
                        </ScrollView>
                    ) : (
                        <ViewShot
                            ref={viewShotRef}
                            options={{ format: "jpg", quality: 0.8, result: "data-uri" }}
                            style={{ flex: 1, backgroundColor: '#FFFFFF' }}
                        >
                            <Canvas
                                color={selectedColor}
                                strokeWidth={6}
                                paths={paths}
                                onPathsChange={setPaths}
                            />
                        </ViewShot>
                    )}
                </OutlinedCard>
            </View>

            {/* Text Styling Options */}
            {mode === 'text' && (
                <View style={[styles.stylingBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stylingScroll}>
                        {/* Font Picker */}
                        <View style={styles.fontPicker}>
                            {FONTS.map(font => {
                                const isSelected = selectedFont === font.fallback || selectedFont === font.value;
                                return (
                                    <TouchableOpacity
                                        key={font.name}
                                        style={[
                                            styles.fontBtn,
                                            {
                                                backgroundColor: theme.card,
                                                borderWidth: 2,
                                                borderColor: isSelected ? theme.primary : 'transparent'
                                            },
                                            isSelected && { backgroundColor: theme.primary }
                                        ]}
                                        onPress={() => setSelectedFont(font.fallback)}
                                    >
                                        <Text style={[
                                            styles.fontBtnText,
                                            { color: isSelected ? '#FFF' : theme.text },
                                            font.fallback && { fontFamily: font.fallback },
                                            // Make font preview slightly larger for better visibility
                                            { fontSize: 15 }
                                        ]}>
                                            Aa
                                        </Text>
                                        <Text style={[
                                            styles.fontNameText,
                                            { color: isSelected ? '#FFF' : theme.textSecondary }
                                        ]}>
                                            {font.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Divider */}
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        {/* Text Style Buttons */}
                        <View style={styles.styleButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.styleBtn,
                                    { backgroundColor: theme.card },
                                    isBold && { backgroundColor: theme.primary }
                                ]}
                                onPress={() => setIsBold(!isBold)}
                            >
                                <Text style={[styles.styleBtnText, { color: isBold ? '#FFF' : theme.text, fontWeight: 'bold' }]}>B</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.styleBtn,
                                    { backgroundColor: theme.card },
                                    isItalic && { backgroundColor: theme.primary }
                                ]}
                                onPress={() => setIsItalic(!isItalic)}
                            >
                                <Text style={[styles.styleBtnText, { color: isItalic ? '#FFF' : theme.text, fontStyle: 'italic' }]}>I</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.styleBtn,
                                    { backgroundColor: theme.card },
                                    isUnderline && { backgroundColor: theme.primary }
                                ]}
                                onPress={() => setIsUnderline(!isUnderline)}
                            >
                                <Text style={[styles.styleBtnText, { color: isUnderline ? '#FFF' : theme.text, textDecorationLine: 'underline' }]}>U</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            )}

            {/* Drawing Tools */}
            {mode === 'drawing' && (
                <View style={[styles.stylingBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                    <View style={styles.drawingTools}>
                        <TouchableOpacity
                            style={[styles.toolBtn, { backgroundColor: theme.card }]}
                            onPress={handleUndo}
                            disabled={paths.length === 0}
                        >
                            <Ionicons name="arrow-undo" size={20} color={paths.length === 0 ? theme.textSecondary : theme.text} />
                            <Text style={[styles.toolBtnText, { color: paths.length === 0 ? theme.textSecondary : theme.text }]}>Undo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.toolBtn, { backgroundColor: theme.card }]}
                            onPress={handleClear}
                            disabled={paths.length === 0}
                        >
                            <Ionicons name="trash-outline" size={20} color={paths.length === 0 ? theme.textSecondary : theme.error} />
                            <Text style={[styles.toolBtnText, { color: paths.length === 0 ? theme.textSecondary : theme.error }]}>Clear</Text>
                        </TouchableOpacity>

                        <View style={{ flex: 1 }} />

                        <View style={[styles.pathCounter, { backgroundColor: theme.card }]}>
                            <Ionicons name="brush" size={16} color={theme.textSecondary} />
                            <Text style={[styles.counterText, { color: theme.textSecondary }]}>{paths.length} stroke{paths.length !== 1 ? 's' : ''}</Text>
                        </View>
                    </View>
                </View>
            )}

            <View style={[styles.colorPicker, { backgroundColor: theme.background }]}>
                <Text style={[styles.colorLabel, { color: theme.textSecondary }]}>
                    {mode === 'drawing' ? 'Brush Color' : 'Text Color'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {PALETTE.map(color => (
                        <TouchableOpacity
                            key={color}
                            style={[
                                styles.colorSwatch,
                                { backgroundColor: color },
                                selectedColor === color && [styles.selectedSwatch, { borderColor: theme.primary }]
                            ]}
                            onPress={() => setSelectedColor(color)}
                        />
                    ))}
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    sendBtn: {
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
        minHeight: 400,
        padding: 24,
        fontSize: 24,
        textAlignVertical: 'top',
    },
    stylingBar: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    stylingScroll: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    fontPicker: {
        flexDirection: 'row',
        gap: 8,
    },
    fontBtn: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        alignItems: 'center',
        minWidth: 60,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    fontBtnText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 2,
    },
    fontNameText: {
        fontSize: 10,
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 32,
        marginHorizontal: 8,
    },
    styleButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    styleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    styleBtnText: {
        fontSize: 18,
        fontWeight: '600',
    },
    colorPicker: {
        padding: 16,
        paddingBottom: 40,
    },
    colorLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    colorSwatch: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
        borderWidth: 2,
        borderColor: '#FFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedSwatch: {
        transform: [{ scale: 1.2 }],
        borderWidth: 3,
    },
    drawingTools: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toolBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    toolBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    pathCounter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    counterText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
