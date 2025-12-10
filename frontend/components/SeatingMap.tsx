'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import styles from './SeatingMap.module.css';
import { SEATING_DATA, Seat } from '@/lib/seatingData';

interface SeatingMapProps {
    teamName?: string;
}

// ----------------------------------------------------------------------
// Geometry Helpers (EXACT ORIGINAL LOGIC)
function getRoundedRectPath(x: number, y: number, w: number, h: number, r: number, corners: boolean[]) {
    const [tl, tr, br, bl] = corners;
    let d = `M${x + (tl ? r : 0)},${y}`;
    d += ` L${x + w - (tr ? r : 0)},${y}`;
    if (tr) d += ` Q${x + w},${y} ${x + w},${y + r}`;
    d += ` L${x + w},${y + h - (br ? r : 0)}`;
    if (br) d += ` Q${x + w},${y + h} ${x + w - r},${y + h}`;
    d += ` L${x + (bl ? r : 0)},${y + h}`;
    if (bl) d += ` Q${x},${y + h} ${x},${y + h - r}`;
    d += ` L${x},${y + (tl ? r : 0)}`;
    if (tl) d += ` Q${x},${y} ${x + r},${y}`;
    d += " Z";
    return d;
}

// Helper to generate a radial cluster
function generateRadialCluster(
    data: Seat[],
    centerX: number,
    centerY: number,
    startRadius: number
) {
    const blocks: any[] = [];
    const BLOCK_WIDTH = 70;
    const BLOCK_HEIGHT = 100;
    const COLUMN_SPACING = 150;
    const AISLE_GAP = 60;

    // Group logic based on data type
    // If Row exists (APJ), group by Row. Else chunk.
    const isRowBased = data.some(d => d.row.startsWith('R'));

    let groupedData: Seat[][] = [];

    if (isRowBased) {
        const rowMap: { [key: string]: Seat[] } = {};
        data.forEach(d => {
            if (!rowMap[d.row]) rowMap[d.row] = [];
            rowMap[d.row].push(d);
        });
        const keys = Object.keys(rowMap).sort((a, b) => {
            const na = parseInt(a.replace('R', '')) || 0;
            const nb = parseInt(b.replace('R', '')) || 0;
            return na - nb;
        });
        keys.forEach(k => groupedData.push(rowMap[k]));
    } else {
        // Simple chunking for pools
        for (let i = 0; i < data.length; i += 4) {
            groupedData.push(data.slice(i, i + 4));
        }
    }

    groupedData.forEach((group, colIndex) => {
        const radius = startRadius + colIndex * COLUMN_SPACING;
        const innerOffset = (AISLE_GAP / 2) + (BLOCK_HEIGHT / 2);
        const outerOffset = innerOffset + BLOCK_HEIGHT;
        const thetaInner = Math.asin(innerOffset / radius);
        const thetaOuter = Math.asin(outerOffset / radius);

        // REVERSED ORDER to swap Col 4 with 1, 3 with 2
        // Original Order: -thetaOuter (Top), -thetaInner, thetaInner, thetaOuter (Bottom)
        // New Order: thetaOuter (Bottom), thetaInner, -thetaInner, -thetaOuter (Top)
        const positions = [
            { angle: thetaOuter, posType: 'bottom-outer' },
            { angle: thetaInner, posType: 'bottom-inner' },
            { angle: -thetaInner, posType: 'top-inner' },
            { angle: -thetaOuter, posType: 'top-outer' }
        ];

        group.forEach((seat, seatIdx) => {
            if (seatIdx >= 4) return;
            const pos = positions[seatIdx];
            const rotation = pos.angle * (180 / Math.PI);
            const x = centerX + radius * Math.cos(pos.angle);
            const y = centerY + radius * Math.sin(pos.angle);

            blocks.push({
                data: seat,
                x,
                y,
                rotation,
                width: BLOCK_WIDTH,
                height: BLOCK_HEIGHT,
                posType: pos.posType
            });
        });
    });

    return blocks;
}

// ----------------------------------------------------------------------

