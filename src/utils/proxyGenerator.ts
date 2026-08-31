import { ProxyEngine, ProtocolType } from '../types';

export interface ProxyConfigResult {
  engine: ProxyEngine;
  filename: string;
  configText: string;
  setupCommands: string[];
  notes: string;
}

export function generateProxyConfig(
  subdomain: string,
  baseDomain: string,
  targetIp: string,
  targetPort: number,
  protocol: ProtocolType,
  engine: ProxyEngine,
  gameKey: string
): ProxyConfigResult {
  const fullDomain = `${subdomain}.${baseDomain}`;

  if (engine === 'VELOCITY') {
    return {
      engine: 'VELOCITY',
      filename: 'velocity.toml',
      configText: `# Velocity High-Performance Minecraft Reverse Proxy Config
# Add this route to your velocity.toml file:

bind = "0.0.0.0:25565"
motd = "§aRouted via Velocity Proxy §7[${fullDomain}]"
show-max-players = 100
player-info-forwarding-mode = "modern"
forwarding-secret-file = "forwarding.secret"

[servers]
  ${subdomain} = "${targetIp}:${targetPort}"

[forced-hosts]
  "${fullDomain}" = ["${subdomain}"]
`,
      setupCommands: [
        'docker run -d --name velocity-proxy -p 25565:25565 -v ./velocity.toml:/opt/velocity/velocity.toml itzg/bungeecord',
        `echo "CNAME DNS Record: ${fullDomain} -> ${targetIp}"`
      ],
      notes: 'Velocity forwards player IP addresses safely and routes multiple subdomains (e.g. mc.domain.com, survival.domain.com) to different internal container ports over port 25565.'
    };
  }

  if (engine === 'CADDY') {
    return {
      engine: 'CADDY',
      filename: 'Caddyfile',
      configText: `# Caddyfile reverse proxy for ${fullDomain}
# Caddy automatically provisions Let's Encrypt SSL/TLS certificates

${fullDomain} {
  reverse_proxy ${targetIp}:${targetPort}
  
  tls admin@${baseDomain}
  
  header {
    Strict-Transport-Security "max-age=31536000;"
    X-Content-Type-Options "nosniff"
  }
}
`,
      setupCommands: [
        'sudo apt install caddy',
        'sudo caddy reload --config /etc/caddy/Caddyfile',
        `echo "Point A-Record: ${fullDomain} -> ${targetIp}"`
      ],
      notes: 'Caddy manages SSL certificates automatically. For pure TCP/UDP game protocols, ensure layer4 module or port mapping is configured.'
    };
  }

  if (engine === 'TRAEFIK') {
    return {
      engine: 'TRAEFIK',
      filename: 'traefik_dynamic.yml',
      configText: `# Traefik v3 Dynamic Configuration for ${fullDomain}
tcp:
  routers:
    ${subdomain}-game-router:
      entryPoints:
        - "game-${targetPort}"
      rule: "HostSNI(\`${fullDomain}\`)"
      service: "${subdomain}-service"
      tls:
        passthrough: true

  services:
    ${subdomain}-service:
      loadBalancer:
        servers:
          - address: "${targetIp}:${targetPort}"
`,
      setupCommands: [
        'docker compose up -d traefik',
        `echo "Add Traefik Entrypoint: --entrypoints.game-${targetPort}.address=:${targetPort}"`
      ],
      notes: 'Traefik routes TCP traffic using HostSNI or dedicated entrypoint ports.'
    };
  }

  if (engine === 'CLOUDFLARE_TUNNEL') {
    return {
      engine: 'CLOUDFLARE_TUNNEL',
      filename: 'cloudflared-config.yml',
      configText: `# Cloudflare Tunnel Config for ${fullDomain}
tunnel: your-tunnel-uuid-here
credentials-file: /etc/cloudflared/your-tunnel-uuid.json

ingress:
  - hostname: ${fullDomain}
    service: tcp://${targetIp}:${targetPort}
  - service: http_status:404
`,
      setupCommands: [
        'cloudflared tunnel create game-server-tunnel',
        `cloudflared tunnel route dns game-server-tunnel ${fullDomain}`,
        'cloudflared tunnel run game-server-tunnel'
      ],
      notes: 'Cloudflare Tunnels allow hosting game servers behind NAT or CGNAT without opening public router firewall ports.'
    };
  }

  if (engine === 'PLAYIT') {
    return {
      engine: 'PLAYIT',
      filename: 'playit.toml',
      configText: `# Playit.gg Custom Subdomain & Tunnel Configuration
[tunnels.${subdomain}]
proto = "${protocol.toLowerCase()}"
local_ip = "${targetIp}"
local_port = ${targetPort}
custom_domain = "${fullDomain}"
`,
      setupCommands: [
        'curl -SsL https://playit.gg/downloads/playit-linux-amd64 -o playit',
        'chmod +x playit && ./playit'
      ],
      notes: 'Playit.gg is ideal for home servers and CGNAT setups where public static IPs are unavailable.'
    };
  }

  // Default: NGINX
  return {
    engine: 'NGINX',
    filename: 'nginx-stream.conf',
    configText: `# NGINX Reverse Proxy Stream / HTTP Config for ${fullDomain}
# Place stream block in /etc/nginx/nginx.conf or /etc/nginx/conf.d/stream.conf

stream {
    upstream ${subdomain}_backend {
        server ${targetIp}:${targetPort};
    }

    server {
        listen ${targetPort} ${protocol === 'UDP' ? 'udp' : ''};
        proxy_pass ${subdomain}_backend;
        proxy_timeout 10m;
        proxy_connect_timeout 5s;
    }
}

# Optional HTTP / Web Console Proxy with SSL
server {
    listen 80;
    server_name ${fullDomain};

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${fullDomain};

    ssl_certificate /etc/letsencrypt/live/${fullDomain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${fullDomain}/privkey.pem;

    location / {
        proxy_pass http://${targetIp}:${targetPort};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`,
    setupCommands: [
      `sudo certbot certonly --standalone -d ${fullDomain}`,
      'sudo nginx -t && sudo systemctl reload nginx',
      `echo "DNS Check: Verify ${fullDomain} -> ${targetIp}"`
    ],
    notes: 'NGINX stream block proxies raw TCP/UDP packets. HTTP block handles web administration portals or RCON WebSocket dashboards.'
  };
}
