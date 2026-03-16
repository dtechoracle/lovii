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
                    drawingPaths = parsed.map((p: string) => ({ path: p, color }));
                }
            } else if (parsed && typeof parsed === 'object' && parsed.paths && Array.isArray(parsed.paths)) {
                // Handle {paths: [...], preview: ...} format from JSON string
                if (parsed.paths.length > 0 && typeof parsed.paths[0] === 'object') {
                    drawingPaths = parsed.paths;
                } else {
                    drawingPaths = parsed.paths.map((p: string) => ({ path: p, color }));
                }
            }
        } catch (e) {
            console.log('Error parsing drawing paths', e);
        }
    } else if (typeof paths === 'object' && paths !== null) {
        // NEW: Handle already-parsed object { paths: [...], preview: ... }
        // This is what history.tsx passes after JSON.parse()
        const pObj = paths as any;
        if (pObj.paths && Array.isArray(pObj.paths)) {
            if (pObj.paths.length > 0 && typeof pObj.paths[0] === 'object') {
                drawingPaths = pObj.paths;
            } else {
                drawingPaths = pObj.paths.map((p: string) => ({ path: p, color }));
            }
        }
    }

    const isThumbnail = width < 200;
    const effectiveStrokeWidth = isThumbnail ? strokeWidth * 2 : strokeWidth;

    // Calculate Bounding Box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let hasPoints = false;

    drawingPaths.forEach(p => {
        // Simple regex to extract coordinates from "M10,20L30,40..."
        const matches = p.path.match(/[0-9.-]+,[0-9.-]+/g);
        if (matches) {
            matches.forEach(coord => {
                const [x, y] = coord.split(',').map(Number);
                if (!isNaN(x) && !isNaN(y)) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    hasPoints = true;
                }
            });
        }
    });

    // Add padding
    const PADDING = 20; // 10px on each side
    let viewBox = undefined;
    if (hasPoints) {
        const vbX = minX - 10;
        const vbY = minY - 10;
        const vbW = (maxX - minX) + 20;
        const vbH = (maxY - minY) + 20;
        // Ensure strictly positive to avoid SVG errors
        if (vbW > 0 && vbH > 0) {
            viewBox = `${vbX} ${vbY} ${vbW} ${vbH}`;
        }
    }

    return (
        <View style={{ width, height, overflow: 'hidden', backgroundColor: 'transparent' }}>
            <Svg
                style={StyleSheet.absoluteFill}
                viewBox={viewBox}
                preserveAspectRatio="xMidYMid meet"
            >
                {drawingPaths.map((pathData, index) => {
                    // Quick fix: If color is black/white, it might be invisible.
                    // This is a basic safeguard.
                    return (
                        <Path
                            key={index}
                            d={pathData.path}
                            stroke={pathData.color}
                            strokeWidth={effectiveStrokeWidth}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    );
                })}
            </Svg>
        </View>
    );
}
