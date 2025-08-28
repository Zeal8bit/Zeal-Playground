    ; --------- Zeal 8-bit Computer Launcher example ---------
    ;
    ; The goal of this file is to initialize the Zeal 8-bit Computer MMU,
    ; or memory mapper, to have access to the current ROM, the VRAM and
    ; the RAM. It then executes the `main` routine that shall be defined
    ; in the files including this file.
    ; In other words, this file is a tiny bootloader that sets up the
    ; bare minimum in order to execute a bare-metal example.
    ;
    ; This file is meant to be used in single-file examples. To use it,
    ; add the following at the top of your program:
    ;
    ;   .include "launcher.asm"
    ;
    ; And then define the `main` routine anywhere else:
    ;
    ;   main:
    ;       ; your code here
    ;       ret
    ;
    ; When `main` is called, the Z80 memory will be organized as follows:
    ;   0x0000-0x3fff: ROM code (current code)
    ;   0x4000-0x7fff: First 16KB of the VRAM (layers, palette, sprites, etc.)
    ;   0x8000-0xffff: First 32KB of the RAM
    ;
    ; The stack pointer will be set to 0xffff, so `main` doesn't need to set it.

    .include "zvb_hardware_h.asm"
    .include "zeal_computer_h.asm"

    ; Put everything in the text section
    .section .text
    .globl _start
_start:
    ; Map two 16KB RAM pages, starting at 0x8000 (PAGE2)
    ld a, RAM_PHYS_PAGE0
    out (MMU_PAGE2_IO), a
    inc a
    out (MMU_PAGE3_IO), a

    ; Set the stack pointer to the RAM
    ld sp, 0xffff

    ; Switch to text mode 640 by default
    ld a, VID_MODE_TEXT_640
    out (VIDEO_CONF_VIDEO_MODE), a

    ; Map the first 16KB of the tileset, to clear the first tile (make it transparent)
    ld a, VID_MEM_TILESET_ADDR / VIRT_PAGE_SIZE
    out (MMU_PAGE1_IO), a
    ld e, 0
    ld hl, VIRT_PAGE1
    ld bc, 256
    call memset

    ; Map the first VRAM page (16KB) at 0x4000
    ld a, VID_MEM_PHYS_ADDR_START / VIRT_PAGE_SIZE
    out (MMU_PAGE1_IO), a

    ; Clean the layer0 and layer1, even thought thye should already be set to 0
    ld hl, VIRT_PAGE1 + VID_MEM_LAYER0_OFFSET
    ld bc, 3200
    push bc
    ld e, 0
    call memset
    ld hl, VIRT_PAGE1 + VID_MEM_LAYER1_OFFSET
    pop bc
    ; E was not altered
    call memset

    ; Call the example's function
    call main
    ; Wait, do nothing
1:
    halt
    jr 1b
