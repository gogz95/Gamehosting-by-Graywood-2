import { DeployedServer, HostNode, ProxyRule } from '../types';

export const INITIAL_HOST_NODES: HostNode[] = [
  {
    id: 'node-eu-1',
    name: 'Node-01 (Frankfurt Germany)',
    ipAddress: '162.55.180.42',
    location: 'Frankfurt, Germany',
    countryCode: 'DE',
    status: 'ONLINE',
    cpuUsagePct: 34,
    ramUsagePct: 58,
    totalRamGb: 64,
    usedRamGb: 37.1,
    totalDiskGb: 1000,
    usedDiskGb: 320,
    dockerVersion: 'Docker v26.1.3 (API v1.45)',
    activeContainers: 5,
    provider: 'Hetzner Dedicated AX102',
    cpuModel: 'AMD Ryzen 9 7950X (16 Cores / 32 Threads @ 4.5GHz)',
    cpuCores: 16,
    sshPort: 22,
    dockerEndpoint: 'tcp://162.55.180.42:2375',
    region: 'eu-central-1',
    tags: ['High RAM', 'DDoS Protected', 'NVMe Gen4', 'Modpack Ready'],
    publicDomains: ['srv.playcraft.gg', 'nexus-node.io']
  },
  {
    id: 'node-us-east',
    name: 'Node-02 (US East - N. Virginia)',
    ipAddress: '198.51.100.88',
    location: 'Ashburn, VA, USA',
    countryCode: 'US',
    status: 'ONLINE',
    cpuUsagePct: 22,
    ramUsagePct: 41,
    totalRamGb: 32,
    usedRamGb: 13.1,
    totalDiskGb: 512,
    usedDiskGb: 180,
    dockerVersion: 'Docker v26.0.2 (API v1.44)',
    activeContainers: 3,
    provider: 'DigitalOcean Premium Droplet',
    cpuModel: 'Intel Xeon Platinum 8358 (8 Cores @ 3.4GHz)',
    cpuCores: 8,
    sshPort: 2202,
    dockerEndpoint: 'tcp://198.51.100.88:2375',
    region: 'us-east-1',
    tags: ['Low Latency', 'Cloud Compute', 'SSD'],
    publicDomains: ['srv.playcraft.gg', 'us.nexus-node.io']
  },
  {
    id: 'node-ap-singapore',
    name: 'Node-03 (Singapore APAC)',
    ipAddress: '103.252.118.15',
    location: 'Singapore, SG',
    countryCode: 'SG',
    status: 'ONLINE',
    cpuUsagePct: 15,
    ramUsagePct: 28,
    totalRamGb: 128,
    usedRamGb: 35.8,
    totalDiskGb: 2000,
    usedDiskGb: 410,
    dockerVersion: 'Docker v26.1.0 (API v1.45)',
    activeContainers: 2,
    provider: 'OVHcloud Enterprise Bare Metal',
    cpuModel: 'AMD EPYC 7543 (32 Cores / 64 Threads @ 3.7GHz)',
    cpuCores: 32,
    sshPort: 22,
    dockerEndpoint: 'tcp://103.252.118.15:2375',
    region: 'ap-southeast-1',
    tags: ['Ultra High RAM', '32 Cores', 'APAC Hub', 'NVMe RAID1'],
    publicDomains: ['asia.playcraft.gg', 'nexus-node.io']
  }
];

