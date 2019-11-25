
export class RepeatModel {
    interval: string;
    time?: string;
    value?: number;
}

export class TaskModel {
    name: string;
    description?: string;
    due?: Date;
    hyperlambda: string;
    repeat?: RepeatModel;
}
