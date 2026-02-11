import { StorageService, Task } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import OutlinedCard from '../ui/OutlinedCard';

export default function TaskCard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        loadTasks();
        const interval = setInterval(loadTasks, 5000);
        return () => clearInterval(interval);
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
        <OutlinedCard style={styles.card}>
            <View style={styles.header}>
                <View style={styles.iconBg}>
                    <Ionicons name="checkbox" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.title}>Tasks</Text>
            </View>

            <View style={styles.list}>
                {tasks.slice(0, 3).map(t => (
                    <TouchableOpacity key={t.id} style={styles.item} onPress={() => toggleTask(t.id)}>
                        <Ionicons
                            name={t.completed ? "checkmark-circle" : "ellipse-outline"}
                            size={20}
                            color={t.completed ? "#4B6EFF" : "#8E8E93"}
                        />
                        <Text style={[styles.itemText, t.completed && styles.itemTextDone]} numberOfLines={1}>
                            {t.text}
                        </Text>
                    </TouchableOpacity>
                ))}
                {tasks.length === 0 && (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No tasks yet</Text>
                    </View>
                )}
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add task..."
                    placeholderTextColor="#8E8E93"
                    value={newTask}
                    onChangeText={setNewTask}
                    onSubmitEditing={handleAddTask}
                />
                <TouchableOpacity onPress={handleAddTask}>
                    <Ionicons name="add-circle" size={28} color="#4B6EFF" />
                </TouchableOpacity>
            </View>
        </OutlinedCard>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        padding: 20,
        height: 240,
        justifyContent: 'space-between',
        borderRadius: 32,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    iconBg: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFD60A', // Soft Yellow Icon
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    list: {
        gap: 12,
        flex: 1,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    itemText: {
        color: '#1C1C1E',
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    itemTextDone: {
        color: '#8E8E93',
        textDecorationLine: 'line-through',
    },
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#8E8E93',
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    input: {
        flex: 1,
        color: '#1C1C1E',
        fontSize: 14,
        fontWeight: '500',
    },
});
