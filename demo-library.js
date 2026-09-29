(() => {
  document.addEventListener("DOMContentLoaded", async () => {
    const catalog = await fetch("metadata.json", { headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Catalog could not be loaded.")))
      .catch((error) => {
        const status = document.getElementById("library-status");
        if (status) status.textContent = error.message || "Could not load the local demo catalog.";
        return null;
      });
    if (!catalog) return;

    const byId = (id) => document.getElementById(id);
    const playlistView = byId("playlist-editor-view");
    const libraryView = byId("custom-library-panel");
    const playlistButton = byId("playlist-view-btn");
    const libraryButton = byId("library-view-btn");
    const modeAudioButton = byId("library-mode-audio-btn");
    const modeVideoButton = byId("library-mode-video-btn");
    const searchInput = byId("library-search-input");
    const currentList = byId("library-current-list");
    const previewList = byId("library-preview-list");
    const tracksList = byId("library-tracks-list");
    const currentHeading = byId("library-current-heading");
    const currentTitle = byId("library-current-title");
    const previewHeading = byId("library-preview-heading");
    const previewTitle = byId("library-preview-title");
    const tracksHeading = byId("library-tracks-heading");
    const tracksTitle = byId("library-tracks-title");
    const libraryStatus = byId("library-status");
    const count = byId("selected-tracks-count");
    const target = byId("selected-tracks-target");
    const selectionPanel = byId("selected-tracks-panel");
    let mode = "audio";
    let selectedAlbum = null;
    let searchTerm = "";

    function setVisibleView(view) {
      const isLibrary = view === "library";
      playlistView.hidden = isLibrary;
      libraryView.hidden = !isLibrary;
      playlistButton.classList.toggle("is-active", !isLibrary);
      libraryButton.classList.toggle("is-active", isLibrary);
      playlistButton.setAttribute("aria-pressed", String(!isLibrary));
      libraryButton.setAttribute("aria-pressed", String(isLibrary));
      document.body.classList.toggle("is-playlist-editor-view", !isLibrary);
      document.body.classList.toggle("is-library-editor-view", isLibrary);
      if (isLibrary) render();
    }

    function matchSearch(entry) {
      if (!searchTerm) return true;
      return [entry.title, entry.artist, entry.album, entry.category]
        .some((value) => String(value || "").toLowerCase().includes(searchTerm));
    }

    function makeCard(entry, kind, onClick) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "library-song demo-library-card";
      const poster = document.createElement("img");
      poster.className = "library-metadata-artwork";
      poster.src = catalog.posters?.[entry.poster] || "assets/dd imala.jpg";
      poster.alt = "";
      poster.hidden = false;
      const text = document.createElement("span");
      text.className = "library-song-body";
      const title = document.createElement("strong");
      title.textContent = entry.title;
      const subtitle = document.createElement("span");
      subtitle.textContent = kind === "album" ? (entry.artist || "Album") : (entry.artist || `${entry.year || ""} ${kind}`.trim());
      text.append(title, subtitle);
      card.append(poster, text);
      card.addEventListener("click", onClick);
      return card;
    }

    function showEmpty(container, message) {
      container.replaceChildren();
      const note = document.createElement("p");
      note.className = "song-list-empty";
      note.textContent = message;
      container.append(note);
    }

    function queueAndPlay(items, selectedIndex, name) {
      if (!items.length || !window.PlaylistStore) return;
      const queueName = `Demo: ${name}`;
      const existing = PlaylistStore.getCustomPlaylists().find((playlist) => playlist.name === queueName);
      const playlistId = existing?.id || PlaylistStore.createCustomPlaylist(queueName);
      PlaylistStore.updateCustomPlaylist(playlistId, (playlist) => ({
        ...playlist,
        name: queueName,
        songs: items.map((entry, index) => ({
          id: `${playlistId}-${entry.id || index}`,
          name: entry.title,
          artist: entry.artist || "",
          album: entry.album || name,
          file: entry.url,
          mediaType: entry.mediaType || (kindFromUrl(entry.url) === "video" ? "video" : "audio"),
          source: "local-library",
          play: true
        }))
      }));
      PlaylistStore.savePlayerState({ playlistId, songIndex: selectedIndex, playbackState: "playing" });
      window.location.href = "index.html";
    }

    function kindFromUrl(url) {
      return /\.(mp4|m4v|webm|mov)(?:[?#]|$)/i.test(String(url || "")) ? "video" : "audio";
    }

    function showAlbum(album) {
      selectedAlbum = album;
      const tracks = (album.tracks || []).map((trackId) =>
        catalog.tracks.find((track) => track.id === trackId || track.title === trackId)
      ).filter(Boolean);
      currentTitle.textContent = album.artist || album.title;
      previewTitle.textContent = album.title;
      tracksTitle.textContent = `${tracks.length} track${tracks.length === 1 ? "" : "s"}`;
      previewList.replaceChildren(makeCard(album, "album", () => queueAndPlay(tracks, 0, album.title)));
      tracksList.replaceChildren();
      if (!tracks.length) {
        showEmpty(tracksList, "No tracks are mapped to this album.");
        return;
      }
      tracks.forEach((track, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "library-song demo-library-track";
        button.textContent = `${track.title} — ${track.artist}`;
        button.addEventListener("click", () => queueAndPlay(tracks, index, album.title));
        tracksList.append(button);
      });
    }

    function render() {
      const isAudio = mode === "audio";
      document.body.classList.toggle("is-video-mode", !isAudio);
      const entries = isAudio
        ? (catalog.albums || []).filter(matchSearch)
        : (catalog.videos || []).filter(matchSearch);
      currentHeading.textContent = isAudio ? "Albums" : "Videos";
      currentTitle.textContent = isAudio ? "Select an album" : "Two demo videos";
      previewHeading.textContent = isAudio ? "Album" : "Video";
      previewTitle.textContent = isAudio ? "Choose an album" : "Select a video";
      tracksHeading.textContent = isAudio ? "Tracks" : "Playback";
      tracksTitle.textContent = isAudio ? "Choose an album to see tracks" : "Select a video to play";
      modeAudioButton.classList.toggle("is-active", isAudio);
      modeVideoButton.classList.toggle("is-active", !isAudio);
      modeAudioButton.setAttribute("aria-pressed", String(isAudio));
      modeVideoButton.setAttribute("aria-pressed", String(!isAudio));
      currentList.replaceChildren();
      if (!entries.length) {
        showEmpty(currentList, "No matching demo items.");
      } else if (isAudio) {
        entries.forEach((album) => currentList.append(makeCard(album, "album", () => showAlbum(album))));
      } else {
        entries.forEach((video) => currentList.append(makeCard(video, "video", () => {
          previewList.replaceChildren(makeCard(video, "video", () => queueAndPlay([video], 0, video.title)));
          tracksList.replaceChildren();
          const play = document.createElement("button");
          play.type = "button";
          play.textContent = `Play ${video.title}`;
          play.addEventListener("click", () => queueAndPlay([video], 0, video.title));
          tracksList.append(play);
          previewTitle.textContent = video.title;
          tracksTitle.textContent = `${video.year || ""} · ${Math.round((video.duration || 0) / 60)} min`;
        })));
      }
      if (isAudio) {
        if (selectedAlbum && entries.some((album) => album.id === selectedAlbum.id)) showAlbum(selectedAlbum);
        else {
          selectedAlbum = null;
          showEmpty(previewList, "Choose an album to preview its cover.");
          showEmpty(tracksList, "Choose an album to see and play its tracks.");
        }
      } else {
        selectedAlbum = null;
        showEmpty(previewList, "Choose a video to preview it.");
        showEmpty(tracksList, "Choose a video to play it.");
      }
      libraryStatus.textContent = `${catalog.albums.length} albums · ${catalog.tracks.length} tracks · ${catalog.videos.length} videos. Local demo catalog.`;
      if (count) count.textContent = "Local demo catalog";
      if (target) target.textContent = "Select an album or video to play";
      if (selectionPanel) selectionPanel.hidden = true;
    }

    modeAudioButton.addEventListener("click", (event) => {
      event.preventDefault(); event.stopImmediatePropagation(); mode = "audio"; selectedAlbum = null; render();
    }, true);
    modeVideoButton.addEventListener("click", (event) => {
      event.preventDefault(); event.stopImmediatePropagation(); mode = "video"; selectedAlbum = null; render();
    }, true);
    searchInput.addEventListener("input", (event) => {
      event.stopImmediatePropagation(); searchTerm = event.target.value.trim().toLowerCase(); render();
    }, true);
    libraryButton.addEventListener("click", (event) => {
      event.preventDefault(); event.stopImmediatePropagation(); setVisibleView("library");
    }, true);

    const isPlaylistView = playlistButton.classList.contains("is-active");
    setVisibleView(isPlaylistView ? "playlists" : "library");
  });
})();
