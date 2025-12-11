'use client';

import React, { useMemo } from 'react';
import styles from './SeatingMap.module.css';

interface SeatingMapPrintProps {
    teams: { name: string; index: number }[];
}

// Reuse helper from SeatingMap
function getRoundedRectPath(x: number, y: number, w: number, h: number, r: number, corners: boolean[]) {
    // corners: [tl, tr, br, bl]
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

const SeatingMapPrint: React.FC<SeatingMapPrintProps> = ({ teams }) => {
    // Layout Constants (Same as SeatingMap)
    const BLOCK_WIDTH = 70;
    const BLOCK_HEIGHT = 100;
    const COLUMN_SPACING = 150;
    const AISLE_GAP = 60;
    const CORNER_RADIUS = 12;
    const totalTeams = 52;

    const layout = useMemo(() => {
        const blocks: any[] = [];
        const cx = -1200;
        const cy = 400;
        const startRadius = 1450;
        const numColumns = 13;

        for (let col = 0; col < numColumns; col++) {
            const radius = startRadius + col * COLUMN_SPACING;
            const innerOffset = (AISLE_GAP / 2) + (BLOCK_HEIGHT / 2);
            const outerOffset = innerOffset + BLOCK_HEIGHT;

            const thetaInner = Math.asin(innerOffset / radius);
            const thetaOuter = Math.asin(outerOffset / radius);

            const positions = [
                { angle: -thetaOuter, posType: 'top-outer', index: col * 4 },
                { angle: -thetaInner, posType: 'top-inner', index: col * 4 + 1 },
                { angle: thetaInner, posType: 'bottom-inner', index: col * 4 + 2 },
                { angle: thetaOuter, posType: 'bottom-outer', index: col * 4 + 3 }
            ];

            positions.forEach(pos => {
                if (pos.index >= totalTeams) return;

                const rotation = pos.angle * (180 / Math.PI);
                const x = cx + radius * Math.cos(pos.angle);
                const y = cy + radius * Math.sin(pos.angle);

                blocks.push({
                    index: pos.index,
                    x,
                    y,
                    rotation,
                    width: BLOCK_WIDTH,
                    height: BLOCK_HEIGHT,
                    posType: pos.posType,
                    col
                });
            });
        }
        return blocks;
    }, [totalTeams]);

    // Fixed ViewBox to cover everything
    const viewBox = '0 0 1400 800'; // Increased width a bit based on SeatingMap logic (maxX + 200)

    return (
        <div className={styles.container} style={{ minHeight: 'unset', height: '100vh', width: '100vw', background: '#000' }}>
            {/* Flatten scroll container for print */}
            <div style={{ width: '100%', height: '100%' }}>
                <svg
                    className={styles.mapSvg}
                    viewBox={viewBox}
                    preserveAspectRatio="xMidYMid meet"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ minHeight: '100%' }}
                >
                    <defs>
                        <linearGradient id="blockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                        </linearGradient>
                    </defs>

                    {/* Stage Group */}
                    <g transform="translate(50, 200)">
                        <rect x="0" y="0" width="60" height="400" className={styles.stageRect} />
                        <text x="30" y="200" transform="rotate(-90, 30, 200)" className={styles.stageText}>STAGE</text>
                    </g>

                    {/* Teams */}
                    {layout.map((block) => {
                        // Find if any team occupies this seat
                        const assignedTeam = teams.find(t => t.index === block.index);
                        const isOccupied = !!assignedTeam;

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
                            <g key={`block-${block.index}`} transform={`translate(${block.x}, ${block.y}) rotate(${block.rotation})`}>
                                <path
                                    d={pathD}
                                    className={styles.blockInactive}
                                    style={{
                                        fill: isOccupied ? '#facc15' : '#18181b', // Yellow if occupied, dark grey if empty
                                        stroke: isOccupied ? '#fff' : '#333',
                                        strokeWidth: isOccupied ? 2 : 1
                                    }}
                                />
                                <path d={pathD} fill="url(#blockGradient)" pointerEvents="none" />

                                {isOccupied && (
                                    <g>
                                        <foreignObject x={-block.width / 2} y={-block.height / 2} width={block.width} height={block.height}>
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                color: 'black',
                                                fontWeight: 'bold',
                                                fontSize: '10px',
                                                lineHeight: '1.1',
                                                padding: '2px',
                                                wordBreak: 'break-word',
                                                fontFamily: 'monospace'
                                            }}>
                                                {assignedTeam.name}
                                            </div>
                                        </foreignObject>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default SeatingMapPrint;
