

export class CrudifyModel {
    connection: string;
    databaseType: string;
    database: string;
    table: string;
    template: string;
    verb: string;
    args: any[];
}

export class CrudifyResult {
    success: string;
}
