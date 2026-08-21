# Kubernetes deployments: client IP and scheme

Magic's backend resolves the original client IP and public scheme with ASP.NET
Core's forwarded-headers middleware (`UseMagicForwardedHeaders` in
`plugins/magic.library/Initializer.cs`). It is **enabled by default with zero
configuration** and consumes `X-Forwarded-For` and `X-Forwarded-Proto`, making
`request.ip` and `request.scheme` (and everything reading them) reflect the
original client instead of the last proxy.

This note covers getting the **true end-user IP** in a Kubernetes cluster
fronted by Cloudflare: `client → Cloudflare → ingress → backend pod`.

## How the trust model works

`magic:forwarded-headers:forward-limit` (default **1**) controls how many
entries from the *right* of `X-Forwarded-For` the middleware reads. The
right-most entry was appended by the proxy that physically accepted the TCP
connection, from a peer it actually saw — so a client cannot spoof it by
prepending fake entries. Each step further left is one more proxy's word,
which is only safe when that proxy **cannot be bypassed**.

| Topology | Appending hops | Required setting |
|---|---|---|
| No proxy (backend exposed directly) | 0 | `magic:forwarded-headers:enabled: false` — headers are then spoofable and must be ignored |
| One reverse proxy (Caddy, ingress) | 1 | nothing — default limit 1 is correct |
| Cloudflare → ingress | 2 | `forward-limit: 2` + origin locked to Cloudflare |
| Cloudflare → L7 LB → ingress | 3 | `forward-limit: 3` + origin locked to Cloudflare |

L4 load balancers pass headers through untouched — they add a network hop but
not an `X-Forwarded-For` entry, so they do not raise the limit.

## Recipe: Cloudflare → ingress-nginx → Magic

### 1. Backend Deployment

The middleware is already on; only the hop count needs telling. .NET maps the
config key onto this environment variable (`__` = `:`):

```yaml
env:
  - name: magic__forwarded-headers__forward-limit
    value: "2"
```

### 2. Cloudflare

- Proxy the DNS records (orange cloud), so all traffic transits Cloudflare.
- SSL/TLS mode **Full** or **Full (strict)** — with *Flexible*, Cloudflare
  talks plain HTTP to the origin, and the scheme forwarded to the backend
  degrades to `http`.

### 3. Make the chain mandatory

`forward-limit: 2` trusts the entry Cloudflare appended. That is safe only if
nothing can reach the ingress while bypassing Cloudflare. Restrict the ingress
service to Cloudflare's published IP ranges
([cloudflare.com/ips](https://www.cloudflare.com/ips/)), e.g. on the
ingress-nginx controller Service:

```yaml
spec:
  type: LoadBalancer
  loadBalancerSourceRanges:
    - 173.245.48.0/20
    - 103.21.244.0/22
    # ... all ranges from https://www.cloudflare.com/ips/ (IPv4 and IPv6)
```

(or enforce the same allow-list in your cloud's firewall / security groups).

### 4. ingress-nginx

Append behavior is the default (`$proxy_add_x_forwarded_for`), so the ingress
already writes the Cloudflare edge as the right-most entry and keeps the
client entry Cloudflare appended one to the left. To also preserve
Cloudflare's `X-Forwarded-Proto` (needed for `request.scheme: https`):

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ingress-nginx-controller
data:
  use-forwarded-headers: "true"
```

## Verifying

In the dashboard's Evaluator playground, execute:

```hyperlambda
request.ip
request.scheme
```

`request.ip` should be your own public IP (compare with any "what is my IP"
service), and `request.scheme` should be `https`. If you see a Cloudflare edge
IP, the limit is too low; if you see the ingress/LB IP, a proxy in the chain
is stripping headers.

## What this does NOT change

- **Throttling** already prefers Cloudflare's authoritative `CF-Connecting-IP`
  header (`system/magic.startup/throttles.hl`), which is correct at any chain
  depth as long as traffic transits Cloudflare — no configuration needed.
- **The frontend image** (`docker.frontend`, nginx statics only) is not a hop
  in the API path and needs no changes.

## Alternative: keep limit 1 by resolving the IP at the ingress

Instead of trusting two hops in the backend, the ingress itself can determine
the client IP — nginx's real-IP module configured with `set_real_ip_from`
Cloudflare's ranges and `real_ip_header CF-Connecting-IP`, via a customized
ingress-nginx template. The ingress then writes the human's IP as the
right-most entry, and the backend keeps the default `forward-limit: 1` no
matter how many hops are added later. More moving parts at the edge; the same
guarantee.

## Honest boundary

"End user" means the client's **public** IP. Users behind VPNs, Tor or
corporate NAT resolve to the exit node — that is the physically true peer, not
a configuration flaw, and no header machinery can see past it.
