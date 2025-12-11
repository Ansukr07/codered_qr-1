export interface Seat {
    lab: string;
    row: string; // or seat ID
    team: string;
    seatId: string;
}

export const SEATING_DATA: Seat[] = [
    // APJ Lab (50 Teams + 4 Empty = 54 Sections)
    // Row 1 (Empty)
    { lab: "APJ", row: "R1", team: "", seatId: "CR(H) 0" },
    { lab: "APJ", row: "R1", team: "", seatId: "CR(S) 0" },
    { lab: "APJ", row: "R1", team: "", seatId: "CR(H) 0" },
    { lab: "APJ", row: "R1", team: "", seatId: "CR(S) 0" },
    // Row 2
    { lab: "APJ", row: "R2", team: "VITACORE AI", seatId: "CR(H) 1" },
    { lab: "APJ", row: "R2", team: "Code Wizards", seatId: "CR(S) 1" },
    { lab: "APJ", row: "R2", team: "CodeOps", seatId: "CR(H) 2" },
    { lab: "APJ", row: "R2", team: "Electronauts", seatId: "CR(S) 2" },
    // Row 3
    { lab: "APJ", row: "R3", team: "Convoy Command Unit", seatId: "CR(H) 3" },
    { lab: "APJ", row: "R3", team: "FourLoop", seatId: "CR(S) 3" },
    { lab: "APJ", row: "R3", team: "NextGen", seatId: "CR(H) 4" },
    { lab: "APJ", row: "R3", team: "Forgeon2.0", seatId: "CR(S) 4" },
    // Row 4
    { lab: "APJ", row: "R4", team: "Databaes", seatId: "CR(H) 5" },
    { lab: "APJ", row: "R4", team: "404 Brain Not Found", seatId: "CR(S) 5" },
    { lab: "APJ", row: "R4", team: "Titan Core", seatId: "CR(H) 6" },
    { lab: "APJ", row: "R4", team: "Hardkode3.0", seatId: "CR(S) 6" },
    // Row 5
    { lab: "APJ", row: "R5", team: "GENESIS", seatId: "CR(H) 1" },
    { lab: "APJ", row: "R5", team: "Reboot", seatId: "CR(S) 1" },
    { lab: "APJ", row: "R5", team: "ElectroEdge", seatId: "CR(H) 2" },
    { lab: "APJ", row: "R5", team: "VELOCITY FLYERS", seatId: "CR(S) 2" },
    // Row 6
    { lab: "APJ", row: "R6", team: "AUTOMATIKS", seatId: "CR(H) 3" },
    { lab: "APJ", row: "R6", team: "Full Stack Biryani", seatId: "CR(S) 3" },
    { lab: "APJ", row: "R6", team: "Databaes", seatId: "CR(H) 4" },
    { lab: "APJ", row: "R6", team: "Tech Titans", seatId: "CR(S) 4" },
    // Row 7
    { lab: "APJ", row: "R7", team: "TEAM INFRARED", seatId: "CR(H) 5" },
    { lab: "APJ", row: "R7", team: "Signotech", seatId: "CR(S) 5" },
    { lab: "APJ", row: "R7", team: "MisaMisa", seatId: "CR(H) 6" },
    { lab: "APJ", row: "R7", team: "QuadraBytes", seatId: "CR(S) 6" },
    // Row 8
    { lab: "APJ", row: "R8", team: "Delusion", seatId: "CR(H) 1" },
    { lab: "APJ", row: "R8", team: "Runtime Terrors", seatId: "CR(S) 1" },
    { lab: "APJ", row: "R8", team: "Nishika", seatId: "CR(H) 2" },
    { lab: "APJ", row: "R8", team: "Questers", seatId: "CR(S) 2" },
    // Row 9
    { lab: "APJ", row: "R9", team: "Leave It To Us", seatId: "CR(H) 3" },
    { lab: "APJ", row: "R9", team: "Vision Vortex", seatId: "CR(S) 3" },
    { lab: "APJ", row: "R9", team: "BLUE", seatId: "CR(H) 4" },
    { lab: "APJ", row: "R9", team: "VCPRO", seatId: "CR(S) 4" },
    // Row 10
    { lab: "APJ", row: "R10", team: "KAFKA", seatId: "CR(H) 5" },
    { lab: "APJ", row: "R10", team: "Kronyx", seatId: "CR(S) 5" },
    { lab: "APJ", row: "R10", team: "LogicHigh", seatId: "CR(H) 6" },
    { lab: "APJ", row: "R10", team: "Code Yoddhas", seatId: "CR(S) 6" },
    // Row 11
    { lab: "APJ", row: "R11", team: "Wi - Fight club", seatId: "CR(H) 1" },
    { lab: "APJ", row: "R11", team: "APEX-AI-X", seatId: "CR(S) 1" },
    { lab: "APJ", row: "R11", team: "Brogrammers", seatId: "CR(H) 2" },
    { lab: "APJ", row: "R11", team: "Half Brain Cell", seatId: "CR(S) 2" },
    // Row 12
    { lab: "APJ", row: "R12", team: "Dr Code", seatId: "CR(H) 3" },
    { lab: "APJ", row: "R12", team: "Tryanuka", seatId: "CR(S) 3" },
    { lab: "APJ", row: "R12", team: "WISH", seatId: "CR(H) 4" },
    { lab: "APJ", row: "R12", team: "WI-FIGTERS", seatId: "CR(S) 4" },
    // Row 13
    { lab: "APJ", row: "R13", team: "TesserHack", seatId: "CR(H) 5" },
    { lab: "APJ", row: "R13", team: "Titans of Tech", seatId: "CR(S) 5" },
    { lab: "APJ", row: "R13", team: "Neural Nooks", seatId: "CR(H) 6" },
    { lab: "APJ", row: "R13", team: "The Gradient Decendents", seatId: "CR(S) 6" },
    // Row 14 (Partial - 2 seats)
    { lab: "APJ", row: "R14", team: "CodeVortex", seatId: "CR(H) 1" },
    { lab: "APJ", row: "R14", team: "Invincible_4", seatId: "CR(S) 1" },
    // End APJ

    // Savitribai Phule Lab (Seminar Hall 1) - 17 Teams
    { lab: "Savitribai Phule", row: "Pool", team: "4Direction", seatId: "S1-T1" },
    { lab: "Savitribai Phule", row: "Pool", team: "Caffeine Crew", seatId: "S1-T2" },
    { lab: "Savitribai Phule", row: "Pool", team: "CODEBREAKER5", seatId: "S1-T3" },
    { lab: "Savitribai Phule", row: "Pool", team: "Forbidden Phishers", seatId: "S1-T4" },
    { lab: "Savitribai Phule", row: "Pool", team: "GARUDA", seatId: "S1-T5" },
    { lab: "Savitribai Phule", row: "Pool", team: "Infinity Devs", seatId: "S1-T6" },
    { lab: "Savitribai Phule", row: "Pool", team: "INNOVCAMP", seatId: "S1-T7" },
    { lab: "Savitribai Phule", row: "Pool", team: "Kairos", seatId: "S1-T8" },
    { lab: "Savitribai Phule", row: "Pool", team: "LogiMind", seatId: "S1-T9" },
    { lab: "Savitribai Phule", row: "Pool", team: "LOLgorithms", seatId: "S1-T10" },
    { lab: "Savitribai Phule", row: "Pool", team: "Mjolnir", seatId: "S1-T11" },
    { lab: "Savitribai Phule", row: "Pool", team: "MSN", seatId: "S1-T12" },
    { lab: "Savitribai Phule", row: "Pool", team: "NEXT TECH", seatId: "S1-T13" },
    { lab: "Savitribai Phule", row: "Pool", team: "No code paradigm", seatId: "S1-T14" },
    { lab: "Savitribai Phule", row: "Pool", team: "Prototype Pirates", seatId: "S1-T15" },
    { lab: "Savitribai Phule", row: "Pool", team: "Redbyte", seatId: "S1-T16" },
    { lab: "Savitribai Phule", row: "Pool", team: "Run Time Terror", seatId: "S1-T17" },

    // Kalpana Chawla Lab (Seminar Hall 2) - 10 Teams
    { lab: "Kalpana Chawla", row: "Pool", team: "SlothX", seatId: "S2-T1" },
    { lab: "Kalpana Chawla", row: "Pool", team: "Team 0/1", seatId: "S2-T2" },
    { lab: "Kalpana Chawla", row: "Pool", team: "Team 269", seatId: "S2-T3" },
    { lab: "Kalpana Chawla", row: "Pool", team: "Tech titans", seatId: "S2-T4" },
    { lab: "Kalpana Chawla", row: "Pool", team: "Tenet", seatId: "S2-T5" },
    { lab: "Kalpana Chawla", row: "Pool", team: "Tesla_Curie", seatId: "S2-T6" },
    { lab: "Kalpana Chawla", row: "Pool", team: "The binary brain", seatId: "S2-T7" },
    { lab: "Kalpana Chawla", row: "Pool", team: "The Quadrent", seatId: "S2-T8" },
    { lab: "Kalpana Chawla", row: "Pool", team: "Unified Cargo Exchange", seatId: "S2-T9" },
    { lab: "Kalpana Chawla", row: "Pool", team: "Vague_Sense", seatId: "S2-T10" },
];
