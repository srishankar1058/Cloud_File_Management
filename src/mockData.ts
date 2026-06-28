/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileItem, ServerInstance, AlertNotification, PhotoAlbum, UserAccount, AuditLog, DeveloperWebhook } from './types';

export const initialFiles: FileItem[] = [
  // Top-level Folders (from OneDrive screenshot)
  {
    id: 'f-attachments',
    name: 'Attachments',
    type: 'folder',
    modified: 'July 19, 2024',
    size: '0 items',
    bytes: 0,
    sharing: 'Private',
    path: '/',
    owner: 'Mrithyunjayan M'
  },
  {
    id: 'f-documents',
    name: 'Documents',
    type: 'folder',
    modified: 'January 3, 2023',
    size: '2 items',
    bytes: 31948,
    sharing: 'Private',
    path: '/',
    owner: 'Mrithyunjayan M'
  },
  {
    id: 'f-officemobile',
    name: 'OfficeMobile',
    type: 'folder',
    modified: 'November 4, 2024',
    size: '0 items',
    bytes: 0,
    sharing: 'Private',
    path: '/',
    owner: 'Mrithyunjayan M'
  },
  {
    id: 'f-pictures',
    name: 'Pictures',
    type: 'folder',
    modified: 'January 3, 2023',
    size: '3 items',
    bytes: 14500000,
    sharing: 'Private',
    path: '/',
    owner: 'Mrithyunjayan M'
  },
  {
    id: 'f-scans',
    name: 'Scans',
    type: 'folder',
    modified: 'October 7, 2024',
    size: '0 items',
    bytes: 0,
    sharing: 'Private',
    path: '/',
    owner: 'Mrithyunjayan M'
  },

  // Files in /
  {
    id: 'doc-1',
    name: 'Document 1.docx',
    type: 'document',
    extension: 'docx',
    modified: 'March 25, 2026',
    size: '20.1 KB',
    bytes: 20582,
    sharing: 'Private',
    path: '/',
    owner: 'Mrithyunjayan M',
    content: `## Cloud Migration & Server Infrastructure Report
Author: Mrithyunjayan M
Date: March 25, 2026

### 1. Project Objectives
We are migrating our primary database cluster and microservice endpoints to Google Cloud Platform. The migration requires setting up active-active replication, automatic disk defragmentation, and regular local backup snapshots synced directly to OmniDrive.

### 2. Monitoring Specifications
For optimal performance, the DevOps team has set up strict threshold alerts:
- **CPU Utilization:** Critical warning at 85% for more than 5 minutes.
- **Memory Overhead:** Hard limit at 90% allocation.
- **Disk Availability:** Alert when disk capacity falls below 15% free space.

### 3. File Sync and Recovery
The OmniDrive Sync Agent must run as a background service on all nodes, targeting directory \`/var/lib/backups\` for real-time encryption and replication.`,
    comments: [
      { id: 'c1', user: 'Team Member Sarah', avatar: 'S', text: 'This looks solid. Should we add memory limits for the database containers?', timestamp: 'March 25, 2026 10:14 AM' },
      { id: 'c2', user: 'Mrithyunjayan M', avatar: 'MM', text: 'Yes, setting docker heap size is defined in page 2 under memory overhead.', timestamp: 'March 25, 2026 11:30 AM' }
    ],
    versions: [
      { version: 2, modified: 'March 25, 2026 11:30 AM', modifiedBy: 'Mrithyunjayan M', size: '20.1 KB', content: '...', note: 'Added monitoring thresholds and comment responses.' },
      { version: 1, modified: 'March 24, 2026 09:00 AM', modifiedBy: 'Mrithyunjayan M', size: '18.4 KB', content: '...', note: 'Initial draft for infrastructure review.' }
    ]
  },
  {
    id: 'doc-2',
    name: 'Document.docx',
    type: 'document',
    extension: 'docx',
    modified: 'March 11, 2026',
    size: '11.1 KB',
    bytes: 11366,
    sharing: 'Private',
    path: '/',
    owner: 'Mrithyunjayan M',
    content: `## OmniDrive Sync Agent installation guide
This document describes how to deploy and configure the automated background file sync agent on Linux server nodes.

### Prerequisites
- Node.js version 18 or above
- Write permissions to \`/etc/omnidrive-agent/\`
- Access token configured in developer dashboard

### Installation Commands
\`\`\`bash
# Download sync agent package
curl -sSL https://api.omnidrive.dev/install.sh | bash

# Configure agent identity
omnidrive-agent config --token=ENTRA_ID_TOKEN_SECRET_984

# Start background syncing
systemctl enable omnidrive-agent --now
\`\`\`

The server agent automatically registers with the Server Nodes monitoring interface to broadcast real-time telemetry (CPU, Memory, Disk) and sync directories like \`/var/log/nginx\` and database backups.`,
    comments: [],
    versions: [
      { version: 1, modified: 'March 11, 2026 04:12 PM', modifiedBy: 'Mrithyunjayan M', size: '11.1 KB', content: '...', note: 'First release of installer docs.' }
    ]
  },

  // Files in /Documents (Path: /Documents)
  {
    id: 'doc-sub-1',
    name: 'Server Backup Script.sh',
    type: 'config',
    extension: 'sh',
    modified: 'January 15, 2026',
    size: '4.5 KB',
    bytes: 4608,
    sharing: 'Team',
    path: '/Documents',
    owner: 'Mrithyunjayan M',
    content: `#!/bin/bash
# Backup database and system configs
BACKUP_DIR="/var/lib/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TARBALL="$BACKUP_DIR/backup_prod_$TIMESTAMP.tar.gz"

echo "Starting automated server backup..."
tar -czf "$TARBALL" /etc/nginx/ /var/www/html/ /var/lib/postgresql/data/

# Syncing directly to OmniDrive Cloud Sync directory
echo "Invoking OmniDrive CLI synchronization agent..."
omnidrive-cli sync --local="$TARBALL" --remote="/Backup/Production/"

echo "Backup and cloud synchronization completed."`
  },
  {
    id: 'doc-sub-2',
    name: 'Production Config.json',
    type: 'config',
    extension: 'json',
    modified: 'February 1, 2026',
    size: '2.1 KB',
    bytes: 2150,
    sharing: 'Private',
    path: '/Documents',
    owner: 'Mrithyunjayan M',
    content: `{
  "environment": "production",
  "port": 3000,
  "database": {
    "host": "postgres-db-replica-01.internal",
    "port": 5432,
    "user": "cloud_admin",
    "ssl": "require"
  },
  "storage": {
    "provider": "OmniDrive",
    "endpoint": "https://api.omnidrive.dev/v1",
    "bucket": "prod-data-backups-m",
    "realtimeSync": true,
    "versioning": true
  }
}`
  },

  // Files in /Pictures (Path: /Pictures)
  {
    id: 'pic-1',
    name: 'server_rack_installation.jpg',
    type: 'image',
    extension: 'jpg',
    modified: 'June 10, 2025',
    size: '2.4 MB',
    bytes: 2516582,
    sharing: 'Private',
    path: '/Pictures',
    owner: 'Mrithyunjayan M',
    tags: ['Server', 'Hardware', 'Hardware Installation', 'Office'],
    albumId: 'alb-work'
  },
  {
    id: 'pic-2',
    name: 'team_scrum_whiteboard.png',
    type: 'image',
    extension: 'png',
    modified: 'July 2, 2025',
    size: '1.8 MB',
    bytes: 1887436,
    sharing: 'Private',
    path: '/Pictures',
    owner: 'Mrithyunjayan M',
    tags: ['Office', 'Design', 'Whiteboard', 'Planning'],
    albumId: 'alb-work'
  },
  {
    id: 'pic-3',
    name: 'cloud_architecture_schema.png',
    type: 'image',
    extension: 'png',
    modified: 'November 20, 2025',
    size: '3.1 MB',
    bytes: 3250585,
    sharing: 'Shared',
    path: '/Pictures',
    owner: 'Mrithyunjayan M',
    tags: ['Diagram', 'Infrastructure', 'Cloud', 'System Architecture'],
    albumId: 'alb-cloud'
  }
];

