import { HostNode, DeployedServer, ProxyRule } from '../types';

export const INITIAL_HOST_NODES: HostNode[] = [
  {
    id: 'node-local-master',
    name: 'Local Host (Master Node)',
    ipAddress: '127.0.0.1',
    location: 'Localhost / Primary Host',
    countryCode: 'US',
    status: 'ONLINE',
    cpuUsagePct: 12,
    ramUsagePct: 24,
    totalRamGb: 64,
    usedRamGb: 15.4,
    totalDiskGb: 1000,
    usedDiskGb: 280,
    dockerVersion: 'Docker Engine (Local Socket)',
    activeContainers: 0,
    provider: 'Local Machine / Dedicated Bare Metal',
    cpuModel: 'Host CPU (Multi-Core)',
    cpuCores: 16,
    sshPort: 22,
    dockerEndpoint: '//./pipe/docker_engine',
    region: 'local-cluster-1',
    tags: ['Master Node', 'Local Docker Engine', 'Fast NVMe Storage'],
    publicDomains: ['localhost', 'srv.playcraft.gg']
  }
];

export const INITIAL_DEPLOYED_SERVERS: DeployedServer[] = [];

export const INITIAL_PROXY_RULES: ProxyRule[] = [];
