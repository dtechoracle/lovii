import { StorageService, Task } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TaskCard() {
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

    return (
        <View style={styles.card}>
            <Text style={styles.title}>To-do list</Text>

            <View style={styles.list}>
                {tasks.slice(0, 3).map(t => (
                    <TouchableOpacity key={t.id} style={styles.item} onPress={() => toggleTask(t.id)}>
                        <Ionicons
                            name={t.completed ? "checkmark-circle" : "ellipse-outline"}
                            size={20}
                            color={t.completed ? "#8E8E93" : "#FFF"}
                        />
                        <Text style={[styles.itemText, t.completed && styles.itemTextDone]}>{t.text}</Text>
                    </TouchableOpacity>
                ))}
                {tasks.length === 0 && (
                    <Text style={styles.emptyText}>No tasks yet</Text>
                )}
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add task..."
                    placeholderTextColor="#636366"
                    value={newTask}
                    onChangeText={setNewTask}
                    onSubmitEditing={handleAddTask}
                />
                <TouchableOpacity onPress={handleAddTask}>
                    <Ionicons name="add-circle" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: '#1C1C1E',
        borderRadius: 32,
        padding: 20,
        height: 240,
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 12,
    },
    list: {
        gap: 12,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#2C2C2E',
        padding: 12,
        borderRadius: 16,
    },
    itemText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    itemTextDone: {
        color: '#8E8E93',
        textDecorationLine: 'line-through',
    },
    emptyText: {
        color: '#636366',
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    input: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
    },
});
