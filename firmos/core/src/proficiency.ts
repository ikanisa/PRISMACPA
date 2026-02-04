/**
 * FirmOS Core — Proficiency Scale
 * 
 * L1-L5 proficiency levels based on Big Four partner standards.
 * L5 = Partner Mastery (30+ years experience).
 */

export type ProficiencyLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export interface Skill {
    skill: string;
    level: ProficiencyLevel;
}

export const PROFICIENCY_SCALE = {
    L5: {
        code: 'L5',
        name: 'Partner Mastery',
        description: 'Partner Mastery (30+ yrs) — sets methodology, signs off positions, mentors others',
        yearsExperience: '30+'
    },
    L4: {
        code: 'L4',
        name: 'Director/SME Mastery',
        description: 'Director/SME Mastery — runs complex engagements with minimal oversight',
        yearsExperience: '15-30'
    },
    L3: {
        code: 'L3',
        name: 'Manager Mastery',
        description: 'Manager Mastery — executes end-to-end with known playbooks',
        yearsExperience: '8-15'
    },
    L2: {
        code: 'L2',
        name: 'Practitioner',
        description: 'Practitioner — executes tasks with guidance',
        yearsExperience: '3-8'
    },
    L1: {
        code: 'L1',
        name: 'Foundational',
        description: 'Foundational — learning fundamentals',
        yearsExperience: '0-3'
    }
} as const;

export type ProficiencyScale = typeof PROFICIENCY_SCALE;

/**
 * Get proficiency definition by level
 */
export function getProficiency(level: ProficiencyLevel) {
    return PROFICIENCY_SCALE[level];
}

/**
 * Check if level A is higher than or equal to level B
 */
export function proficiencyAtLeast(level: ProficiencyLevel, minimum: ProficiencyLevel): boolean {
    const levels: ProficiencyLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5'];
    return levels.indexOf(level) >= levels.indexOf(minimum);
}
