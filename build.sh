#!/bin/bash
set -e  # Exit on error

# Clean and recreate dist directory
rm -rf dist
mkdir -p dist

# List of files and directories to copy
FILES_TO_COPY=(
  "css"
  "files/examples"
  "files/headers"
  "imgs"
  "js"
  "native"
  "index.html"
)

for raw in "${FILES_TO_COPY[@]}"; do
  item="${raw%/}"                 # strip trailing slash if present
  if [[ -e "$item" ]]; then
    # Determine destination dir inside dist, preserving parent path
    parent="$(dirname "$item")"
    dest="dist"
    [[ "$parent" != "." ]] && dest="dist/$parent"

    mkdir -p "$dest"
    cp -R "$item" "$dest/"
  else
    echo "Warning: $item does not exist" >&2
  fi
done

tools/build_manifest.py dist/files dist/files/manifest.json

echo "✅ Build complete. Files copied to dist/"
