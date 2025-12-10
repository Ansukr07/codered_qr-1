export interface Seat {
    lab: string;
    row: string; // or seat ID
    team: string;
    seatId: string;
}

export const SEATING_DATA: Seat[] = [
    // APJ Lab
    // Row 1
    { lab: "APJ", row: "R1", team: "Code Wizards", seatId: "CR(H) 3" },
    { lab: "APJ", row: "R1", team: "CodeVortex", seatId: "CR(S) 1" },
    { lab: "APJ", row: "R1", team: "The Gradient Decendents", seatId: "CR(S) 3" },
    { lab: "APJ", row: "R1", team: "CodeOps", seatId: "CR(H) 2" },
    // Row 2
    { lab: "APJ", row: "R2", team: "VCpro", seatId: "CR(S) 6" },
    { lab: "APJ", row: "R2", team: "VELOCITY FLYERS", seatId: "CR(H) 1" },
    { lab: "APJ", row: "R2", team: "forgeon2.0", seatId: "CR(H) 5" },
    { lab: "APJ", row: "R2", team: "Code Yoddhas", seatId: "CR(S) 4" },
    // Row 3
    { lab: "APJ", row: "R3", team: "Titan core", seatId: "CR(H) 2" },
    { lab: "APJ", row: "R3", team: "Invincible_4", seatId: "CR(S) 6" },
    { lab: "APJ", row: "R3", team: "Tryanuka", seatId: "CR(S) 5" },
    { lab: "APJ", row: "R3", team: "Signotech", seatId: "CR(H) 4" },
    // Row 4
    { lab: "APJ", row: "R4", team: "Half Brain Cell", seatId: "CR(H) 5" },
    { lab: "APJ", row: "R4", team: "Delusion", seatId: "CR(S) 2" },
    { lab: "APJ", row: "R4", team: "LogicHigh", seatId: "CR(S) 6" },
    { lab: "APJ", row: "R4", team: "Wi-Fight club", seatId: "CR(S) 2" },
    // Row 5
    { lab: "APJ", row: "R5", team: "Hardkode3.0", seatId: "CR(H) 4" },
    { lab: "APJ", row: "R5", team: "FourLoop", seatId: "CR(S) 6" },
    { lab: "APJ", row: "R5", team: "WISH", seatId: "CR(H) 5" },
    { lab: "APJ", row: "R5", team: "GENESIS", seatId: "CR(H) 6" },
    // Row 6
    { lab: "APJ", row: "R6", team: "Vision Vortex", seatId: "CR(S) 4" },
    { lab: "APJ", row: "R6", team: "Dr Code", seatId: "CR(S) 5" },
    // Row 7
    { lab: "APJ", row: "R7", team: "Reboot", seatId: "CR(S) 3" },
    { lab: "APJ", row: "R7", team: "Brogrammers", seatId: "CR(S) 4" },
    { lab: "APJ", row: "R7", team: "Blue", seatId: "CR(S) 1" },
    // Row 8
    { lab: "APJ", row: "R8", team: "Neural Nooks", seatId: "CR(S) 2" },
    { lab: "APJ", row: "R8", team: "QudraByte", seatId: "CR(S) 4" },
    { lab: "APJ", row: "R8", team: "NextGen", seatId: "CR(H) 5" },
    { lab: "APJ", row: "R8", team: "AutoMatiks", seatId: "CR(S) 5" },
    // Row 9
    { lab: "APJ", row: "R9", team: "ElectroEdge", seatId: "CR(H) 3" },
    { lab: "APJ", row: "R9", team: "Chai-Fi", seatId: "CR(S) 3" },
    // Gap handled visually
    // Row 10 - Interpreting "phishfry" and "Runtime Terrors" as part of this block based on flow
    { lab: "APJ", row: "R10", team: "Databaes", seatId: "CR(H) 1" },
    { lab: "APJ", row: "R10", team: "Tech Titans", seatId: "CR(H) 6" },
    { lab: "APJ", row: "R10", team: "phishfry", seatId: "CR(S) 6" }, 
    { lab: "APJ", row: "R10", team: "Runtime Terrors", seatId: "CR(S) 3" },
    // Row 11
    { lab: "APJ", row: "R11", team: "Kronyx", seatId: "CR(S) 6" },
    { lab: "APJ", row: "R11", team: "Full Stack Biryani", seatId: "CR(S) 1" },
    { lab: "APJ", row: "R11", team: "Electronauts", seatId: "CR(H) 3" },
    { lab: "APJ", row: "R11", team: "Misamisa", seatId: "CR(S) 4" },
    // Row 12
    { lab: "APJ", row: "R12", team: "Team InfraRed", seatId: "CR(H) 3" },
    { lab: "APJ", row: "R12", team: "Apex-AI-X", seatId: "CR(S) 2" },
    // Row 13
    { lab: "APJ", row: "R13", team: "Questers", seatId: "CR(H) 3" },
    { lab: "APJ", row: "R13", team: "VitaCore AI", seatId: "CR(S) 5" },
    { lab: "APJ", row: "R13", team: "Wi-Fight club", seatId: "CR(S) 6" },
    { lab: "APJ", row: "R13", team: "phishfry", seatId: "CR(S) 5" },
    // Row 14
    { lab: "APJ", row: "R14", team: "KAFKA", seatId: "CR(S) 4" },
    { lab: "APJ", row: "R14", team: "Convoy Command Unit", seatId: "CR(S) 2" },

    // Savitribai Phule Lab
    { lab: "Savitribai Phule", row: "Pool", team: "NEXT TECH", seatId: "U1" },
    { lab: "Savitribai Phule", row: "Pool", team: "The Quadrent", seatId: "U2" },
    { lab: "Savitribai Phule", row: "Pool", team: "GARUDA", seatId: "U4" },
    { lab: "Savitribai Phule", row: "Pool", team: "SlothX", seatId: "U5" },
    { lab: "Savitribai Phule", row: "Pool", team: "INNOVCAMP", seatId: "U3" },
    { lab: "Savitribai Phule", row: "Pool", team: "LOLgorithms", seatId: "U8" },
    { lab: "Savitribai Phule", row: "Pool", team: "Team 269", seatId: "U6" },
    { lab: "Savitribai Phule", row: "Pool", team: "Infinity Devs", seatId: "U7" },
    { lab: "Savitribai Phule", row: "Pool", team: "No code paradigm", seatId: "U2" },
    { lab: "Savitribai Phule", row: "Pool", team: "Tesla_Curie", seatId: "U6" },
    { lab: "Savitribai Phule", row: "Pool", team: "Forbidden Phishers", seatId: "U3" },
    { lab: "Savitribai Phule", row: "Pool", team: "LogiMind", seatId: "U1" },
    { lab: "Savitribai Phule", row: "Pool", team: "Tenet", seatId: "U7" },
    { lab: "Savitribai Phule", row: "Pool", team: "Kairos", seatId: "U8" },
    { lab: "Savitribai Phule", row: "Pool", team: "Redbyte", seatId: "U4" },
    { lab: "Savitribai Phule", row: "Pool", team: "MSN", seatId: "U5" },
    { lab: "Savitribai Phule", row: "Pool", team: "Team 0/1", seatId: "U8" },

    // Kalpana Chawla Lab
    { lab: "Kalpana Chawla", row: "Pool", team: "Vague_Sense", seatId: "U1" },
    { lab: "Kalpana Chawla", row: "Pool", team: "Mjolnir", seatId: "U5" },
    { lab: "Kalpana Chawla", row: "Pool", team: "The binary brain", seatId: "U2" },
    { lab: "Kalpana Chawla", row: "Pool", team: "Tech titans", seatId: "U6" },
    { lab: "Kalpana Chawla", row: "Pool", team: "CODEBREAKER5", seatId: "U3" },
    { lab: "Kalpana Chawla", row: "Pool", team: "Prototype Pirates", seatId: "U7" },
    { lab: "Kalpana Chawla", row: "Pool", team: "Run Time Terror", seatId: "U4" },
    { lab: "Kalpana Chawla", row: "Pool", team: "Unified Cargo Exchange", seatId: "U8" },
    { lab: "Kalpana Chawla", row: "Pool", team: "Caffeine Crew", seatId: "U5" },
    { lab: "Kalpana Chawla", row: "Pool", team: "4Direction", seatId: "U2" },
];
