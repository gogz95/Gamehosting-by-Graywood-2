export type ServerStatus = 'RUNNING' | 'STOPPED' | 'STARTING' | 'DEPLOYING' | 'RESTARTING' | 'ERROR';

export type ProxyEngine = 'NGINX' | 'CADDY' | 'TRAEFIK' | 'CLOUDFLARE_TUNNEL' | 'PLAYIT' | 'VELOCITY';

export type ProxyStatus = 'CONFIGURED' | 'ACTIVE' | 'SSL_PENDING' | 'ERROR';

export type ProtocolType = 'TCP' | 'UDP' | 'BOTH';

export interface GameTemplate {
  id: string;
  name: string;
  gameKey: string;
  category: 'Sandbox' | 'Survival' | 'FPS' | 'RPG' | 'Simulation';
  description: string;
  icon: string;
  banner: string;
  defaultPort: number;
  queryPort?: number;
  rconPort?: number;
  protocol: ProtocolType;
  defaultRamGb: number;
  minRamGb: number;
  defaultCpuCores: number;
  dockerImage: string;
  proxyTypeDefault: ProxyEngine;
  recommendedSubdomainPrefix: string;
  configFiles: {
    filename: string;
    description: string;
    defaultContent: string;
  }[];
  defaultEnvVars: Record<string, string>;
  features: string[];
}

export interface PlayerInfo {
  id: string;
  username: string;
  ping: number;
  onlineSince: string;
  ipAddress?: string;
  isOp?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM' | 'COMMAND';
  message: string;
}

export interface ModPlugin {
  id: string;
  gameId: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: 'Performance' | 'Gameplay' | 'Admin' | 'World' | 'Utility' | 'Core';
  enabled: boolean;
  downloads: string;
  updatedAt: string;
  fileName?: string;
  fileSizeMb?: number;
  source?: 'PRELOADED' | 'DIRECT_URL' | 'FILE_UPLOAD' | 'MOD_HUB';
  downloadUrl?: string;
  configFilename?: string;
  configContent?: string;
}

export interface BackupSnapshot {
  id: string;
  serverId: string;
  serverName?: string;
  name: string;
  sizeMb: number;
  createdAt: string;
  type: 'AUTOMATIC' | 'MANUAL';
  encrypted?: boolean;
  encryptionAlgorithm?: string; // e.g. "AES-256-GCM"
  bucketDestination?: string; // e.g. "s3://game-backups-eu/minecraft-smp"
  status?: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  worldSeed?: string;
  checksum?: string;
}

export interface StorageBucketConfig {
  id: string;
  name: string;
  provider: 'AWS_S3' | 'GOOGLE_CLOUD_STORAGE' | 'HETZNER_STORAGE_BOX' | 'MINIO_S3' | 'CLOUDFLARE_R2';
  bucketName: string;
  region: string;
  endpointUrl?: string;
  accessKeyId: string;
  secretAccessKeyMasked: string;
  encryptionEnabled: boolean;
  encryptionKey: string;
  status: 'CONNECTED' | 'VERIFYING' | 'ERROR';
  totalStoredGb: number;
}

export interface BackupScheduleConfig {
  serverId: string;
  enabled: boolean;
  frequency: 'EVERY_6_HOURS' | 'EVERY_12_HOURS' | 'DAILY' | 'WEEKLY';
  timeOfDayUtc: string; // e.g. "03:00"
  retentionDays: number; // e.g. 14 days
  compressionLevel: 'FAST' | 'HIGH' | 'MAX';
  includePlayerSaves: boolean;
  includeWorldData: boolean;
  includeModConfigs: boolean;
  encryptedBucketId: string;
  lastBackupAt?: string;
  nextBackupAt?: string;
}

