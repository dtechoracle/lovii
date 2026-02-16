import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface PathData {
    path: string;
    color: string;
}

interface DrawingViewerProps {
    paths: string[] | PathData[];
    color: string;
    width: number;
    height: number;
    strokeWidth?: number;
}

export default function DrawingViewer({ paths, color, width, height, strokeWidth = 4 }: DrawingViewerProps) {
    // Handle multiple formats:
    // 1. New format: array of PathData objects with color
    // 2. Legacy format: array of path strings
    // 3. JSON string of either format
    let drawingPaths: PathData[] = [];

    if (Array.isArray(paths)) {
        // Check if it's PathData[] or string[]
        if (paths.length > 0 && typeof paths[0] === 'object' && 'path' in paths[0]) {
            drawingPaths = paths as PathData[];
        } else {
            // Legacy string[] format - convert to PathData[]
            drawingPaths = (paths as string[]).map((p: string) => ({ path: p, color }));
        }
    } else if (typeof paths === 'string') {
        try {
            const parsed = JSON.parse(paths);
            if (Array.isArray(parsed)) {
                if (parsed.length > 0 && typeof parsed[0] === 'object' && 'path' in parsed[0]) {
                    drawingPaths = parsed;
                } else {
                    drawingPaths = parsed.map(p => ({ path: p, color }));
                }
            } else if (parsed.paths && Array.isArray(parsed.paths)) {
                // Handle {paths: [...], preview: ...} format
                if (parsed.paths.length > 0 && typeof parsed.paths[0] === 'object') {
                    drawingPaths = parsed.paths;
                } else {
                    drawingPaths = parsed.paths.map((p: string) => ({ path: p, color }));
                }
            }
        } catch (e) {
            console.log('Error parsing drawing paths', e);
        }
    }

    const isThumbnail = width < 200;
    const effectiveStrokeWidth = isThumbnail ? strokeWidth * 2 : strokeWidth;

    return (
        <View style={{ width, height, overflow: 'hidden' }}>
            <Svg
                style={StyleSheet.absoluteFill}
                viewBox="0 0 400 400"
                preserveAspectRatio="xMidYMid meet"
            >
                {drawingPaths.map((pathData, index) => (
                    <Path
                        key={index}
                        d={pathData.path}
                        stroke={pathData.color}
                        strokeWidth={effectiveStrokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                ))}
            </Svg>
        </View>
    );
}
