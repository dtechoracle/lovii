import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Canvas from './Canvas';
import ScreenHeader from './ScreenHeader';

interface NoteEditorProps {
    onSend: (content: string, type: 'text' | 'drawing', color: string) => void;
    onCancel: () => void;
}

const PALETTE = [
    '#FFFFFF', // White
    '#FFD60A', // Yellow (Primary)
    '#FF3B30', // Red
    '#FF9500', // Orange
    '#32D74B', // Green
    '#64D2FF', // Light Blue
    '#0A84FF', // Blue
    '#BF5AF2', // Purple
];

export default function NoteEditor({ onSend, onCancel }: NoteEditorProps) {
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
        <View style={styles.container}>
            <ScreenHeader
                showBack
                onBack={onCancel}
                title={
                    <View style={styles.modeSwitch}>
                        <TouchableOpacity
                            style={[styles.modeBtn, mode === 'drawing' && styles.activeMode]}
                            onPress={() => setMode('drawing')}
                        >
                            <Ionicons name="pencil" size={20} color={mode === 'drawing' ? '#000' : '#8E8E93'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeBtn, mode === 'text' && styles.activeMode]}
                            onPress={() => setMode('text')}
                        >
                            <Ionicons name="text" size={20} color={mode === 'text' ? '#000' : '#8E8E93'} />
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
                {mode === 'text' ? (
                    <TextInput
                        style={[styles.textInput, { color: selectedColor }]}
                        multiline
                        placeholder="Write a note..."
                        placeholderTextColor="#636366"
                        value={text}
                        onChangeText={setText}
                        autoFocus
                    />
                ) : (
                    <Canvas
                        color={selectedColor}
                        strokeWidth={4}
                        onPathsChange={setPaths}
                    />
                )}
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
        backgroundColor: '#000000', // Deep Black
        paddingTop: 60,
    },
    sendBtn: {
        backgroundColor: '#FFD60A', // Yellow
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    sendText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000', // Black text on Yellow
    },
    modeSwitch: {
        flexDirection: 'row',
        backgroundColor: '#2C2C2E',
        borderRadius: 8,
        padding: 2,
    },
    modeBtn: {
        padding: 6,
        borderRadius: 6,
        width: 40,
        alignItems: 'center',
    },
    activeMode: {
        backgroundColor: '#FFD60A', // Active Yellow
    },
    editorArea: {
        flex: 1,
        backgroundColor: '#1C1C1E', // Dark Card
        margin: 16,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2C2C2E',
    },
    textInput: {
        flex: 1,
        padding: 20,
        fontSize: 24,
        textAlignVertical: 'top',
    },
    colorPicker: {
        padding: 16,
        paddingBottom: 40,
        backgroundColor: '#1C1C1E',
        borderTopWidth: 1,
        borderTopColor: '#2C2C2E',
    },
    colorSwatch: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedSwatch: {
        borderColor: '#FFF',
        transform: [{ scale: 1.1 }],
    },
});