export const INITIAL_DEPLOYED_SERVERS: DeployedServer[] = [
  {
    id: 'srv-mc-01',
    name: 'Survival Craft SMP',
    gameId: 'minecraft-java',
    gameName: 'Minecraft Java Edition',
    status: 'RUNNING',
    nodeId: 'node-eu-1',
    nodeName: 'Node-01 (Frankfurt Germany)',
    nodeIp: '162.55.180.42',
    port: 25565,
    queryPort: 25565,
    rconPort: 25575,
    ramAllocatedGb: 6,
    cpuAllocatedCores: 2,
    diskAllocatedGb: 25,
    currentPlayers: 12,
    maxPlayers: 30,
    uptimeSeconds: 864200,
    subdomain: 'mc',
    baseDomain: 'srv.playcraft.gg',
    fullDomain: 'mc.srv.playcraft.gg',
    proxyEngine: 'VELOCITY',
    proxyStatus: 'ACTIVE',
    proxySsl: true,
    rconPassword: 'SecureRconPass2026',
    createdAt: '2026-07-15T14:22:00Z',
    autoRestart: true,
    cpuUsagePct: 28,
    ramUsagePct: 62,
    playersList: [
      { id: 'p1', username: 'AlexTheBuilder', ping: 18, onlineSince: '2h 14m', isOp: true },
      { id: 'p2', username: 'NetherExplorer99', ping: 34, onlineSince: '45m' },
      { id: 'p3', username: 'RedstoneEngineer', ping: 22, onlineSince: '3h 10m' },
      { id: 'p4', username: 'DiamondMinerX', ping: 42, onlineSince: '12m' }
    ],
    envVars: {
      EULA: 'TRUE',
      TYPE: 'PAPER',
      VERSION: '1.20.4',
      MEMORY: '6G',
      MAX_PLAYERS: '30'
    },
    activeConfigFile: 'server.properties',
    configContent: `# Minecraft Server Properties
server-port=25565
enable-rcon=true
rcon.port=25575
rcon.password=SecureRconPass2026
gamemode=survival
difficulty=hard
max-players=30
motd=§aSurvival Craft SMP §7[§e1.20.4§7] §f- Velocity Proxy Connected!
online-mode=true
pvp=true
view-distance=12
allow-flight=false
`,
    logs: [
      { id: 'l1', timestamp: '04:00:12', level: 'INFO', message: '[Server thread/INFO]: Preparing level "world"' },
      { id: 'l2', timestamp: '04:00:15', level: 'INFO', message: '[Server thread/INFO]: Done (3.412s)! For help, type "help"' },
      { id: 'l3', timestamp: '04:01:02', level: 'INFO', message: '[Velocity/Proxy]: Connection routed from subdomain mc.srv.playcraft.gg -> 162.55.180.42:25565' },
      { id: 'l4', timestamp: '04:02:10', level: 'INFO', message: '[Server thread/INFO]: AlexTheBuilder[/172.18.0.1:54210] logged in with entity id 128' },
      { id: 'l5', timestamp: '04:03:45', level: 'INFO', message: '[Server thread/INFO]: NetherExplorer99 joined the game' }
    ],
    mods: [
      { id: 'm1', gameId: 'minecraft-java', name: 'ViaVersion', version: '4.9.2', author: 'ViaVersion Team', description: 'Allows newer and older client versions to connect.', category: 'Utility', enabled: true, downloads: '1.2M', updatedAt: '2026-06-10' },
      { id: 'm2', gameId: 'minecraft-java', name: 'EssentialsX', version: '2.20.1', author: 'TeamCity', description: 'Core player management, teleportation, kits, and economy.', category: 'Admin', enabled: true, downloads: '4.5M', updatedAt: '2026-05-20' },
      { id: 'm3', gameId: 'minecraft-java', name: 'WorldGuard', version: '7.0.9', author: 'sk89q', description: 'Protects regions from griefing and unwanted PvP.', category: 'Admin', enabled: true, downloads: '2.8M', updatedAt: '2026-04-12' },
      { id: 'm4', gameId: 'minecraft-java', name: 'Chunky', version: '1.3.92', author: 'pop4959', description: 'Pre-generates chunks to prevent server lag.', category: 'Performance', enabled: true, downloads: '890K', updatedAt: '2026-07-01' }
    ],
    backups: [
      { id: 'b1', serverId: 'srv-mc-01', name: 'daily-world-snapshot-20260808.tar.gz', sizeMb: 420, createdAt: '2026-08-08T02:00:00Z', type: 'AUTOMATIC' },
      { id: 'b2', serverId: 'srv-mc-01', name: 'pre-update-v1.20-backup.tar.gz', sizeMb: 395, createdAt: '2026-08-01T10:15:00Z', type: 'MANUAL' }
    ]
  },
  {
    id: 'srv-factory-01',
    name: 'Mega Automation Factory',
    gameId: 'satisfactory',
    gameName: 'Satisfactory Dedicated',
    status: 'RUNNING',
    nodeId: 'node-eu-1',
    nodeName: 'Node-01 (Frankfurt Germany)',
    nodeIp: '162.55.180.42',
    port: 15777,
    queryPort: 15000,
    ramAllocatedGb: 10,
    cpuAllocatedCores: 4,
    diskAllocatedGb: 40,
    currentPlayers: 3,
    maxPlayers: 8,
    uptimeSeconds: 345000,
    subdomain: 'factory',
    baseDomain: 'srv.playcraft.gg',
    fullDomain: 'factory.srv.playcraft.gg',
    proxyEngine: 'NGINX',
    proxyStatus: 'ACTIVE',
    proxySsl: true,
    createdAt: '2026-07-28T18:00:00Z',
    autoRestart: true,
    cpuUsagePct: 45,
    ramUsagePct: 78,
    playersList: [
      { id: 'fp1', username: 'PioneerAlpha', ping: 24, onlineSince: '1h 10m' },
      { id: 'fp2', username: 'EfficiencyExpert', ping: 29, onlineSince: '3h 40m' }
    ],
    envVars: {
      MAXPLAYERS: '8',
      AUTOPAUSE: 'true',
      AUTOSAVENUM: '10'
    },
    activeConfigFile: 'Engine.ini',
    configContent: `[/Script/Engine.GameEngine]
+ServerOperators=SteamID64

[/Script/Engine.NetworkDriver]
NetServerMaxTickRate=120
`,
    logs: [
      { id: 'fl1', timestamp: '04:10:00', level: 'INFO', message: '[SatisfactoryServer]: Listening on UDP port 15777' },
      { id: 'fl2', timestamp: '04:10:05', level: 'INFO', message: '[NginxStreamProxy]: UDP proxy stream stream_satisfactory listening on 443 -> 127.0.0.1:15777' },
      { id: 'fl3', timestamp: '04:12:30', level: 'INFO', message: '[SaveSystem]: World auto-save completed successfully (size: 42.8MB)' }
    ],
    mods: [],
    backups: [
      { id: 'fb1', serverId: 'srv-factory-01', name: 'save-tier8-space-elevator.sav', sizeMb: 45, createdAt: '2026-08-07T12:00:00Z', type: 'MANUAL' }
    ]
  },
  {
    id: 'srv-valheim-01',
    name: 'Valhalla Viking Realm',
    gameId: 'valheim',
    gameName: 'Valheim Dedicated',
    status: 'RUNNING',
    nodeId: 'node-us-east',
    nodeName: 'Node-02 (US East - N. Virginia)',
    nodeIp: '198.51.100.88',
    port: 2456,
    queryPort: 2457,
    ramAllocatedGb: 4,
    cpuAllocatedCores: 2,
    diskAllocatedGb: 15,
    currentPlayers: 4,
    maxPlayers: 10,
    uptimeSeconds: 120000,
    subdomain: 'valheim',
    baseDomain: 'srv.playcraft.gg',
    fullDomain: 'valheim.srv.playcraft.gg',
    proxyEngine: 'CLOUDFLARE_TUNNEL',
    proxyStatus: 'ACTIVE',
    proxySsl: true,
    createdAt: '2026-08-02T11:30:00Z',
    autoRestart: true,
    cpuUsagePct: 18,
    ramUsagePct: 42,
    playersList: [
      { id: 'vp1', username: 'RagnarLothbrok', ping: 32, onlineSince: '50m' },
      { id: 'vp2', username: 'ShieldMaiden', ping: 28, onlineSince: '1h 05m' }
    ],
    envVars: {
      SERVER_NAME: 'Valhalla Viking Realm',
      WORLD_NAME: 'MainValhalla',
      SERVER_PASS: 'VikingPass2026!',
      CROSSPLAY: '1'
    },
    activeConfigFile: 'valheim_server.cfg',
    configContent: `SERVER_NAME="Valhalla Viking Realm"
WORLD_NAME="MainValhalla"
SERVER_PASSWORD="VikingPass2026!"
PUBLIC=1
CROSSPLAY=1
`,
    logs: [
      { id: 'vl1', timestamp: '03:50:00', level: 'INFO', message: '[Valheim]: Cloudflare Tunnel "valheim-tunnel-us" connected to edge server iad02' },
      { id: 'vl2', timestamp: '03:50:12', level: 'INFO', message: '[Valheim]: World "MainValhalla" loaded in 2.1s' }
    ],
    mods: [
      { id: 'vm1', gameId: 'valheim', name: 'BepInExPack', version: '5.4.2201', author: 'denikson', description: 'Base modding framework required for Valheim mods.', category: 'Utility', enabled: true, downloads: '3.1M', updatedAt: '2026-05-10' }
    ],
    backups: []
  }
];