const SeatingMap: React.FC<SeatingMapProps> = ({ teamName = '' }) => {
    const normalizedName = teamName.trim().toLowerCase();

    // 1. Identify the Team and Lab
    const activeData = useMemo(() => {
        if (!normalizedName) return null;
        return SEATING_DATA.find(s => s.team.toLowerCase() === normalizedName);
    }, [normalizedName]);

    const targetLab = activeData ? activeData.lab : 'APJ'; // Default to APJ if no user/match

    const containerRef = useRef<HTMLDivElement>(null);
    const [viewBox, setViewBox] = useState('0 0 1000 800');

    // Layout Constants
    const BLOCK_WIDTH = 70;
    const BLOCK_HEIGHT = 100;
    const CORNER_RADIUS = 12;

    const layout = useMemo(() => {
        // Filter data for ONLY the target Lab
        const labData = SEATING_DATA.filter(s => s.lab === targetLab);

        // Generate SINGLE radial cluster (preserving "Old UI" exact look)
        // Center logic copied from original: cx = -1200, cy = 400, startRadius = 1450
        const clusterBlocks = generateRadialCluster(labData, -1200, 400, 1450);

        const allBlocks = [
            // { type: 'label', text: `${targetLab.toUpperCase()} LAB`, x: 0, y: 0 },
            ...clusterBlocks.map(b => ({ ...b, type: 'seat' }))
        ];

        return allBlocks;
    }, [targetLab]);

    // ViewBox
    useEffect(() => {
        if (layout.length > 0) {
            const seats = layout.filter(b => b.type === 'seat');
            const xs = seats.map(b => b.x);
            // const ys = seats.map(b => b.y);
            const maxX = Math.max(...xs) + 200;
            // Standard height 800 preserved from original UI
            setViewBox(`0 0 ${maxX} 800`);
        }
    }, [layout]);

    // Auto-scroll
    useEffect(() => {
        if (activeData && containerRef.current) {
            const target = layout.find(b => b.type === 'seat' && b.data.team === activeData.team);
            if (target) {
                const container = containerRef.current;
                const clientW = container.clientWidth;
                const scrollLeft = target.x - clientW / 2;
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }, [activeData, layout]);

    return (
        <div className={styles.container}>
            <div className={styles.scrollContainer} ref={containerRef}>
                <svg
                    className={styles.mapSvg}
                    viewBox={viewBox}
                    preserveAspectRatio="xMidYMid meet"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="blockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                    </defs>

                    {/* Stage Group - Dynamic Label */}
                    <g transform="translate(50, 200)">
                        <rect
                            x="0" y="0"
                            width="60" height="400"
                            className={styles.stageRect}
                        />
                        {/* Centered vertical text */}
                        <text
                            x="30" y="200"
                            transform="rotate(-90, 30, 200)"
                            className={styles.stageText}
                            style={{ fontSize: '14px' }}
                        >
                            {targetLab.toUpperCase()}
                        </text>
                    </g>

                    {layout.map((block, idx) => {
                        if (block.type !== 'seat') return null;

                        const isActive = activeData && block.data.team === activeData.team;

                        let corners = [false, false, false, false];
                        if (block.posType === 'top-outer') corners = [true, true, false, false];
                        if (block.posType === 'top-inner') corners = [false, false, true, true];
                        if (block.posType === 'bottom-inner') corners = [true, true, false, false];
                        if (block.posType === 'bottom-outer') corners = [false, false, true, true];

                        const pathD = getRoundedRectPath(
                            -block.width / 2,
                            -block.height / 2,
                            block.width,
                            block.height,
                            CORNER_RADIUS,
                            corners
                        );

                        return (
                            <g
                                key={`block-${idx}`}
                                transform={`translate(${block.x}, ${block.y}) rotate(${block.rotation})`}
                                className="group cursor-pointer"
                            >
                                <title>{`${block.data.team} - ${block.data.seatId}`}</title>

                                <path
                                    d={pathD}
                                    className={`${isActive ? styles.blockActive : styles.blockInactive}`}
                                />

                                <path
                                    d={pathD}
                                    fill="url(#blockGradient)"
                                    pointerEvents="none"
                                />

                                <text
                                    x="0"
                                    y="-20"
                                    textAnchor="middle"
                                    style={{
                                        fontFamily: 'monospace',
                                        fontSize: '9px',
                                        fill: isActive ? '#000' : 'rgba(255,255,255,0.5)',
                                        fontWeight: 600,
                                        pointerEvents: 'none'
                                    }}
                                >
                                    {block.data.seatId}
                                </text>

                                <text
                                    x="0"
                                    y="10"
                                    textAnchor="middle"
                                    style={{
                                        fontFamily: 'sans-serif',
                                        fontSize: '10px',
                                        fill: isActive ? '#000' : '#fff',
                                        fontWeight: 700,
                                        pointerEvents: 'none',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {block.data.team.length > 10 ? block.data.team.slice(0, 9) + '..' : block.data.team}
                                </text>

                                {isActive && (
                                    <text
                                        x="0"
                                        y="35"
                                        className={styles.activeText}
                                        textAnchor="middle"
                                        style={{ fill: '#facc15', fontSize: '10px', letterSpacing: '1px' }}
                                    >
                                        YOU
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {!teamName && (
                <div className={styles.overlay}>
                    <h2 className={styles.overlayTitle}>LAB SEATING</h2>
                    <p className={styles.overlaySub}>Scroll to explore</p>
                </div>
            )}
        </div>
    );
};

export default SeatingMap;
