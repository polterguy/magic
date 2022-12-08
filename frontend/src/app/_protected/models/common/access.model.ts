
/*
 * Copyright (c) Aista Ltd, 2021 - 2022 info@aista.com, all rights reserved.
 */

/**
 * Wrapper class declaring user's access to different modules.
 */
export class AccessModel {
  sql: any = {
    execute_access: false,
    list_files: false,
    save_file: false,
  }
  crud: any = {
    generate_crud: false,
    generate_sql: false,
    generate_frontend: false,
  }
  endpoints: any = {
    view: false,
  }
  files: any = {
    list_files: false,
    list_folders: false,
    rename: false,
    unzip: false,
    install: false,
    create_folder: false,
    delete_folder: false,
    delete_file: false,
    download_folder: false,
  }
  bazar: any = {
    download_from_bazar: false,
    download_from_url: false,
    get_manifests: false,
  }
  auth: any = {
    view_users: false,
    view_roles: false,
  }
  log: any = {
    read: false,
  }
  tasks: any = {
    create: false,
    read: false,
    update: false,
    delete: false,
  }
  terminal: any = {
    execute: false,
  }
  eval: any = {
    read_files: false,
    write_files: false,
    execute: false,
  }
  diagnostics: any = {
    statistics: false,
  }
  sockets: any = {
    read: false,
    send: false,
  }
  config: any = {
    load: false,
    save: false,
  }
  crypto: any = {
    import_public_key: false,
  }
  cache: any = {
    read: false,
    count: false,
  }
  profile: boolean = false;
  fetched: boolean = false;
}
