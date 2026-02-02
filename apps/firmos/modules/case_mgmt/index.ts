/**
 * FirmOS Case Management Module
 *
 * Provides case/engagement lifecycle management.
 */

export type CaseStatus = 'intake' | 'active' | 'on_hold' | 'completed' | 'archived';
export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';

export interface Case {
    id: string;
    client_id: string;
    service_id: string;
    pack_id: string;
    status: CaseStatus;
    created_at: Date;
    created_by: string;
    owner_agent: string;
    metadata?: Record<string, unknown>;
}

export interface Workstream {
    id: string;
    case_id: string;
    name: string;
    phase: string;
    status: TaskStatus;
    tasks: string[];
}

export interface TaskRecord {
    id: string;
    workstream_id: string;
    name: string;
    status: TaskStatus;
    autonomy: 'AUTO' | 'AUTO_CHECK' | 'ESCALATE';
    assigned_agent: string;
    outputs: string[];
    evidence_ids: string[];
    started_at?: Date;
    completed_at?: Date;
}

/**
 * Create a new case/engagement
 */
export function createCase(
    clientId: string,
    serviceId: string,
    packId: string,
    ownerAgent: string,
): Case {
    return {
        id: `case_${Date.now()}`,
        client_id: clientId,
        service_id: serviceId,
        pack_id: packId,
        status: 'intake',
        created_at: new Date(),
        created_by: ownerAgent,
        owner_agent: ownerAgent,
    };
}

/**
 * Create a workstream within a case
 */
export function createWorkstream(caseId: string, name: string, phase: string): Workstream {
    return {
        id: `ws_${Date.now()}`,
        case_id: caseId,
        name,
        phase,
        status: 'pending',
        tasks: [],
    };
}

/**
 * Create a task within a workstream
 */
export function createTask(
    workstreamId: string,
    name: string,
    autonomy: 'AUTO' | 'AUTO_CHECK' | 'ESCALATE',
    assignedAgent: string,
): TaskRecord {
    return {
        id: `task_${Date.now()}`,
        workstream_id: workstreamId,
        name,
        status: 'pending',
        autonomy,
        assigned_agent: assignedAgent,
        outputs: [],
        evidence_ids: [],
    };
}
