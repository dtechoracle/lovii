import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface DrawingViewerProps {
    paths: string[];
    color: string;
    width: number;
    height: number;
    strokeWidth?: number;
}

export default function DrawingViewer({ paths, color, width, height, strokeWidth = 4 }: DrawingViewerProps) {
    // Handle both legacy (array of strings) and new (JSON object with paths) formats
    let drawingPaths: string[] = [];

    if (Array.isArray(paths)) {
        drawingPaths = paths;
    } else if (typeof paths === 'string') {
        try {
            const parsed = JSON.parse(paths);
            if (Array.isArray(parsed)) {
                drawingPaths = parsed;
            } else if (parsed.paths && Array.isArray(parsed.paths)) {
                drawingPaths = parsed.paths;
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
                {drawingPaths.map((d, index) => (
                    <Path
                        key={index}
                        d={d}
                        stroke={color}
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
