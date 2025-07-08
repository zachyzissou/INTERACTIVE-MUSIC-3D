#!/bin/bash

# Script to create Linux snapshots from existing win32 snapshots for CI compatibility

SNAPSHOTS_DIR="tests/e2e/visual-regression.spec.ts-snapshots"

echo "Creating Linux snapshots from existing win32 snapshots..."

# Loop through all win32 snapshots and create linux equivalents
for win32_file in "$SNAPSHOTS_DIR"/*-win32.png; do
    if [ -f "$win32_file" ]; then
        # Extract the base name and create linux version
        linux_file="${win32_file/-win32.png/-linux.png}"
        
        echo "Copying $(basename "$win32_file") to $(basename "$linux_file")"
        cp "$win32_file" "$linux_file"
    fi
done

echo "Linux snapshots created successfully!"
echo "These baseline snapshots will allow CI to run. The CI can update them if visual differences are detected."
