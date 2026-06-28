/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ServerInstance, AlertNotification } from '../types';
import { Activity, Cpu, HardDrive, RefreshCw, AlertTriangle, ShieldCheck, Play, Settings, Bell, CheckCircle2, Terminal, RefreshCcw } from 'lucide-react';

interface ServerMonitorProps {
  servers: ServerInstance[];
  alerts: AlertNotification[];
  onTriggerManualBackup: (serverId: string) => Promise<void>;
  onTriggerRansomwareRollback: (serverId: string) => void;
  onClearAlert: (alertId: string) => void;
  onUpdateThresholds: (cpu: number, mem: number) => void;
}

export default function ServerMonitor({
  servers,
  alerts,
  onTriggerManualBackup,
  onTriggerRansomwareRollback,
  onClearAlert,
  onUpdateThresholds
}: ServerMonitorProps) {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [rollbackSuccessId, setRollbackSuccessId] = useState<string | null>(null);

  // Alert Threshold configs
  const [cpuThresh, setCpuThresh] = useState(85);
  const [memThresh, setMemThresh] = useState(90);

  // Telemetry stream logs
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] INFO: OmniDrive Sync agent active. Port 3000 mapping valid.`,
    `[${new Date().toLocaleTimeString()}] HEARTBEAT: prod-web-01 reporting clean sync logs.`,
    `[${new Date().toLocaleTimeString()}] SUCCESS: postgres-db-01 backup completed in 1.4s.`
  ]);

  // Simulate real-time metrics changing slightly (monitoring CPU, Memory, Disk)
  const [localServers, setLocalServers] = useState<ServerInstance[]>(servers);

  useEffect(() => {
    const metricsInterval = setInterval(() => {
      setLocalServers(prev =>
        prev.map(srv => {
          if (srv.status === 'Offline') return srv;

          // Slightly vary CPU and memory to simulate active monitoring
          const cpuDelta = Math.floor(Math.random() * 9) - 4; // -4 to +4
          const memDelta = Math.floor(Math.random() * 5) - 2; // -2 to +2

          const nextCpu = Math.max(10, Math.min(98, srv.cpu + cpuDelta));
          const nextMem = Math.max(20, Math.min(95, srv.memory + memDelta));

          // Rotate history
          const nextCpuHist = [...srv.cpuHistory.slice(1), nextCpu];
          const nextMemHist = [...srv.memoryHistory.slice(1), nextMem];

          return {
            ...srv,
            cpu: nextCpu,
            memory: nextMem,
            cpuHistory: nextCpuHist,
            memoryHistory: nextMemHist,
            status: nextCpu > cpuThresh ? 'Alert' : 'Online'
          };
        })
      );

      // Randomly append a clean heartbeat log
      const randomSrv = servers[Math.floor(Math.random() * servers.length)].name;
      setTelemetryLogs(prev => [
        `[${new Date().toLocaleTimeString()}] TELEMETRY: Heartbeat received from ${randomSrv}. System load nominal.`,
        ...prev.slice(0, 10)
      ]);

    }, 3000);

    return () => clearInterval(metricsInterval);
  }, [servers, cpuThresh]);

  const handleManualBackupClick = async (serverId: string, serverName: string) => {
    setSyncingId(serverId);

    setTelemetryLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ACTION: Triggered manual cloud sync backup for ${serverName}...`,
      ...prev
    ]);

    await onTriggerManualBackup(serverId);

    setTelemetryLogs(prev => [
      `[${new Date().toLocaleTimeString()}] SUCCESS: Manual snapshot sync completed for ${serverName}. Added to Attachments.`,
      ...prev
    ]);
    setSyncingId(null);
  };

  const handleRollbackClick = (serverId: string, serverName: string) => {
    onTriggerRansomwareRollback(serverId);
    setRollbackSuccessId(serverId);

    setTelemetryLogs(prev => [
      `[${new Date().toLocaleTimeString()}] WARNING: Triggered automated ransomware snapshots rollback for ${serverName}!`,
      `[${new Date().toLocaleTimeString()}] SUCCESS: System state rolled back successfully. Decryption keys injected.`,
      ...prev
    ]);

    setTimeout(() => {
      setRollbackSuccessId(null);
    }, 4000);
  };

  const handleApplyThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateThresholds(cpuThresh, memThresh);
    setTelemetryLogs(prev => [
      `[${new Date().toLocaleTimeString()}] POLICY: Alert thresholds updated (CPU: ${cpuThresh}%, Memory: ${memThresh}%).`,
      ...prev
    ]);
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 flex flex-col h-[calc(100vh-4rem)] text-slate-700 dark:text-slate-200 overflow-y-auto select-none">
      <div className="max-w-5xl w-full mx-auto space-y-6">

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Instance Telemetry & Sync Monitor
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time telemetry (CPU, Memory, Disk) and background sync status across your connected servers.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">Real-Time Sync Channel Active</span>
          </div>
        </div>

        {/* Server Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {localServers.map((srv) => (
            <div
              key={srv.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4 transition-all duration-300 ${
                srv.status === 'Alert' ? 'border-red-300 dark:border-red-500/30 ring-1 ring-red-100 dark:ring-red-500/10' :
                srv.status === 'Offline' ? 'border-slate-200 dark:border-slate-800 opacity-60' :
                'border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{srv.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{srv.ip}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Region: {srv.region} | OS: {srv.os}</div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  srv.status === 'Online' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' :
                  srv.status === 'Alert' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}>
                  {srv.status}
                </span>
              </div>

              {/* Progress Gauges */}
              <div className="grid grid-cols-3 gap-3">
                {/* CPU usage */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/40">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">
                    <Cpu className="w-3.5 h-3.5 text-blue-500" />
                    <span>CPU</span>
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                    {srv.status === 'Offline' ? '0%' : `${srv.cpu}%`}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        srv.cpu > cpuThresh ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${srv.status === 'Offline' ? 0 : srv.cpu}%` }}
                    />
                  </div>
                </div>

                {/* Memory usage */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/40">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">
                    <Cpu className="w-3.5 h-3.5 text-purple-500" />
                    <span>Memory</span>
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                    {srv.status === 'Offline' ? '0%' : `${srv.memory}%`}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        srv.memory > memThresh ? 'bg-red-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${srv.status === 'Offline' ? 0 : srv.memory}%` }}
                    />
                  </div>
                </div>

                {/* Disk usage */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700/40">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Disk</span>
                  </div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
                    {srv.status === 'Offline' ? '0%' : `${srv.disk}%`}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${srv.status === 'Offline' ? 0 : srv.disk}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  Sync agent: {srv.syncAgentVersion} | Backed: {srv.lastBackupTime}
                </div>

                {srv.status !== 'Offline' && (
                  <div className="flex gap-2">
                    {/* Ransomware Snap Rollback */}
                    {srv.status === 'Alert' && (
                      <button
                        onClick={() => handleRollbackClick(srv.id, srv.name)}
                        disabled={rollbackSuccessId === srv.id}
                        className="px-2.5 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Mass recovery from ransomware patterns"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        <span>{rollbackSuccessId === srv.id ? 'Rolled back!' : 'Ransomware Rollback'}</span>
                      </button>
                    )}

                    {/* Manual Sync */}
                    <button
                      onClick={() => handleManualBackupClick(srv.id, srv.name)}
                      disabled={syncingId === srv.id}
                      className="px-2.5 py-1.5 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-slate-200 hover:text-blue-800 dark:hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncingId === srv.id ? 'animate-spin' : ''}`} />
                      <span>{syncingId === srv.id ? 'Syncing...' : 'Backup Sync'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Configurations Policy & Live Logs split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Policy Configurations Threshold settings */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-3">
              <Settings className="w-4 h-4 text-blue-500" />
              Alert Notification Policy
            </h3>

            <form onSubmit={handleApplyThresholds} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 dark:text-slate-500 uppercase font-bold text-[10px] mb-1">
                  <span>CPU Load warning Trigger</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{cpuThresh}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={cpuThresh}
                  onChange={(e) => setCpuThresh(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer bg-slate-200 dark:bg-slate-700 h-1 rounded"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 dark:text-slate-500 uppercase font-bold text-[10px] mb-1">
                  <span>Memory overhead Trigger</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{memThresh}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={memThresh}
                  onChange={(e) => setMemThresh(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer bg-slate-200 dark:bg-slate-700 h-1 rounded"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-slate-500 dark:text-slate-400 text-[10px] leading-relaxed">
                💡 When thresholds are exceeded for several consecutive checks, a critical alert appears in the header bell.
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 font-bold rounded-lg transition-colors cursor-pointer"
              >
                Apply Threshold Policies
              </button>
            </form>
          </div>

          {/* Real-time Ticker streams */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-3 mb-3">
                <Terminal className="w-[18px] h-[18px] text-purple-500" />
                Sync Daemon Live Log Stream
              </h3>

              <div className="space-y-2 max-h-52 overflow-y-auto font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {telemetryLogs.map((log, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700/30 break-all leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-sans italic mt-2">
              Syncing daemons listening on TCP port 3000 mapping endpoint. Security certificates active.
            </div>
          </div>

        </div>

        {/* Current Active Incident Alarms */}
        {alerts.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
              <Bell className="w-[18px] h-[18px] text-red-500" />
              Active System Incidents ({alerts.length})
            </h3>

            <div className="space-y-2 text-xs">
              {alerts.map((al) => (
                <div
                  key={al.id}
                  className="p-3 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-[18px] h-[18px] text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{al.serverName}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.2 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {al.metric} Incident
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 leading-normal">{al.message}</p>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">Dispatched at {al.timestamp}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => onClearAlert(al.id)}
                    className="px-2.5 py-1 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-bold rounded"
                  >
                    Acknowledge
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