export const INITIAL_PROXY_RULES: ProxyRule[] = [
  {
    id: 'pr-1',
    serverId: 'srv-mc-01',
    serverName: 'Survival Craft SMP',
    subdomain: 'mc',
    baseDomain: 'srv.playcraft.gg',
    fullDomain: 'mc.srv.playcraft.gg',
    targetIp: '162.55.180.42',
    targetPort: 25565,
    protocol: 'TCP',
    engine: 'VELOCITY',
    sslEnabled: true,
    status: 'ACTIVE',
    lastVerified: 'Just now',
    bandwidthUsageMb: 1420
  },
  {
    id: 'pr-2',
    serverId: 'srv-factory-01',
    serverName: 'Mega Automation Factory',
    subdomain: 'factory',
    baseDomain: 'srv.playcraft.gg',
    fullDomain: 'factory.srv.playcraft.gg',
    targetIp: '162.55.180.42',
    targetPort: 15777,
    protocol: 'UDP',
    engine: 'NGINX',
    sslEnabled: true,
    status: 'ACTIVE',
    lastVerified: '2 mins ago',
    bandwidthUsageMb: 8900
  },
  {
    id: 'pr-3',
    serverId: 'srv-valheim-01',
    serverName: 'Valhalla Viking Realm',
    subdomain: 'valheim',
    baseDomain: 'srv.playcraft.gg',
    fullDomain: 'valheim.srv.playcraft.gg',
    targetIp: '198.51.100.88',
    targetPort: 2456,
    protocol: 'UDP',
    engine: 'CLOUDFLARE_TUNNEL',
    sslEnabled: true,
    status: 'ACTIVE',
    lastVerified: '5 mins ago',
    bandwidthUsageMb: 620
  }
];
