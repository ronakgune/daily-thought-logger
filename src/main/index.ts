/**
 * Main process exports for Daily Thought Logger
 * Electron main process services and utilities
 */

export {
  GlobalShortcutService,
  getGlobalShortcutService,
  cleanupGlobalShortcuts,
} from './global-shortcut';

export type { ShortcutConfig, ShortcutState } from './global-shortcut';
