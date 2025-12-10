import React from 'react';

export interface RoomNode {
    id: string;
    label: string;
    type: 'classroom' | 'lab' | 'utility' | 'washroom' | 'stairs' | 'lift' | 'office' | 'corridor' | 'common' | 'storage' | 'water';
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number; // 0 means horizontal text
    specialMark?: string; // e.g., 'X' for blocked stairs
}

interface CampusFloorMapProps {
    floorNumber: 3 | 4;
    data: RoomNode[];
}

const CampusFloorMap: React.FC<CampusFloorMapProps> = ({ floorNumber, data }) => {
    // Canvas dimensions - arbitrary large enough grid to fit the layout
    const width = 1400;
    const height = 650;

    const getFillColor = (type: RoomNode['type']) => {
        switch (type) {
            case 'lab': return 'rgba(239, 68, 68, 0.2)'; // Red-ish tint for labs
            case 'classroom': return 'rgba(59, 130, 246, 0.1)'; // Blue-ish for classes
            case 'utility': return 'rgba(255, 255, 255, 0.05)'; // Dark for utility
            case 'washroom': return 'rgba(6, 182, 212, 0.15)'; // Cyan tint
            case 'stairs': return 'rgba(255, 255, 255, 0.05)'; // Stairs pattern
            case 'water': return 'rgba(56, 189, 248, 0.3)'; // Light blue
            case 'corridor': return 'transparent';
            case 'office': return 'rgba(234, 179, 8, 0.15)'; // Yellow tint
            case 'common': return 'rgba(168, 85, 247, 0.15)'; // Purple tint
            case 'storage': return 'rgba(107, 114, 128, 0.2)'; // Gray
            default: return 'transparent';
        }
    };

    const getStrokeColor = (type: RoomNode['type']) => {
        switch (type) {
            case 'lab': return 'rgba(239, 68, 68, 0.6)';
            case 'classroom': return 'rgba(59, 130, 246, 0.5)';
            case 'utility': return 'rgba(255, 255, 255, 0.2)';
            case 'washroom': return 'rgba(6, 182, 212, 0.5)';
            case 'stairs': return 'rgba(255, 255, 255, 0.3)';
            case 'office': return 'rgba(234, 179, 8, 0.5)';
            case 'common': return 'rgba(168, 85, 247, 0.5)';
            default: return 'rgba(255, 255, 255, 0.2)';
        }
    };

    // Helper to render stairs pattern
    const renderStairsPattern = (node: RoomNode) => {
        if (node.type !== 'stairs') return null;

        // Simple parallel lines to simulate steps
        const steps = [];
        const stepCount = 5;
        const stepSize = node.height / stepCount;

        for (let i = 1; i < stepCount; i++) {
            steps.push(
                <line
                    key={`step-${i}`}
                    x1={node.x}
                    y1={node.y + i * stepSize}
                    x2={node.x + node.width}
                    y2={node.y + i * stepSize}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                />
            );
        }
        return <g>{steps}</g>;
    };

    return (
        <div className="w-full h-full overflow-auto bg-[#0a0a0f] p-4 rounded-lg relative">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto min-w-[800px]"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Defs for filters or gradients if needed */}
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" pointerEvents="none" />

                {/* Render Corridors First (Background) */}
                {data.filter(n => n.type === 'corridor').map(node => (
                    <rect
                        key={node.id}
                        x={node.x}
                        y={node.y}
                        width={node.width}
                        height={node.height}
                        fill="transparent"
                        stroke="none"
                    />
                ))}

                {/* Render Rooms */}
                {data.filter(n => n.type !== 'corridor').map(node => (
                    <g key={node.id} className="group transition-all duration-300 hover:opacity-90">
                        <rect
                            x={node.x}
                            y={node.y}
                            width={node.width}
                            height={node.height}
                            fill={getFillColor(node.type)}
                            stroke={getStrokeColor(node.type)}
                            strokeWidth="1.5"
                            rx="2"
                            className="transition-colors duration-300 group-hover:fill-opacity-40"
                        />

                        {renderStairsPattern(node)}

                        {/* Room Label using foreignObject for text wrapping */}
                        <foreignObject
                            x={node.x}
                            y={node.y}
                            width={node.width}
                            height={node.height}
                            style={{ pointerEvents: 'none' }}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    color: 'rgba(255,255,255,0.95)',
                                    fontSize: node.type === 'lab' || node.type === 'office' ? '16px' : '14px',
                                    fontWeight: node.type === 'lab' || node.type === 'office' ? '800' : '500',
                                    lineHeight: '1.2',
                                    padding: '4px',
                                    wordWrap: 'break-word',
                                    overflow: 'hidden',
                                    textShadow: '0px 1px 3px rgba(0,0,0,0.9)',
                                    // Handle rotation via writing-mode for clean vertical text
                                    writingMode: node.rotation === 90 || node.rotation === 270 ? 'vertical-rl' : undefined,
                                    textOrientation: 'mixed'
                                }}
                            >
                                {node.label}
                            </div>
                        </foreignObject>

                        {/* Special Mark (X for blocked stairs) */}
                        {node.specialMark && (
                            <text
                                x={node.x + node.width / 2}
                                y={node.y + node.height / 2}
                                dy=".3em"
                                fill="red"
                                fontSize="40"
                                fontWeight="bold"
                                textAnchor="middle"
                                opacity="0.8"
                            >
                                {node.specialMark}
                            </text>
                        )}
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default CampusFloorMap;
