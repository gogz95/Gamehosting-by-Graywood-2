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
  },
  {
    id: 'cs2',
    name: 'Counter-Strike 2 (CS2)',
    gameKey: 'cs2',
    category: 'FPS',
    description: 'Premier competitive 5v5 / deathmatch dedicated server running on native Source 2 Linux engine with RCON support.',
    icon: 'Crosshair',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    defaultPort: 27015,
    queryPort: 27015,
    rconPort: 27015,
    protocol: 'UDP',
    defaultRamGb: 6,
    minRamGb: 4,
    defaultCpuCores: 2,
    dockerImage: 'cm2network/cs2:latest',
    proxyTypeDefault: 'NGINX',
    recommendedSubdomainPrefix: 'cs2',
    configFiles: [
      {
        filename: 'server.cfg',
        description: 'CS2 competitive server settings, tickrate, and rcon password',
        defaultContent: `hostname "Nexus CS2 Dedicated Match Server"
rcon_password "SuperAdminPass2026!"
sv_cheats 0
sv_lan 0
sv_maxrate 0
sv_minrate 786432
mp_roundtime 1.92
mp_maxrounds 24
mp_autoteambalance 1
`
      }
    ],
    defaultEnvVars: {
      SERVER_HOSTNAME: 'Nexus CS2 Dedicated Server',
      SERVER_PASSWORD: '',
      RCON_PASSWORD: 'SuperAdminPass2026!',
      GAME_TYPE: '0',
      GAME_MODE: '1',
      MAP: 'de_dust2',
      MAXPLAYERS: '12'
    },
    features: ['Source 2 Sub-Tick Engine', '128-Tick Simulation', 'RCON Live Console', 'Workshop Map Rotation']
  },
  {
    id: 'enshrouded',
    name: 'Enshrouded Dedicated',
    gameKey: 'enshrouded',
    category: 'Survival',
    description: 'Voxel action RPG survival multiplayer server supporting up to 16 players in a sprawling, fog-shrouded realm.',
    icon: 'Flame',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    defaultPort: 15636,
    queryPort: 15637,
    protocol: 'UDP',
    defaultRamGb: 8,
    minRamGb: 6,
    defaultCpuCores: 4,
    dockerImage: 'skaronator/enshrouded-server:latest',
    proxyTypeDefault: 'NGINX',
    recommendedSubdomainPrefix: 'shroud',
    configFiles: [
      {
        filename: 'enshrouded_server.json',
        description: 'Enshrouded world configuration and save game settings',
        defaultContent: `{
  "name": "Enshrouded Sanctuary",
  "password": "FlameSecretPassword",
  "saveDirectory": "./savegame",
  "logDirectory": "./logs",
  "ip": "0.0.0.0",
  "gamePort": 15636,
  "queryPort": 15637,
  "slotCount": 16
}`
      }
    ],
    defaultEnvVars: {
      SERVER_NAME: 'Enshrouded Realm',
      SERVER_PASSWORD: 'FlameSecretPassword',
      GAME_PORT: '15636',
      QUERY_PORT: '15637',
      SLOT_COUNT: '16'
    },
    features: ['16-Player Co-Op', 'Voxel Terraforming', 'Cloud Save State Sync', 'High Tickrate Network']
  },
  {
    id: 'factorio',
    name: 'Factorio Dedicated',
    gameKey: 'factorio',
    category: 'Simulation',
    description: 'High-performance factory automation multiplayer server running native headless Linux binary with auto-save sync.',
    icon: 'Cpu',
    banner: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    defaultPort: 34197,
    rconPort: 27015,
    protocol: 'UDP',
    defaultRamGb: 4,
    minRamGb: 2,
    defaultCpuCores: 2,
    dockerImage: 'factoriotools/factorio:stable',
    proxyTypeDefault: 'NGINX',
    recommendedSubdomainPrefix: 'factory',
    configFiles: [
      {
        filename: 'server-settings.json',
        description: 'Factorio game settings, password, autosave interval and visibility',
        defaultContent: `{
  "name": "Nexus High-Throughput Factory",
  "description": "Multiplayer automation megabase running on NVMe Gen4 storage.",
  "tags": ["automation", "megabase", "high-tps"],
  "max_players": 32,
  "game_password": "",
  "autosave_interval": 10,
  "autosave_slots": 5,
  "auto_pause": true
}`
      }
    ],
    defaultEnvVars: {
      UPDATE_MODS_ON_START: 'true',
      FACTORIO_PORT: '34197',
      FACTORIO_RCON_PORT: '27015'
    },
    features: ['60 UPS Stable Engine', 'Auto-Pause When Empty', 'Mod Portal Auto-Sync', 'RCON Administration']
  },
  {
    id: 'minecraft-bedrock',
    name: 'Minecraft Bedrock Edition',
    gameKey: 'bedrock',
    category: 'Sandbox',
    description: 'Official Mojang Bedrock server supporting cross-play across Android, iOS, Windows 10/11, Xbox, Nintendo Switch, and PS5.',
    icon: 'Pickaxe',
    banner: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=800&q=80',
    defaultPort: 19132,
    protocol: 'UDP',
    defaultRamGb: 2,
    minRamGb: 1,
    defaultCpuCores: 2,
    dockerImage: 'itzg/minecraft-bedrock-server:latest',
    proxyTypeDefault: 'PLAYIT',
    recommendedSubdomainPrefix: 'bedrock',
    configFiles: [
      {
        filename: 'server.properties',
        description: 'Bedrock server configuration settings',
        defaultContent: `server-name=Nexus Bedrock Sanctuary
gamemode=survival
difficulty=normal
allow-cheats=false
max-players=20
server-port=19132
server-portv6=19133
online-mode=true
view-distance=16
tick-distance=4
player-idle-timeout=30
max-threads=8
`
      }
    ],
    defaultEnvVars: {
      EULA: 'TRUE',
      SERVER_NAME: 'Nexus Bedrock Realm',
      GAMEMODE: 'survival',
      DIFFICULTY: 'normal',
      MAX_PLAYERS: '20'
    },
    features: ['Full Console & Mobile Crossplay', 'Zero-Config Setup', 'Low Memory Footprint', 'Official BDS Engine']
  },
  {
    id: '7dtd',
    name: '7 Days to Die',
    gameKey: '7dtd',
    category: 'Survival',
    description: 'Voxel zombie horde survival crafting dedicated server with Blood Moon waves and full Darkness Falls mod support.',
    icon: 'Skull',
    banner: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    defaultPort: 26900,
    queryPort: 26902,
    protocol: 'BOTH',
    defaultRamGb: 8,
    minRamGb: 6,
    defaultCpuCores: 4,
    dockerImage: 'vinanrra/7dtd-server:latest',
    proxyTypeDefault: 'NGINX',
    recommendedSubdomainPrefix: '7dtd',
    configFiles: [
      {
        filename: 'serverconfig.xml',
        description: '7 Days to Die XML configuration file',
        defaultContent: `<ServerSettings>
  <property name="ServerName" value="Nexus 7DTD Apocalypse"/>
  <property name="ServerDescription" value="7 Days to Die survival server"/>
  <property name="ServerPort" value="26900"/>
  <property name="ServerVisibility" value="2"/>
  <property name="ServerMaxPlayerCount" value="16"/>
  <property name="GameWorld" value="Navezgane"/>
  <property name="GameDifficulty" value="2"/>
  <property name="BloodMoonFrequency" value="7"/>
  <property name="BloodMoonRange" value="0"/>
</ServerSettings>`
      }
    ],
    defaultEnvVars: {
      START_MODE: '1',
      VERSION: 'stable'
    },
    features: ['Blood Moon Horde Physics', 'Modpack Ready', 'Telnet & Web Dashboard', 'Random World Gen']
  },
  {
    id: 'vrising',
    name: 'V Rising Dedicated',
    gameKey: 'vrising',
    category: 'Survival',
    description: 'Gothic vampire action survival multiplayer server with customizable blood essence decay, clan bounds, and siege times.',
    icon: 'Moon',
    banner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    defaultPort: 9876,
    queryPort: 9877,
    protocol: 'UDP',
    defaultRamGb: 6,
    minRamGb: 4,
    defaultCpuCores: 2,
    dockerImage: 'trueosiris/vrising:latest',
    proxyTypeDefault: 'NGINX',
    recommendedSubdomainPrefix: 'vrising',
    configFiles: [
      {
        filename: 'ServerHostSettings.json',
        description: 'V Rising server network and clan settings',
        defaultContent: `{
  "Name": "Nexus V Rising Vampire Realm",
  "Description": "High speed vampire PvP/PvE multiplayer world",
  "Port": 9876,
  "QueryPort": 9877,
  "MaxConnectedUsers": 20,
  "MaxConnectedAdmins": 4,
  "SaveName": "VampireWorld",
  "Password": ""
}`
      }
    ],
    defaultEnvVars: {
      SERVER_NAME: 'V Rising Realm',
      WORLD_NAME: 'VampireWorld'
    },
    features: ['Castle Siege Windows', 'Custom Blood Rates', 'PVP & PVE Modes', 'Low Latency UDP Routing']
  },
  {
    id: 'sotf',
    name: 'Sons of the Forest',
    gameKey: 'forest',
    category: 'Survival',
    description: 'Cannibal survival horror multiplayer server powered by headless Wine/Proton virtualization with Steam auto-updates.',
    icon: 'Trees',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    defaultPort: 8766,
    queryPort: 27016,
    protocol: 'UDP',
    defaultRamGb: 8,
    minRamGb: 6,
    defaultCpuCores: 4,
    dockerImage: 'jammsen/sons-of-the-forest-dedicated-server:latest',
    proxyTypeDefault: 'PLAYIT',
    recommendedSubdomainPrefix: 'forest',
    configFiles: [
      {
        filename: 'ownersconfig.json',
        description: 'Server administrators SteamID64 configuration',
        defaultContent: `{
  "Owners": [
    "76561198000000000"
  ]
}`
      }
    ],
    defaultEnvVars: {
      SERVER_NAME: 'Sons of the Forest Island',
      STEAM_QUERY_PORT: '27016',
      GAME_PORT: '8766'
    },
    features: ['8-Player Co-Op', 'Proton Virtualized Engine', 'Automated SteamCMD Updates', 'Cave & AI Sync']
  },
  {
    id: 'gmod',
    name: "Garry's Mod (GMod)",
    gameKey: 'gmod',
    category: 'Sandbox',
    description: 'Iconic Valve Source sandbox server for Trouble in Terrorist Town (TTT), Prop Hunt, DarkRP, and custom workshop collections.',
    icon: 'Layers',
    banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    defaultPort: 27015,
    queryPort: 27015,
    rconPort: 27015,
    protocol: 'UDP',
    defaultRamGb: 4,
    minRamGb: 2,
    defaultCpuCores: 2,
    dockerImage: 'cm2network/gmod:latest',
    proxyTypeDefault: 'NGINX',
    recommendedSubdomainPrefix: 'gmod',
    configFiles: [
      {
        filename: 'server.cfg',
        description: 'Garrys Mod server rules and gamemode configuration',
        defaultContent: `hostname "Nexus GMod Sandbox Hub"
rcon_password "GmodSuperSecret2026!"
sv_password ""
sv_lan 0
sbox_maxprops 150
sbox_maxragdolls 10
sbox_maxthrusters 20
sbox_godmode 0
`
      }
    ],
    defaultEnvVars: {
      SERVER_HOSTNAME: 'Nexus Garrys Mod Server',
      GAMEMODE: 'sandbox',
      MAP: 'gm_flatgrass',
      MAXPLAYERS: '24'
    },
    features: ['Steam Workshop Collections', 'TTT & Prop Hunt Ready', 'Lua Script Sandbox', 'RCON Remote Control']
  }
];
