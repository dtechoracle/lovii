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
    // Calculate bounding box to center/scale content if needed
    // For now, we assume the drawing was made on a screen of roughly similar aspect ratio
    // or we just render it as is. 
    // To improve "display", we can ensure the stroke width scales down if the view is small (thumbnail).

    const isThumbnail = width < 200;
    const effectiveStrokeWidth = isThumbnail ? strokeWidth * 2 : strokeWidth; // Thicker relative stroke for thumbnails
    const scale = isThumbnail ? 0.2 : 1; // Simple scale assumption based on previous code, but ideally we'd use viewBox

    // Better approach: Use viewBox to scale content to fit container
    // Assuming original canvas was roughly window width x 300 (from original code)
    // We'll use a fixed viewBox and let SVG handle scaling.

    return (
        <View style={{ width, height, overflow: 'hidden' }}>
            <Svg
                style={StyleSheet.absoluteFill}
                viewBox="0 0 400 400" // Approximate original canvas size
                preserveAspectRatio="xMidYMid meet"
            >
                {paths.map((d, index) => (
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
