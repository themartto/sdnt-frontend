# sdnt-frontend


sdnt-frontend — a web app to look up DNS records, WHOIS data, and SSL certificate info for any domain.


Check the live version at: [sdnt.info](https://sdnt.info)


Built with React 19, TypeScript, Tailwind CSS v4, and shadcn/ui.

## Features

- **DNS Records** — query A, AAAA, MX, NS, TXT, CNAME, SOA, PTR, SRV, CAA records across multiple geographic locations
- **WHOIS Lookup** — retrieve domain registration details
- **SSL Checker** — inspect TLS certificate info
- **Visitor IP** — displays your public IP address
- **Dark/light mode** toggle

## Getting started

**Prerequisites:** Node.js, pnpm

```bash
pnpm install
```

Set the API base URL (defaults to `https://api.sdnt.info`):

```bash
cp .env.example .env
# edit VITE_API_URL if you are running the backend on your own
```

```bash
pnpm dev       # development server
pnpm build     # production build
pnpm typecheck # type check without emitting
pnpm lint      # lint
```

## Docker

```bash
docker build \
  --build-arg VITE_API_URL=https://api.sdnt.info \
  -t sdnt-frontend .

docker run -p 80:80 sdnt-frontend
```

The image builds with Vite and serves via nginx on port 80.

## Backend

The API is a separate Rust service. See [`sdnt-backend`](../sdnt-backend/README.md) or the live API at [api.sdnt.info](https://api.sdnt.info).
