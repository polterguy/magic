
export class RepeatModel {
    interval: string;
    time?: string;
    value?: number;
}

export class TaskModel {
    id: string;
    description?: string;
    due?: Date;
    hyperlambda: string;
    repeat?: RepeatModel;
}

export class TaskUpdateModel {
    id: string;
    description?: string;
    hyperlambda?: string;
}