export interface DeployedServer {
  id: string;
  name: string;
  gameId: string;
  gameName: string;
  status: ServerStatus;
  nodeId: string;
  nodeName: string;
  nodeIp: string;
  port: number;
  queryPort?: number;
  rconPort?: number;
  ramAllocatedGb: number;
  cpuAllocatedCores: number;
  diskAllocatedGb: number;
  currentPlayers: number;
  maxPlayers: number;
  playersList: PlayerInfo[];
  uptimeSeconds: number;
  subdomain: string; // e.g. "mc"
  baseDomain: string; // e.g. "mygameserver.com"
  fullDomain: string; // e.g. "mc.mygameserver.com"
  proxyEngine: ProxyEngine;
  proxyStatus: ProxyStatus;
  proxySsl: boolean;
  rconPassword?: string;
  createdAt: string;
  envVars: Record<string, string>;
  activeConfigFile: string;
  configContent: string;
  logs: LogEntry[];
  mods: ModPlugin[];
  backups: BackupSnapshot[];
  autoRestart: boolean;
  cpuUsagePct: number;
  ramUsagePct: number;
  dockerContainerId?: string;
  isLiveContainer?: boolean;
}

export interface HostNode {
  id: string;
  name: string;
  ipAddress: string;
  location: string;
  countryCode: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  cpuUsagePct: number;
  ramUsagePct: number;
  totalRamGb: number;
  usedRamGb: number;
  totalDiskGb: number;
  usedDiskGb: number;
  dockerVersion: string;
  activeContainers: number;
  provider?: string; // e.g. "Hetzner Cloud", "DigitalOcean", "Bare Metal", "AWS EC2"
  cpuModel?: string; // e.g. "AMD Ryzen 9 7950X 16-Core", "Intel Xeon Gold 6338"
  cpuCores?: number;
  sshPort?: number;
  dockerEndpoint?: string;
  region?: string;
  tags?: string[];
  publicDomains?: string[];
  agentConnected?: boolean;
  agentVersion?: string;
  lastHeartbeat?: string;
  osType?: 'LINUX' | 'WINDOWS' | 'MACOS' | 'DOCKER';
  enrollmentToken?: string;
}

export interface AgentRegisterPayload {
  token: string;
  name: string;
  location: string;
  ipAddress?: string;
  countryCode?: string;
  provider?: string;
  osType: 'LINUX' | 'WINDOWS' | 'MACOS' | 'DOCKER';
  cpuModel: string;
  cpuCores: number;
  totalRamGb: number;
  totalDiskGb: number;
  dockerVersion: string;
  agentVersion: string;
}

export interface AgentTelemetryPayload {
  nodeId: string;
  cpuUsagePct: number;
  ramUsagePct: number;
  usedRamGb: number;
  totalRamGb: number;
  activeContainers: number;
  timestamp: string;
}

export interface ProxyRule {
  id: string;
  serverId: string;
  serverName: string;
  subdomain: string;
  baseDomain: string;
  fullDomain: string;
  targetIp: string;
  targetPort: number;
  protocol: ProtocolType;
  engine: ProxyEngine;
  sslEnabled: boolean;
  status: ProxyStatus;
  lastVerified: string;
  bandwidthUsageMb: number;
}

export interface DockerSystemStatus {
  online: boolean;
  version?: string;
  containersCount?: number;
  imagesCount?: number;
  os?: string;
  endpoint?: string;
  mode: 'LIVE' | 'STANDALONE';
  message?: string;
}

export interface GameQueryResult {
  online: boolean;
  name?: string;
  map?: string;
  players: number;
  maxPlayers: number;
  playerList?: { name: string; ping?: number }[];
  ping: number;
  connect?: string;
  version?: string;
  raw?: any;
  error?: string;
}

export interface LiveProxyApplyResult {
  engine: ProxyEngine;
  status: 'APPLIED' | 'FAILED' | 'SIMULATED';
  message: string;
  timestamp: string;
  endpointCalled?: string;
}

export interface CloudflareDnsRecord {
  id?: string;
  type: 'A' | 'CNAME' | 'SRV' | 'TXT';
  name: string;
  content: string;
  proxied: boolean;
  ttl: number;
}
