#!/usr/bin/env python3
"""
Binary to Assembly Converter
Converts a binary file to an assembly file with .db directives
"""

import os
import argparse

def binary_to_asm(input_file, output_file=None, bytes_per_line=16, prefix='$'):
    """
    Convert a binary file to assembly .db directives

    Args:
        input_file (str): Path to input binary file
        output_file (str): Path to output assembly file (optional)
        bytes_per_line (int): Number of bytes per .db line (default: 16)
    """

    # Generate output filename if not provided
    if output_file is None:
        base_name = os.path.splitext(input_file)[0]
        output_file = f"{base_name}.asm"

    try:
        # Read binary file
        with open(input_file, 'rb') as f:
            data = f.read()

        if not data:
            print(f"Warning: Input file '{input_file}' is empty")
            return

        # Write assembly file
        with open(output_file, 'w') as f:
            # Write header comment
            f.write(f"; Generated from: {os.path.basename(input_file)}\n")
            f.write(f"; Total bytes: {len(data)}\n")
            f.write(f"; Bytes per line: {bytes_per_line}\n\n")

            # Process data in chunks
            for i in range(0, len(data), bytes_per_line):
                chunk = data[i:i + bytes_per_line]

                # Format bytes as hex values
                byte_strings = [f"{prefix}{byte:02X}" for byte in chunk]

                # Write .db directive
                f.write(f".db {', '.join(byte_strings)}\n")

        print(f"Successfully converted '{input_file}' to '{output_file}'")
        print(f"Total bytes processed: {len(data)}")

    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found")
    except Exception as e:
        print(f"Error processing file: {e}")

def main():
    parser = argparse.ArgumentParser(description='Convert binary file to assembly .db directives')
    parser.add_argument('input_file', help='Input binary file')
    parser.add_argument('-o', '--output', help='Output assembly file (optional)')
    parser.add_argument('-p', '--prefix', type=str, default='0x', help='Prefix to output before each byte (optional)')
    parser.add_argument('-b', '--bytes', type=int, default=16,
                       help='Number of bytes per line (default: 16)')

    args = parser.parse_args()

    binary_to_asm(args.input_file, args.output, args.bytes, args.prefix)

if __name__ == "__main__":
    main()
