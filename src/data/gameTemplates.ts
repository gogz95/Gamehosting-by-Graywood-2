import { GameTemplate } from '../types';

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'minecraft-java',
    name: 'Minecraft Java Edition',
    gameKey: 'minecraft',
    category: 'Sandbox',
    description: 'Paper / Spigot / Vanilla high performance Minecraft server with RCON and Velocity reverse proxy routing support.',
    icon: 'Pickaxe',
    banner: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=800&q=80',
    defaultPort: 25565,
    queryPort: 25565,
    rconPort: 25575,
    protocol: 'TCP',
    defaultRamGb: 4,
    minRamGb: 2,
    defaultCpuCores: 2,
    dockerImage: 'itzg/minecraft-server:latest',
    proxyTypeDefault: 'VELOCITY',
    recommendedSubdomainPrefix: 'mc',
    configFiles: [
      {
        filename: 'server.properties',
        description: 'Primary Minecraft server configuration settings',
        defaultContent: `# Minecraft Server Properties
server-port=25565
enable-rcon=true
rcon.port=25575
rcon.password=SecureAdminPass123!
gamemode=survival
difficulty=normal
max-players=20
motd=Welcome to our Custom GameHost Minecraft Server!
online-mode=true
pvp=true
view-distance=10
spawn-protection=16
allow-flight=false
enable-command-block=true
`
      },
      {
        filename: 'paper.yml',
        description: 'Paper optimization and entity limits',
        defaultContent: `verbose: false
config-version: 27
world-settings:
  default:
    anti-xray:
      enabled: true
      engine-mode: 1
    despawn-ranges:
      monster:
        soft: 32
        hard: 128
`
      }
    ],
    defaultEnvVars: {
      EULA: 'TRUE',
      TYPE: 'PAPER',
      VERSION: '1.20.4',
      MEMORY: '4G',
      MAX_PLAYERS: '20',
      MOTD: 'Powered by GameHost Proxy Deployer'
    },
    features: ['Paper/Spigot Plugins', 'RCON Remote Console', 'Velocity/BungeeCord Proxy', 'Paper Anti-Xray']
  },
  {
    id: 'satisfactory',
    name: 'Satisfactory Dedicated',
    gameKey: 'satisfactory',
    category: 'Simulation',
    description: 'Factory building automation multiplayer server with UDP stream proxying and auto-save cloud sync.',
    icon: 'Factory',
    banner: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    defaultPort: 15777,
    queryPort: 15000,
    protocol: 'UDP',
    defaultRamGb: 8,
    minRamGb: 6,
    defaultCpuCores: 4,
    dockerImage: 'wolveix/satisfactory-server:latest',
    proxyTypeDefault: 'NGINX',
    recommendedSubdomainPrefix: 'factory',
    configFiles: [
      {
        filename: 'Engine.ini',
        description: 'Network tick rate and max player bandwidth bounds',
        defaultContent: `[/Script/Engine.GameEngine]
+ServerOperators=SteamID64

[/Script/Engine.NetworkDriver]
NetServerMaxTickRate=120
`
      }
    ],
    defaultEnvVars: {
      MAXPLAYERS: '8',
      AUTOPAUSE: 'true',
      AUTOSAVENUM: '10',
      AUTOSAVEINTERVAL: '300',
      DEBUG: 'false'
    },
    features: ['Crossplay Enabled', 'Auto Save Rotation', 'UDP Stream Proxy', 'High Tickrate Option']
  },
  {
    id: 'valheim',
    name: 'Valheim Dedicated',
    gameKey: 'valheim',
    category: 'Survival',
    description: 'Viking survival co-op dedicated server with PlayFab crossplay support and BepInEx mod launcher.',
    icon: 'Axe',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    defaultPort: 2456,
    queryPort: 2457,
    protocol: 'UDP',
    defaultRamGb: 4,
    minRamGb: 2,
    defaultCpuCores: 2,
    dockerImage: 'mbentley/valheim:latest',
    proxyTypeDefault: 'CLOUDFLARE_TUNNEL',
    recommendedSubdomainPrefix: 'valheim',
    configFiles: [
      {
        filename: 'valheim_server.cfg',
        description: 'Valheim server password and world save parameters',
        defaultContent: `SERVER_NAME="Valheim Realm"
WORLD_NAME="Valhalla_Main"
SERVER_PASSWORD="VikingSecretPass"
PUBLIC=1
CROSSPLAY=1
`
      }
    ],
    defaultEnvVars: {
      SERVER_NAME: 'Valheim Viking Sanctuary',
      WORLD_NAME: 'DedicatedWorld',
      SERVER_PASS: 'VikingPass2026!',
      CROSSPLAY: '1'
    },
    features: ['PlayFab Crossplay', 'BepInEx Mod Framework', 'Cloud World Backup', 'Password Protection']
  },
  {
    id: 'palworld',
    name: 'Palworld Server',
    gameKey: 'palworld',
    category: 'Survival',
    description: 'Palworld dedicated multiplayer server with support for up to 32 players and custom world drop rates.',
    icon: 'Gamepad2',
    banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    defaultPort: 8211,
    queryPort: 27015,
    rconPort: 25575,
    protocol: 'UDP',
    defaultRamGb: 12,
    minRamGb: 8,
    defaultCpuCores: 4,
    dockerImage: 'thijsvanloef/palworld-server-docker:latest',
    proxyTypeDefault: 'TRAEFIK',
    recommendedSubdomainPrefix: 'pal',
    configFiles: [
      {
        filename: 'PalWorldSettings.ini',
        description: 'World exp multiplier, catch rates, and damage scales',
        defaultContent: `[/Script/Pal.PalGameWorldSettings]
OptionSettings=(Difficulty=None,DayTimeSpeedRate=1.000000,NightTimeSpeedRate=1.000000,ExpRate=1.500000,PalCaptureRate=1.000000,PalSpawnNumRate=1.000000,PalDamageRateAttack=1.000000,PalDamageRateDefense=1.000000,PlayerDamageRateAttack=1.000000,PlayerDamageRateDefense=1.000000,GuildPlayerMaxNum=20,PalEggDefaultHatchingTime=1.000000)
`
      }
    ],
    defaultEnvVars: {
      PLAYERS: '32',
      PORT: '8211',
      P2P_PORT: '8212',
      COMMUNITY: 'false',
      SERVER_NAME: 'Palworld Base Server'
    },
    features: ['32 Player Guilds', 'Custom Drop Multipliers', 'RCON Administration', 'Fast Memory GC']
  },
  {
    id: 'rust',
    name: 'Rust Dedicated Server',
    gameKey: 'rust',
    category: 'FPS',
    description: 'Rust multiplayer server with Oxide/uMod framework support, RCON remote console, and procedural map generation.',
    icon: 'ShieldAlert',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    defaultPort: 28015,
    queryPort: 28016,
    rconPort: 28016,
    protocol: 'BOTH',
    defaultRamGb: 12,
    minRamGb: 8,
    defaultCpuCores: 4,
    dockerImage: 'didstopia/rust-server:latest',
    proxyTypeDefault: 'NGINX',
    recommendedSubdomainPrefix: 'rust',
    configFiles: [
      {
        filename: 'server.cfg',
        description: 'Rust server seed, map size, and decay rates',
        defaultContent: `server.hostname "Rust Official Proxy Server"
server.description "High tick rate Rust server with proxy protection"
server.seed 4029102
server.worldsize 4000
server.maxplayers 100
decay.scale 0.8
`
      }
    ],
    defaultEnvVars: {
      RUST_SERVER_START_COMMAND: '-batchmode +server.port 28015 +server.queryport 28016',
      RUST_SERVER_NAME: 'GameHost Rust Haven',
      RUST_SERVER_WORLDSIZE: '4000',
      RUST_SERVER_SEED: '12345'
    },
    features: ['uMod/Oxide Mod Plugins', 'Rust+ Mobile App API', 'RCON Console', 'Wipe Manager']
  },
  {
    id: 'terraria',
    name: 'Terraria TShock',
    gameKey: 'terraria',
    category: 'Sandbox',
    description: 'Terraria 1.4.4 TShock server with full permission groups, anti-grief controls, and web API panel.',
    icon: 'Trees',
    banner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    defaultPort: 7777,
    protocol: 'TCP',
    defaultRamGb: 2,
    minRamGb: 1,
    defaultCpuCores: 1,
    dockerImage: 'ryansheehan/terraria:latest',
    proxyTypeDefault: 'CADDY',
    recommendedSubdomainPrefix: 'terraria',
    configFiles: [
      {
        filename: 'config.json',
        description: 'TShock server rules and server password',
        defaultContent: `{
  "ServerPort": 7777,
  "ServerName": "Terraria World",
  "MaxSlots": 16,
  "WorldSize": 3,
  "Difficulty": 1,
  "EnableAntiCheat": true
}`
      }
    ],
    defaultEnvVars: {
      WORLD_NAME: 'Terraria_Adventure',
      MOTD: 'Welcome to Terraria TShock Server',
      MAX_PLAYERS: '16'
    },
    features: ['TShock Admin Commands', 'Anti-Grief Group Roles', 'Lightweight Footprint', 'Low Latency TCP']
  },
  {
    id: 'ark-survival',
    name: 'ARK: Survival Evolved',
    gameKey: 'ark',
    category: 'Survival',
    description: 'ARK dinosaur survival dedicated server with cluster routing, steam query, and custom harvest rates.',
    icon: 'Flame',
    banner: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    defaultPort: 7777,
    queryPort: 27015,
    rconPort: 32330,
    protocol: 'UDP',
    defaultRamGb: 16,
    minRamGb: 10,
    defaultCpuCores: 4,
    dockerImage: 'hermsi/ark-server:latest',
    proxyTypeDefault: 'NGINX',
    recommendedSubdomainPrefix: 'ark',
    configFiles: [
      {
        filename: 'GameUserSettings.ini',
        description: 'Taming speed, XP multipliers, and cluster ID',
        defaultContent: `[ServerSettings]
ServerPassword=DinoSecretPass
ServerAdminPassword=SuperAdminPass
TamingSpeedMultiplier=3.000000,
HarvestAmountMultiplier=2.500000,
XPMultiplier=2.000000
`
      }
    ],
    defaultEnvVars: {
      SESSION_NAME: 'ARK GameHost Proxy Island',
      SERVER_MAP: 'TheIsland',
      MAX_PLAYERS: '70'
    },
    features: ['Cluster Travel Supported', 'Cross-play Steam/Epic', 'Custom Harvest Rates', 'Automated Mod Downloader']
  },
  {
    id: 'project-zomboid',
    name: 'Project Zomboid',
    gameKey: 'zomboid',
    category: 'Survival',
    description: 'Hardcore isometric zombie survival multiplayer server with sandbox customization and Workshop mod auto-download.',
    icon: 'Skull',
    banner: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    defaultPort: 16261,
    queryPort: 16262,
    protocol: 'UDP',
    defaultRamGb: 6,
    minRamGb: 4,
    defaultCpuCores: 2,
    dockerImage: 'reid41/zomboid-server:latest',
    proxyTypeDefault: 'PLAYIT',
    recommendedSubdomainPrefix: 'zomboid',
    configFiles: [
      {
        filename: 'servertest.ini',
        description: 'Zombie population, electricity shutoff, and loot respawn rules',
        defaultContent: `PVP=true
PauseEmpty=true
GlobalChat=true
MaxPlayers=32
Public=true
PublicName=Project Zomboid Server
`
      }
    ],
    defaultEnvVars: {
      SERVER_NAME: 'Zomboid Haven',
      ADMIN_PASSWORD: 'AdminSafePassword123!',
      MEMORY: '6144m'
    },
    features: ['Steam Workshop Mods', 'Custom Sandbox Presets', 'Zombie Density Scaling', 'VoIP Support']
  }
];
