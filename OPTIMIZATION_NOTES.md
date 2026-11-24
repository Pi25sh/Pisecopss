# Performance changes (Nov 23)

- 3D models re-compressed (textures resized + WebP, dogs/cow simplified): ch42 protagonist 70 MB -> 9 MB,
  dogs 13 MB -> ~1 MB each, cow 8.6 MB -> 1.2 MB, AAA buildings 18 MB -> <1 MB. Originals are NOT in this zip.
- public/sw-cache.js: city tiles (/mumbai-data/) and models are cached after the first load. 2nd run = no re-download.
  To force a fresh download, change CACHE_VERSION in that file.
- main.js: auto-quality now starts at Medium (0.85 res) on every PC instead of High, steps down sooner (24 ms) and climbs back slower.
  Building stream radius 650 m -> 480 m.
- Tip: first launch still has to download tiles, so give it ~1 minute. Use Chrome/Edge with hardware acceleration ON.
  Pick "Low" or "Lite" in the detail dropdown if your GPU is integrated.
