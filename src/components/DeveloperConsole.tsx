/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DeveloperWebhook } from '../types';
import { Terminal, Shield, Cpu, RefreshCw, Key, HelpCircle, Code, Play, Send, CheckCircle2, Zap, Plus } from 'lucide-react';

interface DeveloperConsoleProps {
  webhooks: DeveloperWebhook[];
  onAddWebhook: (name: string, url: string, events: string[]) => void;
  onRemoveWebhook: (id: string) => void;
}

export default function DeveloperConsole({
  webhooks,
  onAddWebhook,
  onRemoveWebhook
}: DeveloperConsoleProps) {
  // Entra ID auth simulation
  const [clientId, setClientId] = useState('8f5d179d-3f04-4bba-9b4f-4d9dbd00619a');
  const [entraToken, setEntraToken] = useState('eyJQcm92aWRlciI6IkVudHJhSUQiLCJUeXBlIjoiQmVhcmVyIiwiRXhwaXJlcyI6MTc4MDI0MzAwMCwiU2NvcGVzIjpbIkZpbGVzLlJlYWQiLCJGaWxlcy5SZWFkV3JpdGUiXX0=');
  const [generatingToken, setGeneratingToken] = useState(false);

  // Webhook creation state
  const [whName, setWhName] = useState('');
  const [whUrl, setWhUrl] = useState('');
  const [whEvents, setWhEvents] = useState<string[]>(['file.created']);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [webhookTestStatus, setWebhookTestStatus] = useState<Record<string, string>>({});

  // Graph API Playground state
  const [apiEndpoint, setApiEndpoint] = useState('GET /v1.0/me/drive/root/children');
  const [apiResponse, setApiResponse] = useState<any>({
    "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#users('m.m')/drive/root/children",
    "value": [
      {
        "id": "f-attachments",
        "name": "Attachments",
        "folder": { "childCount": 0 },
        "size": 0,
        "webUrl": "https://omnidrive.dev/me/drive/root/attachments"
      },
      {
        "id": "doc-1",
        "name": "Document 1.docx",
        "file": { "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        "size": 20582,
        "webUrl": "https://omnidrive.dev/me/drive/root/document1"
      }
    ]
  });
  const [runningQuery, setRunningQuery] = useState(false);

  const handleGenerateToken = () => {
    setGeneratingToken(true);
    setTimeout(() => {
      const randomPart = Math.random().toString(36).substring(2);
      setEntraToken(`eyJFbnRyYUlEIjoiU2VjdXJlX1Rva2VuIiwidXNlciI6Im0ubSIsInJhbmRvbSI6Ii${randomPart}==`);
      setGeneratingToken(false);
    }, 800);
  };

  const handleAddWebhookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (whName.trim() && whUrl.trim()) {
      onAddWebhook(whName.trim(), whUrl.trim(), whEvents);
      setWhName('');
      setWhUrl('');
      setShowWebhookForm(false);
    }
  };

  const handleTestWebhook = (id: string, url: string) => {
    setWebhookTestStatus(prev => ({ ...prev, [id]: 'Triggering...' }));
    setTimeout(() => {
      setWebhookTestStatus(prev => ({ ...prev, [id]: '200 OK (Dispatched)' }));
    }, 1000);
  };

  const handleRunGraphQuery = () => {
    setRunningQuery(true);
    setTimeout(() => {
      if (apiEndpoint.includes('/children')) {
        setApiResponse({
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#users('m.m')/drive/root/children",
          "value": [
            { "id": "f-attachments", "name": "Attachments", "folder": { "childCount": 0 }, "size": 0 },
            { "id": "f-documents", "name": "Documents", "folder": { "childCount": 2 }, "size": 31948 }
          ]
        });
      } else if (apiEndpoint.includes('/sharedWithMe')) {
        setApiResponse({
          "value": [
            { "id": "shared-doc-9", "name": "Global Infrastructure Blueprint.pdf", "remoteItem": { "sharedBy": "DevOps Architect" }, "size": 1400223 }
          ]
        });
      } else {
        setApiResponse({
          "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#drive",
          "id": "drive-production-m",
          "driveType": "business",
          "owner": { "user": { "displayName": "Mrithyunjayan M" } },
          "quota": { "deleted": 0, "remaining": 3972909120, "state": "normal", "total": 5368709120, "used": 1395800000 }
        });
      }
      setRunningQuery(false);
    }, 600);
  };

  return (
    <div className="flex-1 bg-[#0c0c0e] p-6 flex flex-col h-[calc(100vh-3.5rem)] text-gray-200 overflow-y-auto select-none">
      <div className="max-w-5xl w-full mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="border-b border-[#232328] pb-5">
          <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            Microsoft Graph API & Entra ID Portal
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Register and query drives programmatically, obtain client secrets, configure automation webhooks, and trigger server deployment hooks.
          </p>
        </div>

        {/* Auth & Token credentials (Feature 15) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Entra ID Creds */}
          <div className="bg-[#16161a] border border-[#232328] p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              Microsoft Entra ID OAuth Client
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Developer Application Client ID</label>
                <input
                  type="text"
                  readOnly
                  value={clientId}
                  className="w-full bg-[#0c0c0e] border border-[#232328] rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-purple-300 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Bearer Authorization Token</label>
                  <button
                    onClick={handleGenerateToken}
                    disabled={generatingToken}
                    className="text-[10px] text-[#3b82f6] hover:underline flex items-center gap-0.5"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${generatingToken ? 'animate-spin' : ''}`} />
                    Refresh Token
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={3}
                  value={entraToken}
                  className="w-full bg-[#0c0c0e] border border-[#232328] rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-gray-400 focus:outline-none leading-normal resize-none"
                />
              </div>
            </div>
          </div>

          {/* Automations Builder */}
          <div className="bg-[#16161a] border border-[#232328] p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-500" />
                DevOps Backup Automations
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Deploy event-triggered automation nodes. On receiving cloud sync triggers, execute microservices or container hot-swaps using simple webhook payloads.
              </p>

              <div className="space-y-2 text-[11px] bg-[#0c0c0e] border border-[#232328] rounded-xl p-3">
                <div className="flex justify-between font-semibold text-gray-300">
                  <span>Trigger Rule</span>
                  <span className="text-emerald-400">Status</span>
                </div>
                <div className="flex justify-between text-gray-500 font-mono text-[10px] pt-1 border-t border-[#232328]/50">
                  <span>on file.create (type: .log) → Slack notify</span>
                  <span className="text-emerald-500 font-bold">ACTIVE</span>
                </div>
                <div className="flex justify-between text-gray-500 font-mono text-[10px]">
                  <span>on server.alert → Docker container reset</span>
                  <span className="text-amber-500 font-bold">STANDBY</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-gray-500 font-sans italic mt-2">
              Note: Token auth scopes cover Files.Read and Files.ReadWrite permissions.
            </div>
          </div>

        </div>

        {/* Graph API Playground Simulator (Feature 15) */}
        <div className="bg-[#16161a] border border-[#232328] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#232328] pb-3">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Code className="w-4.5 h-4.5 text-blue-400" />
              Microsoft Graph API Playground
            </h3>
            <span className="text-[10px] font-mono text-gray-500">Host: graph.microsoft.com</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left selector */}
            <div className="lg:col-span-1 space-y-3.5 text-xs">
              <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Select API Endpoint Route</label>
              <div className="space-y-1.5">
                {[
                  'GET /v1.0/me/drive',
                  'GET /v1.0/me/drive/root/children',
                  'GET /v1.0/me/drive/sharedWithMe'
                ].map(route => (
                  <button
                    key={route}
                    onClick={() => setApiEndpoint(route)}
                    className={`w-full text-left px-3 py-2 border rounded-xl font-mono text-[11px] transition-all flex items-center justify-between ${
                      apiEndpoint === route
                        ? 'bg-blue-950/20 border-blue-500/50 text-[#60a5fa]'
                        : 'bg-[#0c0c0e] border-[#232328] hover:border-gray-600 text-gray-400'
                    }`}
                  >
                    <span>{route}</span>
                    <Play className="w-3 h-3 text-gray-500" />
                  </button>
                ))}
              </div>

              <button
                onClick={handleRunGraphQuery}
                disabled={runningQuery}
                className="w-full py-2 bg-[#005a9e] hover:bg-[#106ebe] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer mt-4"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{runningQuery ? 'Running request...' : 'Submit API Query'}</span>
              </button>
            </div>

            {/* Right JSON viewer */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="flex justify-between items-center bg-[#0c0c0e] border-t border-x border-[#232328] rounded-t-xl px-3 py-1.5 text-[10px] font-mono text-gray-500">
                <span>AUTHORIZATION: BEARER ENTRA_ID_TOKEN...</span>
                <span>STATUS: 200 OK</span>
              </div>
              <pre className="bg-[#0c0c0e] border border-[#232328] rounded-b-xl p-4 text-[10px] text-emerald-400 font-mono h-60 overflow-y-auto whitespace-pre-wrap leading-normal flex-1">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Webhooks Section (Feature 15) */}
        <div className="bg-[#16161a] border border-[#232328] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[#232328] pb-3">
            <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Zap className="w-4.5 h-4.5 text-[#3b82f6]" />
              Configured Automation Webhooks
            </h3>
            <button
              onClick={() => setShowWebhookForm(!showWebhookForm)}
              className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-gray-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Webhook</span>
            </button>
          </div>

          {showWebhookForm && (
            <form onSubmit={handleAddWebhookSubmit} className="p-4 bg-[#0c0c0e] border border-[#232328] rounded-xl flex flex-wrap gap-4 items-end text-xs">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Webhook Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ChatOps Backup Slack Node"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="w-full bg-[#16161a] border border-[#232328] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#3b82f6]"
                />
              </div>

              <div className="flex-[2] min-w-[280px]">
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Payload Delivery URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://yourserver.com/api/backup-webhook"
                  value={whUrl}
                  onChange={(e) => setWhUrl(e.target.value)}
                  className="w-full bg-[#16161a] border border-[#232328] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#3b82f6]"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#005a9e] hover:bg-[#106ebe] text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Register
              </button>
            </form>
          )}

          {/* Webhooks list table */}
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#232328] text-gray-500">
                  <th className="pb-2 font-semibold">Webhook Destination</th>
                  <th className="pb-2 font-semibold">Events Subscribed</th>
                  <th className="pb-2 font-semibold">Secret Key</th>
                  <th className="pb-2 font-semibold text-center">Diagnostics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232328]/50 text-gray-300">
                {webhooks.map(wh => (
                  <tr key={wh.id}>
                    <td className="py-3">
                      <div>
                        <div className="font-bold text-gray-200">{wh.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate max-w-sm">{wh.url}</div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1 flex-wrap">
                        {wh.events.map(ev => (
                          <span key={ev} className="text-[9px] bg-[#1e293b] text-[#3b82f6] border border-[#3b82f6]/20 px-1.5 py-0.2 rounded font-mono">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 font-mono text-[10px] text-gray-500">{wh.secret}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-3">
                        {webhookTestStatus[wh.id] ? (
                          <span className="text-[10px] text-emerald-400 font-semibold">{webhookTestStatus[wh.id]}</span>
                        ) : (
                          <button
                            onClick={() => handleTestWebhook(wh.id, wh.url)}
                            className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] border border-[#232328] text-gray-300 rounded font-bold flex items-center gap-1 transition-all"
                          >
                            <Play className="w-2.5 h-2.5" /> Test ping
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveWebhook(wh.id)}
                          className="text-gray-600 hover:text-red-400 font-semibold transition-all cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
