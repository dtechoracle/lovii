import { useTheme } from '@/context/ThemeContext';
import { Note } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface NoteOptionsProps {
    visible: boolean;
    onClose: () => void;
    note: Note | null;
    onAction: (action: 'pin' | 'bookmark' | 'widget' | 'delete', note: Note) => void;
}

export default function NoteOptions({ visible, onClose, note, onAction }: NoteOptionsProps) {
    const { theme } = useTheme();

    if (!note) return null;

    const handleAction = (action: 'pin' | 'bookmark' | 'widget' | 'delete') => {
        onAction(action, note);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.sheet}>
                            <View style={styles.handle} />

                            <Text style={styles.title}>Note Options</Text>

                            <OptionItem
                                icon={note.pinned ? "pin" : "pin-outline"}
                                label={note.pinned ? "Unpin Note" : "Pin Note"}
                                onPress={() => handleAction('pin')}
                            />

                            <OptionItem
                                icon={note.bookmarked ? "bookmark" : "bookmark-outline"}
                                label={note.bookmarked ? "Remove Bookmark" : "Bookmark Note"}
                                onPress={() => handleAction('bookmark')}
                            />

                            <OptionItem
                                icon="phone-portrait-outline"
                                label="Send to Partner's Widget"
                                onPress={() => handleAction('widget')}
                            />

                            <View style={styles.divider} />

                            <OptionItem
                                icon="trash-outline"
                                label="Delete Note"
                                color="#FF3B30"
                                onPress={() => handleAction('delete')}
                            />

                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

function OptionItem({ icon, label, onPress, color = '#1C1C1E' }: { icon: any, label: string, onPress: () => void, color?: string }) {
    return (
        <TouchableOpacity style={styles.optionRow} onPress={onPress}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.optionText, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E5EA',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 20,
        textAlign: 'center',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    iconContainer: {
        width: 40,
        alignItems: 'center',
        marginRight: 12,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#F2F2F7',
        marginVertical: 8,
    },
    cancelBtn: {
        marginTop: 16,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 16,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
});
