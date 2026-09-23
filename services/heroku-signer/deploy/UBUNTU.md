# Deploy the family signer on the Ubuntu gateway

This deploys the existing Node.js signer as a systemd service behind Nginx. The suggested API hostname is `signer.impala-fam.discrete-dev.com`; point its DNS record at the gateway before enabling HTTPS. Keep the current Heroku endpoint in service until the new endpoint passes the cutover checks.

## 1. Install the service files

Install a system-wide Node.js LTS release (Node 24 is supported by this project) so both `node` and `npm` are available under `/usr/bin`, then install Nginx and Certbot. NVM can remain installed for your login account; the signer service will use the system Node runtime. Create a dedicated service account and directories:

```sh
sudo useradd --system --home /opt/impala-fam --shell /usr/sbin/nologin impala-signer
sudo install -d -o impala-signer -g impala-signer /opt/impala-fam/signer
sudo install -d -o impala-signer -g impala-signer /var/lib/impala-fam-signer
```

Install system-wide Node.js 24 from NodeSource on Ubuntu:

```sh
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_24.x -o /tmp/nodesource_setup.sh
sudo -E bash /tmp/nodesource_setup.sh
sudo apt install -y nodejs
node --version
npm --version
```

Copy the contents of `services/heroku-signer` to `/opt/impala-fam/signer`, including its `package-lock.json` and `scripts` directory. Make sure the service account owns the project files, then prepare its npm cache and install production dependencies with system npm:

```sh
sudo chown -R impala-signer:impala-signer /opt/impala-fam/signer
sudo install -d -o impala-signer -g impala-signer -m 0750 /var/cache/impala-fam-npm
sudo -u impala-signer /usr/bin/npm ci --omit=dev --prefix /opt/impala-fam/signer --cache /var/cache/impala-fam-npm
```

The systemd unit runs `/usr/bin/node`. It does not need access to the login user's NVM directory; systemd's `ProtectHome=true` blocks that access, and `ProtectSystem=strict` keeps the service filesystem read-only apart from its explicitly allowed paths.

Copy `deploy/impala-fam-signer.service` to `/etc/systemd/system/impala-fam-signer.service`.

## 2. Configure secrets

Create `/etc/impala-fam-signer.env` outside the repository, readable only by root and the signer account. Transfer the current values from the Heroku config for the **Vinnie/impalaStreamer-family** signer. Required values are `SESSION_SECRET`, `S4_BUCKET`, `S4_ACCESS_KEY_ID`, `S4_SECRET_ACCESS_KEY`, and `ALLOWED_USERS_JSON`. Preserve the existing session secret and user password hashes so users can continue signing in.

Set at least:

```dotenv
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://impala-fam.discrete-dev.com
```

Also carry over any configured `S4_VIDEO_BUCKET`, `S4_ENDPOINT`, `S4_REGION`, `S4_BUCKET_RULES_JSON`, `S4_VIDEO_PRIVATE_PREFIXES`, index settings, token TTL, signed URL TTL, and feedback/diagnostics email settings. `MONGODB_URI` is needed to preserve the existing activity tracking feature. `MONGODB_DATABASE` defaults to `impala_family`.

Do not put real secrets in this repository or source the env file from a shell command that prints its contents. Restrict the file:

```sh
sudo chown root:impala-signer /etc/impala-fam-signer.env
sudo chmod 0640 /etc/impala-fam-signer.env
```

Start the service and check its status and logs:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now impala-fam-signer
sudo systemctl status impala-fam-signer
sudo journalctl -u impala-fam-signer -n 100 --no-pager
```

The local health check should return healthy:

```sh
curl --fail http://127.0.0.1:3000/healthz
```

## 3. Add HTTPS at the gateway

Add a DNS A record for `signer.impala-fam.discrete-dev.com` pointing to the gateway's reachable public address. If IPv6 is enabled, add the matching AAAA record. Install `deploy/nginx-signer.conf` in Nginx's site configuration, then validate and reload Nginx:

```sh
sudo nginx -t
sudo systemctl reload nginx
```

After DNS resolves to the gateway and inbound ports 80 and 443 reach Nginx, issue the certificate:

```sh
sudo certbot --nginx -d signer.impala-fam.discrete-dev.com
```

Then verify `https://signer.impala-fam.discrete-dev.com/healthz`.

## 4. Cut over the app

Update `apiBaseUrl` in the family app's `app-config.js` to `https://signer.impala-fam.discrete-dev.com`. Deploy the static site, then verify sign-in, library listing, media URL signing/playback, feedback, and the admin activity page. Rebuild both library indexes from the admin playlist page after cutover if needed.

Keep the old Heroku signer available during verification. Retire it only after the new service has been stable and the site's deployed config is using the new hostname.

## Operations

```sh
sudo journalctl -u impala-fam-signer -f
sudo systemctl restart impala-fam-signer
```

The index cache and rebuild progress live in process memory. Run one signer instance only; after a restart the cache reloads from the S4 index objects and rebuild progress resets. The media itself remains in MEGA S4, so the gateway does not need a media volume mount.
