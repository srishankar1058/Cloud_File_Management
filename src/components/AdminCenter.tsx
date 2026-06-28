/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserAccount, AuditLog, DeviceItem } from '../types';
import { Shield, ShieldAlert, Monitor, Users, Activity, FileCheck, CheckCircle2, AlertTriangle, Key, Plus, Trash2, Smartphone, HardDrive } from 'lucide-react';

interface AdminCenterProps {
  user: UserAccount;
  auditLogs: AuditLog[];
  devices: DeviceItem[];
  onToggleMFA: () => void;
  onAddUser: (email: string, role: 'Admin' | 'Developer' | 'User') => void;
  onRemoveDevice: (deviceId: string) => void;
}

export default function AdminCenter({
  user,
  auditLogs,
  devices,
  onToggleMFA,
  onAddUser,
  onRemoveDevice
}: AdminCenterProps) {
  // Provisioning form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Developer' | 'User'>('User');
  const [showProvisionForm, setShowProvisionForm] = useState(false);

  // Active provisioned members mock database
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; email: string; role: string; status: string }[]>([
    { id: 'u1', name: 'Mrithyunjayan M', email: '2403717610421033@cit.edu.in', role: 'Admin', status: 'Active' },
    { id: 'u2', name: 'Sarah Jenkins', email: 's.jenkins@internal.ops', role: 'User', status: 'Active' },
    { id: 'u3', name: 'David Miller', email: 'd.miller@internal.ops', role: 'Developer', status: 'Active' }
  ]);

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserEmail.trim()) {
      const name = newUserEmail.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const newM = {
        id: `u-${Date.now()}`,
        name: name || 'Collaborator',
        email: newUserEmail.trim(),
        role: newUserRole,
        status: 'Active'
      };
      setTeamMembers([...teamMembers, newM]);
      onAddUser(newUserEmail.trim(), newUserRole);
      setNewUserEmail('');
      setShowProvisionForm(false);
    }
  };

  const handleDeauthMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  // Storage breakdown calculations for visual indicators
  const storageLimitGB = (user.storageLimit / (1024 * 1024 * 1024)).toFixed(0);
  const storageUsedGB = (user.storageUsed / (1024 * 1024 * 1024)).toFixed(2);
  
  // Custom styled CSS grid for data breakdown
  const storageBreakdown = [
    { name: 'Server Backups', size: '0.85 GB', color: 'bg-blue-500', width: '65%' },
    { name: 'System Logs', size: '0.12 GB', color: 'bg-[#a855f7]', width: '10%' },
    { name: 'Documentation Assets', size: '0.28 GB', color: 'bg-emerald-500', width: '20%' },
    { name: 'Free Space', size: '3.75 GB', color: 'bg-gray-800', width: '100%' }
  ];

  return (
    <div className="flex-1 bg-[#0c0c0e] p-6 flex flex-col h-[calc(100vh-3.5rem)] text-gray-200 overflow-y-auto select-none">
      <div className="max-w-5xl w-full mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="border-b border-[#232328] pb-5">
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Enterprise Security & Admin Console
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage user authorization profiles, security credentials, audits, compliance reports, and active node synchronization daemons.
          </p>
        </div>

        {/* Dashboard Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* MFA Controller Block */}
          <div className="bg-[#16161a] border border-[#232328] p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Multi-Factor Authentication</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  user.mfaEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {user.mfaEnabled ? 'Secure' : 'Unsecured'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-200 mt-2">MFA Authentication Guard</h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                Enforces verification codes via Entra ID / Authenticator app upon synchronizing files from unauthorized endpoints.
              </p>
            </div>
            
            <button
              onClick={onToggleMFA}
              className={`w-full py-2 rounded-xl text-xs font-semibold transition-all mt-4 cursor-pointer flex items-center justify-center gap-1.5 ${
                user.mfaEnabled
                  ? 'bg-red-950/30 hover:bg-red-900/40 border border-red-500/20 text-red-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{user.mfaEnabled ? 'Disable MFA Enforcement' : 'Enable MFA Push'}</span>
            </button>
          </div>

          {/* Compliance Card */}
          <div className="bg-[#16161a] border border-[#232328] p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Regulatory Compliance</span>
                <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">HIPAA / GDPR</span>
              </div>
              <h3 className="text-sm font-bold text-gray-200 mt-2">DLP & Encryption Auditing</h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                Data Loss Prevention policies verify that system backups containing credential structures are encrypted at rest with keys held exclusively by administrators.
              </p>
            </div>
            
            <div className="p-2.5 bg-[#0c0c0e] border border-[#232328] rounded-xl flex items-center gap-2 mt-4 text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-gray-300 font-medium">Compliance scan fully passed.</span>
            </div>
          </div>

          {/* Storage Capacity breakdowns */}
          <div className="bg-[#16161a] border border-[#232328] p-5 rounded-2xl space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Storage Allocation Breakdowns</span>
              <h3 className="text-sm font-bold text-gray-200 mt-1 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-[#3b82f6]" />
                {storageUsedGB} GB of {storageLimitGB} GB
              </h3>
              
              {/* Stacked Percentage bar */}
              <div className="flex h-2 bg-[#202026] rounded-full overflow-hidden mt-3">
                <div className="bg-blue-500" style={{ width: '65%' }} title="Backups: 65%" />
                <div className="bg-purple-500" style={{ width: '10%' }} title="Logs: 10%" />
                <div className="bg-emerald-500" style={{ width: '20%' }} title="Docs: 20%" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-gray-400 font-mono mt-2">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Backups: 0.85G</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Logs: 0.12G</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Docs: 0.28G</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-600" /> Free: 3.75G</div>
            </div>
          </div>

        </div>

        {/* User Provisioning Section (Feature 14) */}
        <div className="bg-[#16161a] border border-[#232328] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#232328] pb-3.5">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-[#3b82f6]" />
              Staff & User Provisioning
            </h3>
            <button
              onClick={() => setShowProvisionForm(!showProvisionForm)}
              className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-[#60a5fa] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision User</span>
            </button>
          </div>

          {/* Provisioning expansion form */}
          {showProvisionForm && (
            <form onSubmit={handleProvisionSubmit} className="p-4 bg-[#0c0c0e] border border-[#232328] rounded-xl flex flex-wrap gap-4 items-end text-xs">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Staff Corporate Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. j.doe@internal.ops"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-[#16161a] border border-[#232328] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#3b82f6]"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Access Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="bg-[#16161a] border border-[#232328] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#3b82f6]"
                >
                  <option value="User">User (Standard sync)</option>
                  <option value="Developer">Developer (API capabilities)</option>
                  <option value="Admin">System Administrator</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#005a9e] hover:bg-[#106ebe] text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Provision Credentials
              </button>
            </form>
          )}

          {/* Provisioned users list */}
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#232328] text-gray-500">
                  <th className="pb-2 font-semibold">User Profile</th>
                  <th className="pb-2 font-semibold">Security Role</th>
                  <th className="pb-2 font-semibold">MFA status</th>
                  <th className="pb-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232328]/50 text-gray-300">
                {teamMembers.map(m => (
                  <tr key={m.id}>
                    <td className="py-3">
                      <div>
                        <div className="font-bold text-gray-200">{m.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{m.email}</div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        m.role === 'Admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        m.role === 'Developer' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-gray-800 text-gray-300'
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Verified Active
                      </span>
                    </td>
                    <td className="py-3">
                      {m.email !== user.email ? (
                        <button
                          onClick={() => handleDeauthMember(m.id)}
                          className="p-1 hover:bg-red-950/30 text-gray-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                          title="Revoke access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-500 italic">Owner account</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Device Sync Nodes List (Feature 7 & 14) */}
        <div className="bg-[#16161a] border border-[#232328] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-200 border-b border-[#232328] pb-3 flex items-center gap-2">
            <Monitor className="w-4.5 h-4.5 text-purple-400" />
            Registered Devices & Daemon Sync Agents
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {devices.map(dev => (
              <div key={dev.id} className="bg-[#0c0c0e] border border-[#232328] p-4 rounded-xl flex justify-between items-start">
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    {dev.type === 'Desktop' ? (
                      <Monitor className="w-4 h-4 text-sky-400" />
                    ) : dev.type === 'Mobile' ? (
                      <Smartphone className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Activity className="w-4 h-4 text-purple-400" />
                    )}
                    <span className="font-bold text-gray-200">{dev.name}</span>
                  </div>
                  
                  <div className="text-[10px] text-gray-500 font-mono">
                    IP: {dev.ipAddress} | OS: {dev.os}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      dev.syncStatus === 'Synced' ? 'bg-emerald-500' :
                      dev.syncStatus === 'Syncing' ? 'bg-blue-500 animate-pulse' :
                      'bg-red-500'
                    }`} />
                    <span className="text-[10px] text-gray-400">
                      Sync Daemon: {dev.syncStatus}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-600">Last heartbeat: {dev.lastActive}</div>
                </div>

                <button
                  onClick={() => onRemoveDevice(dev.id)}
                  className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-950/20 rounded transition-all cursor-pointer"
                  title="De-authorize node daemon"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security Audit Trail (Feature 13 & 14) */}
        <div className="bg-[#16161a] border border-[#232328] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-200 border-b border-[#232328] pb-3 flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-amber-400" />
            Compliance Auditing & Real-time Action Stream
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-[11px]">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-[#0c0c0e] border border-[#232328] rounded-xl flex items-start gap-3">
                <div className="mt-0.5">
                  {log.status === 'Success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : log.status === 'Warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between text-gray-500 text-[10px]">
                    <span>{log.timestamp}</span>
                    <span>Host: {log.ipAddress}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[#3b82f6] font-bold">[{log.user}]</span>
                    <span className="text-gray-400 font-bold ml-1.5">{log.action}:</span>
                    <span className="text-gray-300 ml-1.5 leading-relaxed">{log.details}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
