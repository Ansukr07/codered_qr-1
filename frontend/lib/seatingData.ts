export interface Seat {
    lab: string;
    row: string; // or seat ID
    team: string;
    seatId: string;
}

export const SEATING_DATA: Seat[] = [
    // APJ Lab (50 Teams + 4 Empty = 54 Sections)
    // Teams arranged alphabetically from left to right, top to bottom
    // Row 1 (Empty)
    { lab: "APJ", row: "R1", team: "", seatId: "CR(H) 0" },
    { lab: "APJ", row: "R1", team: "", seatId: "CR(S) 0" },
    { lab: "APJ", row: "R1", team: "", seatId: "CR(H) 0" },
    { lab: "APJ", row: "R1", team: "", seatId: "CR(S) 0" },
    // Row 2 - Alphabetical: 404 Brain Not Found, APEX-AI-X, AUTOMATIKS, BLUE
    { lab: "APJ", row: "R2", team: "404 Brain Not Found", seatId: "CR(H) 1" },
    { lab: "APJ", row: "R2", team: "APEX-AI-X", seatId: "CR(S) 1" },
    { lab: "APJ", row: "R2", team: "AUTOMATIKS", seatId: "CR(H) 2" },
    { lab: "APJ", row: "R2", team: "BLUE", seatId: "CR(S) 2" },
    // Row 3 - Alphabetical: Brogrammers, Code Wizards, Code Yoddhas, CodeOps
    { lab: "APJ", row: "R3", team: "Brogrammers", seatId: "CR(H) 3" },
    { lab: "APJ", row: "R3", team: "Code Wizards", seatId: "CR(S) 3" },
    { lab: "APJ", row: "R3", team: "Code Yoddhas", seatId: "CR(H) 4" },
    { lab: "APJ", row: "R3", team: "CodeOps", seatId: "CR(S) 4" },
    // Row 4 - Alphabetical: CodeVortex, Convoy Command Unit, Databaes (1st), Databaes (2nd)
    { lab: "APJ", row: "R4", team: "CodeVortex", seatId: "CR(H) 5" },
    { lab: "APJ", row: "R4", team: "Convoy Command Unit", seatId: "CR(S) 5" },
    { lab: "APJ", row: "R4", team: "Databaes", seatId: "CR(H) 6" },
    { lab: "APJ", row: "R4", team: "Databaes", seatId: "CR(S) 6" },
    // Row 5 - Alphabetical: Delusion, Dr Code, ElectroEdge, Electronauts
    { lab: "APJ", row: "R5", team: "Delusion", seatId: "CR(H) 1" },
    { lab: "APJ", row: "R5", team: "Dr Code", seatId: "CR(S) 1" },
    { lab: "APJ", row: "R5", team: "ElectroEdge", seatId: "CR(H) 2" },
    { lab: "APJ", row: "R5", team: "Electronauts", seatId: "CR(S) 2" },
    // Row 6 - Alphabetical: Forgeon2.0, FourLoop, Full Stack Biryani, GENESIS
    { lab: "APJ", row: "R6", team: "Forgeon2.0", seatId: "CR(H) 3" },
    { lab: "APJ", row: "R6", team: "FourLoop", seatId: "CR(S) 3" },
    { lab: "APJ", row: "R6", team: "Full Stack Biryani", seatId: "CR(H) 4" },
    { lab: "APJ", row: "R6", team: "GENESIS", seatId: "CR(S) 4" },
    // Row 7 - Alphabetical: Half Brain Cell, Hardkode3.0, Invincible_4, KAFKA
    { lab: "APJ", row: "R7", team: "Half Brain Cell", seatId: "CR(H) 5" },
    { lab: "APJ", row: "R7", team: "Hardkode3.0", seatId: "CR(S) 5" },
    { lab: "APJ", row: "R7", team: "Invincible_4", seatId: "CR(H) 6" },
    { lab: "APJ", row: "R7", team: "KAFKA", seatId: "CR(S) 6" },
    // Row 8 - Alphabetical: Kronyx, Leave It To Us, LogicHigh, MisaMisa
    { lab: "APJ", row: "R8", team: "Kronyx", seatId: "CR(H) 1" },
    { lab: "APJ", row: "R8", team: "Leave It To Us", seatId: "CR(S) 1" },
    { lab: "APJ", row: "R8", team: "LogicHigh", seatId: "CR(H) 2" },
    { lab: "APJ", row: "R8", team: "MisaMisa", seatId: "CR(S) 2" },
    // Row 9 - Alphabetical: Neural Nooks, NextGen, Nishika, QuadraBytes
    { lab: "APJ", row: "R9", team: "Neural Nooks", seatId: "CR(H) 3" },
    { lab: "APJ", row: "R9", team: "NextGen", seatId: "CR(S) 3" },
    { lab: "APJ", row: "R9", team: "Nishika", seatId: "CR(H) 4" },
    { lab: "APJ", row: "R9", team: "QuadraBytes", seatId: "CR(S) 4" },
    // Row 10 - Alphabetical: Questers, Reboot, Runtime Terrors, Signotech
    { lab: "APJ", row: "R10", team: "Questers", seatId: "CR(H) 5" },
    { lab: "APJ", row: "R10", team: "Reboot", seatId: "CR(S) 5" },
    { lab: "APJ", row: "R10", team: "Runtime Terrors", seatId: "CR(H) 6" },
    { lab: "APJ", row: "R10", team: "Signotech", seatId: "CR(S) 6" },
    // Row 11 - Alphabetical: TEAM INFRARED, Tech Titans, TesserHack, The Gradient Decendents
    { lab: "APJ", row: "R11", team: "TEAM INFRARED", seatId: "CR(H) 1" },
    { lab: "APJ", row: "R11", team: "Tech Titans", seatId: "CR(S) 1" },
    { lab: "APJ", row: "R11", team: "TesserHack", seatId: "CR(H) 2" },
    { lab: "APJ", row: "R11", team: "The Gradient Decendents", seatId: "CR(S) 2" },
    // Row 12 - Alphabetical: Titan Core, Titans of Tech, Tryanuka, VELOCITY FLYERS
    { lab: "APJ", row: "R12", team: "Titan Core", seatId: "CR(H) 3" },
    { lab: "APJ", row: "R12", team: "Titans of Tech", seatId: "CR(S) 3" },
    { lab: "APJ", row: "R12", team: "Tryanuka", seatId: "CR(H) 4" },
    { lab: "APJ", row: "R12", team: "VELOCITY FLYERS", seatId: "CR(S) 4" },
    // Row 13 - Alphabetical: VITACORE AI, Vision Vortex, VCPRO, WI-FIGTERS
    { lab: "APJ", row: "R13", team: "VITACORE AI", seatId: "CR(H) 5" },
    { lab: "APJ", row: "R13", team: "Vision Vortex", seatId: "CR(S) 5" },
    { lab: "APJ", row: "R13", team: "VCPRO", seatId: "CR(H) 6" },
    { lab: "APJ", row: "R13", team: "WI-FIGTERS", seatId: "CR(S) 6" },
    // Row 14 - Alphabetical: Wi - Fight club, WISH
    { lab: "APJ", row: "R14", team: "Wi - Fight club", seatId: "CR(H) 1" },
    { lab: "APJ", row: "R14", team: "WISH", seatId: "CR(S) 1" },
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
