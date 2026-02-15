import React, { useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface PathData {
    path: string;
    color: string;
}

interface CanvasProps {
    color: string;
    strokeWidth: number;
    paths?: PathData[];
    onPathsChange?: (paths: PathData[]) => void;
}

export default function Canvas({ color, strokeWidth, paths: externalPaths, onPathsChange }: CanvasProps) {
    const [paths, setPaths] = useState<PathData[]>(externalPaths || []);
    const [currentPath, setCurrentPath] = useState<string>('');

    // Use refs to avoid stale closures in PanResponder
    const currentPathRef = useRef<string>('');
    const currentColorRef = useRef<string>(color);
    const pathsRef = useRef<PathData[]>(externalPaths || []);

    // Update color ref when color changes
    React.useEffect(() => {
        currentColorRef.current = color;
    }, [color]);

    // Sync external paths changes (for undo/clear)
    React.useEffect(() => {
        if (externalPaths) {
            setPaths(externalPaths);
            pathsRef.current = externalPaths;
        }
    }, [externalPaths]);

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
                    const newPath: PathData = {
                        path: currentPathRef.current,
                        color: currentColorRef.current
                    };
                    const newPaths = [...pathsRef.current, newPath];
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
                {paths.map((pathData, index) => (
                    <Path
                        key={index}
                        d={pathData.path}
                        stroke={pathData.color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ))}
                {currentPath ? (
                    <Path
                        d={currentPath}
                        stroke={currentColorRef.current}
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
