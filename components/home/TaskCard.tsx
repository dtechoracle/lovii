import { useTheme } from '@/context/ThemeContext';
import { StorageService, Task } from '@/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import OutlinedCard from '../ui/OutlinedCard';

export default function TaskCard() {
    const { theme } = useTheme();
    const router = useRouter();
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
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/todo')}>
            <OutlinedCard style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.header}>
                    <View style={[styles.iconBg, { backgroundColor: theme.success }]}>
                        <Ionicons name="checkbox" size={18} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>Tasks</Text>
                </View>

                <View style={styles.list}>
                    {tasks.slice(0, 3).map(t => (
                        <TouchableOpacity key={t.id} style={styles.item} onPress={() => toggleTask(t.id)}>
                            <Ionicons
                                name={t.completed ? "checkmark-circle" : "ellipse-outline"}
                                size={20}
                                color={t.completed ? theme.success : theme.textSecondary}
                            />
                            <Text style={[styles.itemText, { color: theme.text }, t.completed && styles.itemTextDone]} numberOfLines={1}>
                                {t.text}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    {tasks.length === 0 && (
                        <View style={styles.empty}>
                            <Ionicons name="checkmark-done-circle-outline" size={32} color={theme.success + '40'} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>All clear!</Text>
                            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Add a task below</Text>
                        </View>
                    )}
                </View>

                <View style={[styles.inputContainer, { backgroundColor: theme.background }]}>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Quick add..."
                        placeholderTextColor={theme.textSecondary}
                        value={newTask}
                        onChangeText={setNewTask}
                        onSubmitEditing={handleAddTask}
                    />
                    <TouchableOpacity onPress={handleAddTask}>
                        <Ionicons name="add-circle" size={28} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            </OutlinedCard>
        </TouchableOpacity>
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
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
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    itemTextDone: {
        opacity: 0.5,
        textDecorationLine: 'line-through',
    },
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 4,
    },
    emptyText: {
        fontWeight: '600',
        fontSize: 14,
    },
    emptySubtext: {
        fontWeight: '500',
        fontSize: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
});
