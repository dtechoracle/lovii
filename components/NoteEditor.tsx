import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

    const handleSend = () => {
        if (mode === 'text') {
            onSend(text, 'text', selectedColor);
        } else {
            onSend(JSON.stringify(paths), 'drawing', selectedColor);
        }
    };

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
                    <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
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
                        <Canvas
                            color={selectedColor}
                            strokeWidth={6}
                            onPathsChange={setPaths}
                            style={{ backgroundColor: '#FFFFFF', flex: 1 }}
                        />
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
