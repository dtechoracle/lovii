import React, { useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface CanvasProps {
    color: string;
    strokeWidth: number;
    onPathsChange?: (paths: string[]) => void;
}

export default function Canvas({ color, strokeWidth, onPathsChange }: CanvasProps) {
    const [paths, setPaths] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('');

    // Use refs to avoid stale closures in PanResponder
    const currentPathRef = useRef<string>('');
    const pathsRef = useRef<string[]>([]);

    // Update refs when props/state change if needed, 
    // but here we mainly drive FROM PanResponder TO State.

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt: GestureResponderEvent) => {
                const { locationX, locationY } = evt.nativeEvent;
                const startPoint = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
                currentPathRef.current = startPoint;
                setCurrentPath(startPoint);
            },
            onPanResponderMove: (evt: GestureResponderEvent) => {
                const { locationX, locationY } = evt.nativeEvent;
                const newPoint = `L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
                currentPathRef.current += newPoint;
                setCurrentPath(currentPathRef.current);
            },
            onPanResponderRelease: () => {
                if (currentPathRef.current) {
                    const newPaths = [...pathsRef.current, currentPathRef.current];
                    pathsRef.current = newPaths;
                    setPaths(newPaths);

                    if (onPathsChange) {
                        onPathsChange(newPaths);
                    }

                    currentPathRef.current = '';
                    setCurrentPath('');
                }
            },
        })
    ).current;

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            <Svg style={StyleSheet.absoluteFill}>
                {paths.map((d, index) => (
                    <Path
                        key={index}
                        d={d}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ))}
                {currentPath ? (
                    <Path
                        d={currentPath}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ) : null}
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
