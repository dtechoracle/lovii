import ScreenHeader from '@/components/ScreenHeader';
import { Colors } from '@/constants/theme';
import { StorageService, Task } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TodoScreen() {
    const router = useRouter();
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
        <View style={styles.item}>
            <TouchableOpacity style={styles.checkBtn} onPress={() => toggleTask(item.id)}>
                <Ionicons
                    name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={item.completed ? "#8E8E93" : Colors.dark.primary}
                />
            </TouchableOpacity>
            <Text style={[styles.itemText, item.completed && styles.itemTextDone]}>{item.text}</Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />
            <ScreenHeader title="Shared Tasks" showBack />

            <View style={{ flex: 1 }}>
                <FlatList
                    data={tasks}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="checkbox-outline" size={64} color="#3A3A3C" />
                            <Text style={styles.emptyText}>No tasks yet. Add one!</Text>
                        </View>
                    }
                />
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add a new task..."
                    placeholderTextColor="#636366"
                    value={newTask}
                    onChangeText={setNewTask}
                    onSubmitEditing={handleAddTask}
                />
                <TouchableOpacity style={styles.addBtn} onPress={handleAddTask}>
                    <Ionicons name="arrow-up" size={24} color="#000" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
        paddingTop: 60,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
    },
    checkBtn: {
        marginRight: 12,
    },
    itemText: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    itemTextDone: {
        color: '#8E8E93',
        textDecorationLine: 'line-through',
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
        color: '#636366',
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1C1C1E',
        margin: 20,
        borderRadius: 30,
        gap: 12,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        paddingVertical: 8,
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.dark.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