export const initialAlbums: PhotoAlbum[] = [
  { id: 'alb-work', name: 'Work & Operations', coverUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=60', photoCount: 2, created: 'June 10, 2025' },
  { id: 'alb-cloud', name: 'Cloud Blueprints', coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=60', photoCount: 1, created: 'November 20, 2025' }
];

export const initialServers: ServerInstance[] = [
  {
    id: 'srv-prod-web',
    name: 'prod-web-01',
    ip: '10.128.0.12',
    status: 'Online',
    cpu: 48,
    memory: 64,
    disk: 52,
    cpuHistory: [40, 45, 50, 42, 48, 52, 47, 49, 48],
    memoryHistory: [62, 63, 64, 64, 63, 65, 64, 64, 64],
    diskHistory: [52, 52, 52, 52, 52, 52, 52, 52, 52],
    alertsCount: 0,
    os: 'Ubuntu 22.04 LTS',
    region: 'us-east1-b',
    syncAgentVersion: 'v2.4.1',
    lastBackupTime: '2026-06-24 10:15 PM',
    backupPath: '/var/www/html/uploads'
  },
  {
    id: 'srv-prod-db',
    name: 'postgres-db-01',
    ip: '10.128.0.15',
    status: 'Alert',
    cpu: 91,
    memory: 88,
    disk: 79,
    cpuHistory: [70, 75, 82, 88, 92, 94, 91, 90, 91],
    memoryHistory: [80, 82, 84, 85, 86, 88, 88, 87, 88],
    diskHistory: [78, 78, 79, 79, 79, 79, 79, 79, 79],
    alertsCount: 2,
    os: 'RedHat Enterprise Linux 9',
    region: 'us-east1-c',
    syncAgentVersion: 'v2.4.1',
    lastBackupTime: '2026-06-24 11:00 PM',
    backupPath: '/var/lib/postgresql/data'
  },
  {
    id: 'srv-worker-01',
    name: 'background-worker-east',
    ip: '10.128.0.22',
    status: 'Online',
    cpu: 24,
    memory: 41,
    disk: 35,
    cpuHistory: [15, 20, 30, 28, 25, 22, 26, 21, 24],
    memoryHistory: [40, 40, 41, 41, 41, 41, 41, 41, 41],
    diskHistory: [35, 35, 35, 35, 35, 35, 35, 35, 35],
    alertsCount: 0,
    os: 'Debian 12 Bookworm',
    region: 'us-east1-a',
    syncAgentVersion: 'v2.4.0',
    lastBackupTime: '2026-06-24 08:30 PM',
    backupPath: '/var/spool/jobs'
  },
  {
    id: 'srv-staging-web',
    name: 'staging-web-dev',
    ip: '10.132.0.4',
    status: 'Offline',
    cpu: 0,
    memory: 0,
    disk: 0,
    cpuHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    memoryHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    diskHistory: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    alertsCount: 1,
    os: 'Ubuntu 24.04 LTS',
    region: 'us-west2-a',
    syncAgentVersion: 'v2.4.2-beta',
    lastBackupTime: 'N/A',
    backupPath: '/opt/staging/build'
  }
];

export const initialAlerts: AlertNotification[] = [
  {
    id: 'al-1',
    serverId: 'srv-prod-db',
    serverName: 'postgres-db-01',
    metric: 'CPU',
    value: '91%',
    severity: 'Critical',
    message: 'CPU usage exceeded safety threshold (85%). Heavy PostgreSQL index scans detected.',
    timestamp: '2026-06-24 11:15 PM',
    isRead: false
  },
  {
    id: 'al-2',
    serverId: 'srv-prod-db',
    serverName: 'postgres-db-01',
    metric: 'Memory',
    value: '88%',
    severity: 'Warning',
    message: 'Memory utilization is approaching maximum allocated memory limits.',
    timestamp: '2026-06-24 11:10 PM',
    isRead: false
  },
  {
    id: 'al-3',
    serverId: 'srv-staging-web',
    serverName: 'staging-web-dev',
    metric: 'Security',
    value: 'Offline',
    severity: 'Warning',
    message: 'Server agent heartbeat missed. Node reported as offline.',
    timestamp: '2026-06-24 09:45 PM',
    isRead: true
  }
];

export const currentUser: UserAccount = {
  id: 'usr-1',
  name: 'Mrithyunjayan M',
  email: '2403717610421033@cit.edu.in',
  role: 'Admin',
  status: 'Active',
  storageUsed: 1395800000, // 1.3 GB in bytes
  storageLimit: 5368709120, // 5 GB in bytes
  mfaEnabled: true,
  activeDevices: [
    { id: 'dev-1', name: 'Workstation Pro', type: 'Desktop', os: 'Windows 11 Enterprise', lastActive: 'Active now', ipAddress: '198.51.100.42', syncStatus: 'Synced' },
    { id: 'dev-2', name: 'Pixel 9 Pro Fold', type: 'Mobile', os: 'Android 15', lastActive: '2 mins ago', ipAddress: '198.51.100.83', syncStatus: 'Synced' },
    { id: 'dev-3', name: 'postgres-db-01 Daemon', type: 'Server Agent', os: 'RedHat Linux', lastActive: '5 secs ago', ipAddress: '10.128.0.15', syncStatus: 'Syncing' }
  ]
};

export const initialAuditLogs: AuditLog[] = [
  { id: 'log-1', timestamp: '2026-06-24 11:15:22 PM', user: 'SYSTEM', action: 'ALERT_TRIGGERED', details: 'Critical CPU load warning dispatched for postgres-db-01', status: 'Warning', ipAddress: '127.0.0.1' },
  { id: 'log-2', timestamp: '2026-06-24 11:00:10 PM', user: 'postgres-db-01', action: 'FILE_SYNC_SUCCESS', details: 'Synced DB dump backup_prod_20260624_230000.tar.gz to Documents/', status: 'Success', ipAddress: '10.128.0.15' },
  { id: 'log-3', timestamp: '2026-06-24 10:48:15 PM', user: 'Mrithyunjayan M', action: 'DOCUMENT_EDIT', details: 'Modified cloud_architecture_schema.png sharing settings', status: 'Success', ipAddress: '198.51.100.42' },
  { id: 'log-4', timestamp: '2026-06-24 09:12:04 PM', user: '2403717610421033@cit.edu.in', action: 'USER_LOGIN', details: 'Secure sign-in verified via MFA push', status: 'Success', ipAddress: '198.51.100.42' },
  { id: 'log-5', timestamp: '2026-06-24 08:34:11 PM', user: 'Mrithyunjayan M', action: 'VAULT_LOCK', details: 'Personal Vault locked after 5 minutes inactivity', status: 'Success', ipAddress: '198.51.100.42' }
];

export const initialWebhooks: DeveloperWebhook[] = [
  { id: 'wh-1', name: 'Server Auto-Restart Slack Webhook', url: 'https://hooks.slack.com/services/T0000/B0000/XXXXX', events: ['server.alert_critical', 'server.offline'], status: 'Active', secret: 'whsec_N2Y1M2ZjYTMyMmE4N2Rl' },
  { id: 'wh-2', name: 'Database Snapshot Synced Handler', url: 'https://api.ops-tooling.dev/webhooks/snapshots', events: ['file.created', 'file.sync_completed'], status: 'Active', secret: 'whsec_MTRjYjdiOWQ1YjNhMWU1' }
];
