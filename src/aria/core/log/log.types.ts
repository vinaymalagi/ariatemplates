import { z } from "zod"



export enum LogLevel {
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}

export const LogLevelSchema = z.nativeEnum(LogLevel)


export interface Appender {
  /**
   * Append debug message
   * @param {String} className
   * @param {String} msg The message text (including arguments)
   * @param {String} msgText The message text (before arguments were replaced)
   * @param {Object} o An optional object to be inspected
   * @returns void
   */
  debug: (classpath: string, message: string, messageText?: string, obj?: object) => void

  /**
   * Append info message
   * @param {String} className
   * @param {String} msg The message text (including arguments)
   * @param {String} msgText The message text (before arguments were replaced)
   * @param {Object} o An optional object to be inspected
   * @returns void
   */
  info: (classpath: string, message: string, messageText?: string, obj?: object) => void

  /**
   * Append warn message
   * @param {String} className
   * @param {String} msg The message text (including arguments)
   * @param {String} msgText The message text (before arguments were replaced)
   * @param {Object} o An optional object to be inspected
   * @returns void
   */
  warn: (classpath: string, message: string, messageText?: string, obj?: object) => void

  /**
   * Append error message
   * @param {String} className
   * @param {String} msg The message text (including arguments)
   * @param {String} msgText The message text (before arguments were replaced)
   * @param {Object} o An optional object to be inspected
   * @returns void
   */
  error: (classpath: string, message: string, messageText?: string, obj?: object) => void
}
