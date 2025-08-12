#!/usr/bin/env python3
import os
import sys
import json

def generate_file_list(root_dir):
    files = []
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename == "manifest.json": continue
            rel_path = os.path.relpath(os.path.join(dirpath, filename), root_dir)
            files.append(rel_path.replace("\\", "/"))  # use forward slashes
    files.sort()
    return files

def build_manifest(files):
    manifest = {
        "files": [f"{f}" for f in files]
    }
    output = json.dumps(manifest, indent=2)
    return output

def main():
    if len(sys.argv) < 1:
        print(f"Usage: {sys.argv[0]} <directory> [file_to_modify]")
        sys.exit(1)

    root_dir = sys.argv[1]
    target_file = sys.argv[2] if len(sys.argv) > 2 else 'files/manifest.json'

    files = generate_file_list(root_dir)
    contents = build_manifest(files)

    with open(target_file, "w", encoding="utf-8") as f:
        f.write(contents)
        print("Generated", target_file)

if __name__ == "__main__":
    main()
