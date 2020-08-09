
export class RepeatModel {
    interval: string;
    time?: string;
    value?: number;
}

export class TaskSchedule {
    id: number;
    due: Date;
    repeats?: string;
}

export class TaskModel {
    id: string;
    description?: string;
    hyperlambda: string;
    schedule: TaskSchedule[];
}

export class TaskUpdateModel {
    id: string;
    description?: string;
    hyperlambda?: string;
}
