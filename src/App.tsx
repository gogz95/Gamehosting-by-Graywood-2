import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ServerDashboard } from './components/ServerDashboard';
import { GameCatalog } from './components/GameCatalog';
import { DeployModal } from './components/DeployModal';
import { ServerDetailView } from './components/ServerDetailView';
import { ProxyManager } from './components/ProxyManager';
import { NodesManager } from './components/NodesManager';
import { ModManager } from './components/ModManager';
import { BackupManager } from './components/BackupManager';
import { ExecutablePackager } from './components/ExecutablePackager';
import { AiTroubleshooter } from './components/AiTroubleshooter';

import { INITIAL_DEPLOYED_SERVERS, INITIAL_HOST_NODES, INITIAL_PROXY_RULES } from './data/mockServers';
import { DeployedServer, GameTemplate, HostNode, ModPlugin, ProxyRule, BackupSnapshot } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'servers' | 'catalog' | 'proxies' | 'nodes' | 'mods' | 'backups' | 'ai' | 'export'>('servers');
  const [servers, setServers] = useState<DeployedServer[]>(INITIAL_DEPLOYED_SERVERS);
  const [hostNodes, setHostNodes] = useState<HostNode[]>(INITIAL_HOST_NODES);
  const [proxyRules, setProxyRules] = useState<ProxyRule[]>(INITIAL_PROXY_RULES);

  const [selectedServer, setSelectedServer] = useState<DeployedServer | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('all');

  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [preselectedGame, setPreselectedGame] = useState<GameTemplate | null>(null);

  // Initial fetch of persistent cluster state from backend database
  useEffect(() => {
    fetch('/api/servers')
      .then((res) => res.json())
      .then((data) => {
        if (data.servers && Array.isArray(data.servers) && data.servers.length > 0) {
          setServers(data.servers);
        }
      })
      .catch(() => {});

    fetch('/api/proxies')
      .then((res) => res.json())
      .then((data) => {
        if (data.rules && Array.isArray(data.rules) && data.rules.length > 0) {
          setProxyRules(data.rules);
        }
      })
      .catch(() => {});
  }, []);

  // Sync live connected agent nodes from master gateway
  useEffect(() => {
    const fetchLiveNodes = () => {
      fetch('/api/nodes')
        .then((res) => res.json())
        .then((data) => {
          if (data.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
            setHostNodes((prev) => {
              const nodeMap = new Map<string, HostNode>();
              prev.forEach((n) => nodeMap.set(n.id, n));
              data.nodes.forEach((n: HostNode) => nodeMap.set(n.id, n));
              return Array.from(nodeMap.values());
            });
          }
        })
        .catch(() => {});
    };

    fetchLiveNodes();
    const interval = setInterval(fetchLiveNodes, 4000);
    return () => clearInterval(interval);
  }, []);

  // Deploy Modal Handler
  const handleOpenDeployModal = (game?: GameTemplate) => {
    if (game) {
      setPreselectedGame(game);
    } else {
      setPreselectedGame(null);
    }
    setDeployModalOpen(true);
  };

  const syncServerUpdate = (updatedServer: DeployedServer) => {
    fetch(`/api/servers/${updatedServer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedServer)
    }).catch(() => {});
  };

  const handleServerDeployed = (newServer: DeployedServer) => {
    setServers((prev) => [newServer, ...prev]);

    // Create corresponding proxy rule
    const newProxyRule: ProxyRule = {
      id: `pr-${Date.now().toString(36)}`,
      serverId: newServer.id,
      serverName: newServer.name,
      subdomain: newServer.subdomain,
      baseDomain: newServer.baseDomain,
      fullDomain: newServer.fullDomain,
      targetIp: newServer.nodeIp,
      targetPort: newServer.port,
      protocol: 'TCP',
      engine: newServer.proxyEngine,
      sslEnabled: newServer.proxySsl,
      status: 'ACTIVE',
      lastVerified: 'Just now',
      bandwidthUsageMb: 0
    };

    setProxyRules((prev) => [newProxyRule, ...prev]);

    // Persist server and proxy to database
    fetch('/api/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newServer)
    }).catch(() => {});

    fetch('/api/proxies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProxyRule)
    }).catch(() => {});
  };

  const handleToggleStatus = (serverId: string, action: 'START' | 'STOP' | 'RESTART') => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        let newStatus = s.status;
        if (action === 'START') newStatus = 'RUNNING';
        if (action === 'STOP') newStatus = 'STOPPED';
        if (action === 'RESTART') newStatus = 'RUNNING';

        if (s.dockerContainerId) {
          fetch('/api/docker/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              containerId: s.dockerContainerId,
              action,
              nodeId: s.nodeId
            })
          }).catch(() => {});
        }

        const updated: DeployedServer = {
          ...s,
          status: newStatus,
          logs: [
            ...s.logs,
            {
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              level: 'SYSTEM',
              message: `Container action ${action} executed by user.`
            }
          ]
        };

        syncServerUpdate(updated);
        return updated;
      })
    );

    if (selectedServer && selectedServer.id === serverId) {
      setSelectedServer((prev) => (prev ? { ...prev, status: action === 'STOP' ? 'STOPPED' : 'RUNNING' } : null));
    }
  };

  const handleUpdateServer = (updatedServer: DeployedServer) => {
    setServers((prev) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
    syncServerUpdate(updatedServer);
    if (selectedServer && selectedServer.id === updatedServer.id) {
      setSelectedServer(updatedServer);
    }
  };

  const handleDeleteServer = (serverId: string) => {
    setServers((prev) => prev.filter((s) => s.id !== serverId));
    setProxyRules((prev) => prev.filter((p) => p.serverId !== serverId));
    if (selectedServer && selectedServer.id === serverId) {
      setSelectedServer(null);
    }
    fetch(`/api/servers/${serverId}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleSelectGameForDeploy = (gameTemplate: GameTemplate) => {
    handleOpenDeployModal(gameTemplate);
  };

  const handleAddNode = (newNode: HostNode) => {
    setHostNodes((prev) => [...prev, newNode]);
  };

  const handleDeleteNode = (nodeId: string) => {
    setHostNodes((prev) => prev.filter((n) => n.id !== nodeId));
  };

  // Mod Handlers
  const handleInstallMod = (serverId: string, mod: ModPlugin) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        const updated: DeployedServer = {
          ...s,
          mods: [...s.mods, mod],
          logs: [
            ...s.logs,
            {
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              level: 'INFO',
              message: `[ModManager]: Self-downloaded and installed mod ${mod.name} (v${mod.version}) into /mods.`
            }
          ]
        };
        syncServerUpdate(updated);
        return updated;
      })
    );
  };

  const handleUninstallMod = (serverId: string, modId: string) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        const targetMod = s.mods.find((m) => m.id === modId);
        const updated: DeployedServer = {
          ...s,
          mods: s.mods.filter((m) => m.id !== modId),
          logs: [
            ...s.logs,
            {
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              level: 'INFO',
              message: `[ModManager]: Uninstalled mod ${targetMod?.name || modId} from server.`
            }
          ]
        };
        syncServerUpdate(updated);
        return updated;
      })
    );
  };

  const handleToggleMod = (serverId: string, modId: string) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        const updated: DeployedServer = {
          ...s,
          mods: s.mods.map((m) => (m.id === modId ? { ...m, enabled: !m.enabled } : m))
        };
        syncServerUpdate(updated);
        return updated;
      })
    );
  };

  const handleUpdateModConfig = (serverId: string, modId: string, newConfig: string) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        const targetMod = s.mods.find((m) => m.id === modId);
        const updated: DeployedServer = {
          ...s,
          mods: s.mods.map((m) => (m.id === modId ? { ...m, configContent: newConfig } : m)),
          logs: [
            ...s.logs,
            {
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              level: 'SYSTEM',
              message: `[ModManager]: Configuration saved for mod ${targetMod?.name || modId}.`
            }
          ]
        };
        syncServerUpdate(updated);
        return updated;
      })
    );
  };

  // Backup Handlers
  const handleTakeSnapshot = (serverId: string, snapshotName: string) => {
    const newSnapshot: BackupSnapshot = {
      id: `snap-${Date.now()}`,
      serverId,
      name: snapshotName || `manual-save-${Date.now().toString(36)}.tar.gz`,
      sizeMb: Math.floor(Math.random() * 200 + 150),
      createdAt: new Date().toISOString(),
      type: 'MANUAL',
      encrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
      bucketDestination: 's3://game-saves-vault-frankfurt'
    };

    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        const updated: DeployedServer = {
          ...s,
          backups: [newSnapshot, ...(s.backups || [])],
          logs: [
            ...s.logs,
            {
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              level: 'INFO',
              message: `[BackupManager]: Instant snapshot ${newSnapshot.name} created and encrypted to S3 Vault.`
            }
          ]
        };
        syncServerUpdate(updated);
        return updated;
      })
    );
  };

  const handleRestoreSnapshot = (serverId: string, snapshotId: string) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        const targetSnap = (s.backups || []).find((b) => b.id === snapshotId);
        const updated: DeployedServer = {
          ...s,
          logs: [
            ...s.logs,
            {
              id: Date.now().toString(),
              timestamp: new Date().toLocaleTimeString(),
              level: 'INFO',
              message: `[BackupManager]: Successfully restored server save state from snapshot ${targetSnap?.name || snapshotId}.`
            }
          ]
        };
        syncServerUpdate(updated);
        return updated;
      })
    );
  };

  const handleDeleteSnapshot = (serverId: string, snapshotId: string) => {
    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        const updated: DeployedServer = {
          ...s,
          backups: (s.backups || []).filter((b) => b.id !== snapshotId)
        };
        syncServerUpdate(updated);
        return updated;
      })
    );
  };

  const handleImportCluster = (data: { servers: DeployedServer[]; hostNodes: HostNode[]; proxyRules: ProxyRule[] }) => {
    if (data.servers && data.servers.length > 0) setServers(data.servers);
    if (data.hostNodes && data.hostNodes.length > 0) setHostNodes(data.hostNodes);
    if (data.proxyRules && data.proxyRules.length > 0) setProxyRules(data.proxyRules);
  };

  const filteredServers = servers.filter((s) => {
    if (selectedNodeId === 'all') return true;
    return s.nodeId === selectedNodeId;
  });

  const runningCount = servers.filter((s) => s.status === 'RUNNING').length;

  return (
    <div className="min-h-screen bg-[#0A0B10] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Top Fixed Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedServer(null);
          setActiveTab(tab);
        }}
        onOpenDeployModal={() => handleOpenDeployModal()}
        serverCount={servers.length}
        runningCount={runningCount}
        hostNodes={hostNodes}
        selectedNodeId={selectedNodeId}
        setSelectedNodeId={setSelectedNodeId}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedServer ? (
          <ServerDetailView
            server={selectedServer}
            onBack={() => setSelectedServer(null)}
            onUpdateServer={handleUpdateServer}
            onDeleteServer={handleDeleteServer}
          />
        ) : (
          <>
            {activeTab === 'servers' && (
              <ServerDashboard
                servers={filteredServers}
                onSelectServer={(srv) => setSelectedServer(srv)}
                onToggleStatus={handleToggleStatus}
                onOpenDeployModal={() => handleOpenDeployModal()}
                onOpenProxyManager={() => setActiveTab('proxies')}
              />
            )}

            {activeTab === 'catalog' && (
              <GameCatalog onSelectGameForDeploy={handleSelectGameForDeploy} />
            )}

            {activeTab === 'proxies' && (
              <ProxyManager servers={servers} proxyRules={proxyRules} />
            )}

            {activeTab === 'nodes' && (
              <NodesManager
                hostNodes={hostNodes}
                onAddNode={handleAddNode}
                onDeleteNode={handleDeleteNode}
              />
            )}

            {activeTab === 'mods' && (
              <ModManager
                servers={servers}
                onInstallMod={handleInstallMod}
                onUninstallMod={handleUninstallMod}
                onToggleMod={handleToggleMod}
                onUpdateModConfig={handleUpdateModConfig}
              />
            )}

            {activeTab === 'backups' && (
              <BackupManager
                servers={servers}
                onTakeSnapshot={handleTakeSnapshot}
                onRestoreSnapshot={handleRestoreSnapshot}
                onDeleteSnapshot={handleDeleteSnapshot}
              />
            )}

            {activeTab === 'ai' && <AiTroubleshooter servers={servers} />}

            {activeTab === 'export' && (
              <ExecutablePackager
                servers={servers}
                hostNodes={hostNodes}
                proxyRules={proxyRules}
                onImportCluster={handleImportCluster}
              />
            )}
          </>
        )}
      </main>

      {/* Global 1-Click Deploy Modal */}
      <DeployModal
        isOpen={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        preselectedGameTemplate={preselectedGame}
        hostNodes={hostNodes}
        existingServers={servers}
        onServerDeployed={handleServerDeployed}
      />

      {/* Footer */}
      <footer className="bg-[#0F1117]/80 border-t border-white/5 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-medium">
          <p>
            NexusNode Proxy & Deployer — Automated Game Server Container, Modding & Subdomain Routing Cluster.
          </p>
        </div>
      </footer>
    </div>
  );
}
