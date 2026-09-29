# Impala Demo Edition

This folder is a standalone, no-auth UI demo copied from `impalaStreamer-family` and adapted with the KW-Player playlist. The family app and KW-Player source folders are not modified.

## Run

Serve this folder with any static file server and open `index.html`. A static server is needed so the browser can load the local `metadata.json` catalog. No Impala backend, sign-in provider, metadata service, or live-session service is required.

The player, library editor, guide, about panel, settings, and artwork are local. Audio and video playback use the Dropbox URLs in `songs-ks.js` and `metadata.json`. Replace example media URLs with files intended for public demo playback.

`metadata.json` is the local metadata-service emulation. It contains three albums, three tracks, and two videos.
