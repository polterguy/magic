/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

/**
 * Retrieving reports on the health and activities of your backend.
 */
 export interface SystemReport {
    persisted_tasks?: number,
    endpoints?: number,
    slots?: number,
    dynamic_slots?: number,
    default_db?: string,
    log_types?: LogTypes[],
    timeshifts?: Timeshifts[]
 }

 /**
  * type of logs created on the backend
  */
 export interface LogTypes {
     debug?: number,
     error?: number, 
     fatal?: number
 }

/**
 * Displaying the of login details on the system
 */
export interface Timeshifts {
    variable?: [
        {
            when?: Date,
            count?: number
        }
    ]
}