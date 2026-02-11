import ScreenHeader from '@/components/ScreenHeader';
import OutlinedCard from '@/components/ui/OutlinedCard';
import { useTheme } from '@/context/ThemeContext';
import { StorageService, Task } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TodoScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        const t = await StorageService.getTasks();
        setTasks(t);
    };

    const handleAddTask = async () => {
        if (!newTask.trim()) return;
        const t: Task = { id: Date.now().toString(), text: newTask, completed: false };
        const updated = [t, ...tasks];
        setTasks(updated);
        await StorageService.saveTasks(updated);
        setNewTask('');
    };

    const toggleTask = async (id: string) => {
        const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        setTasks(updated);
        await StorageService.saveTasks(updated);
    };

    const deleteTask = async (id: string) => {
        const updated = tasks.filter(t => t.id !== id);
        setTasks(updated);
        await StorageService.saveTasks(updated);
    };

    const renderItem = ({ item }: { item: Task }) => (
        <TouchableOpacity activeOpacity={0.8} onPress={() => toggleTask(item.id)}>
            <OutlinedCard style={[styles.item, item.completed && styles.itemDone]}>
                <TouchableOpacity style={styles.checkBtn} onPress={() => toggleTask(item.id)}>
                    <Ionicons
                        name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={item.completed ? "#4B6EFF" : "#8E8E93"}
                    />
                </TouchableOpacity>
                <Text style={[styles.itemText, item.completed && styles.itemTextDone]}>{item.text}</Text>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
            </OutlinedCard>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <StatusBar barStyle="dark-content" />
            <ScreenHeader title="Tasks" showBack />

            <View style={{ flex: 1 }}>
                <FlatList
                    data={tasks}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="checkbox-outline" size={64} color="#C7C7CC" />
                            <Text style={styles.emptyText}>No tasks yet</Text>
                        </View>
                    }
                />
            </View>

            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Add a new task..."
                        placeholderTextColor="#8E8E93"
                        value={newTask}
                        onChangeText={setNewTask}
                        onSubmitEditing={handleAddTask}
                    />
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddTask}>
                        <Ionicons name="arrow-up" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    list: {
        paddingHorizontal: 24,
        paddingBottom: 100,
        gap: 12,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
    },
    itemDone: {
        opacity: 0.6,
        backgroundColor: '#F9F9F9',
    },
    checkBtn: {
        marginRight: 12,
    },
    itemText: {
        flex: 1,
        color: '#1C1C1E',
        fontSize: 16,
        fontWeight: '600',
    },
    itemTextDone: {
        textDecorationLine: 'line-through',
        color: '#8E8E93',
    },
    deleteBtn: {
        padding: 8,
    },
    empty: {
        alignItems: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        color: '#8E8E93',
        fontSize: 18,
        fontWeight: '600',
    },
    inputContainer: {
        padding: 24,
        paddingBottom: 40,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        // Soft Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    input: {
        flex: 1,
        color: '#1C1C1E',
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 8,
    },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4B6EFF', // Primary
        alignItems: 'center',
        justifyContent: 'center',
    },
});
