/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'image' | 'document' | 'log' | 'config';
  extension?: string;
  modified: string;
  size: string;
  bytes: number;
  sharing: 'Private' | 'Shared' | 'Public' | 'Team';
  path: string; // e.g. "/root" or "/root/Documents"
  content?: string; // file content text (text files)
  dataUrl?: string; // base64 data URL for binary files (images, PDFs) — enables preview & download
  owner: string;
  comments?: CommentItem[];
  versions?: FileVersion[];
  isVault?: boolean; // encrypted vault file
  isDeleted?: boolean;
  deletedAt?: string;
  isSecondStage?: boolean; // Second-stage recycle bin
  isSyncOnDemand?: boolean; // See files without downloading
  isSelectiveSync?: boolean; // selective folder sync flag
  tags?: string[]; // AI organization tags for photos
  albumId?: string; // photo album association
}

export interface CommentItem {
  id: string;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export interface FileVersion {
  version: number;
  modified: string;
  modifiedBy: string;
  size: string;
  content: string;
  note?: string;
}

export interface ServerInstance {
  id: string;
  name: string;
  ip: string;
  status: 'Online' | 'Offline' | 'Alert';
  cpu: number; // percentage
  memory: number; // percentage
  disk: number; // percentage
  cpuHistory: number[];
  memoryHistory: number[];
  diskHistory: number[];
  alertsCount: number;
  os: string;
  region: string;
  syncAgentVersion: string;
  lastBackupTime: string;
  backupPath: string;
}

export interface AlertNotification {
  id: string;
  serverId: string;
  serverName: string;
  metric: 'CPU' | 'Memory' | 'Disk' | 'Security' | 'Backup' | 'Ransomware';
  value: string;
  severity: 'Info' | 'Warning' | 'Critical';
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface PhotoAlbum {
  id: string;
  name: string;
  coverUrl: string;
  photoCount: number;
  created: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Developer' | 'User';
  status: 'Active' | 'Suspended';
  storageUsed: number; // bytes
  storageLimit: number; // bytes
  mfaEnabled: boolean;
  activeDevices: DeviceItem[];
  avatarUrl?: string; // base64 data URL or remote URL for profile picture
  theme?: 'light' | 'dark'; // persisted UI theme preference
}

export type Theme = 'light' | 'dark';

export interface DeviceItem {
  id: string;
  name: string;
  type: 'Desktop' | 'Mobile' | 'Server Agent' | 'Tablet';
  os: string;
  lastActive: string;
  ipAddress: string;
  syncStatus: 'Synced' | 'Syncing' | 'Paused' | 'Error';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  status: 'Success' | 'Failed' | 'Warning';
  ipAddress: string;
}

export interface DeveloperWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'Active' | 'Inactive';
  secret: string;
}
