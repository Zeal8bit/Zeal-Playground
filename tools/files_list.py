#!/usr/bin/env python3
import os
import sys

def generate_file_list(root_dir):
    files = []
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            rel_path = os.path.relpath(os.path.join(dirpath, filename), root_dir)
            files.append(rel_path.replace("\\", "/"))  # use forward slashes
    files.sort()
    return files

def build_js_array(files):
    entries = [f"    '{f}'" for f in files]
    return "const BUILTIN_FILES = [\n" + ",\n".join(entries) + "\n  ];\n"

def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <directory> [file_to_modify]")
        sys.exit(1)

    root_dir = sys.argv[1]
    target_file = sys.argv[2] if len(sys.argv) > 2 else None

    files = generate_file_list(root_dir)
    js_array = build_js_array(files)

    if target_file:
        with open(target_file, "r", encoding="utf-8") as f:
            content = f.read()

        if "const BUILTIN_FILES = [];" not in content:
            print(f"Warning: pattern 'const BUILTIN_FILES = [];' not found in '{target_file}'", file=sys.stderr)
        else:
            content = content.replace("const BUILTIN_FILES = [];", js_array)
            with open(target_file, "w", encoding="utf-8") as f:
                f.write(content)
    else:
        sys.stdout.write(js_array)

if __name__ == "__main__":
    main()
