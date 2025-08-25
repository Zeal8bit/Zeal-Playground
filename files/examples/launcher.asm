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
    .text
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
    call vram_memset

    ; Map the first VRAM page (16KB) at 0x4000
    ld a, VID_MEM_PHYS_ADDR_START / VIRT_PAGE_SIZE
    out (MMU_PAGE1_IO), a

    ; Clean the layer0 and layer1, even thought thye should already be set to 0
    ld hl, VIRT_PAGE1 + VID_MEM_LAYER0_OFFSET
    ld bc, 3200
    push bc
    ld e, 0
    call vram_memset
    ld hl, VIRT_PAGE1 + VID_MEM_LAYER1_OFFSET
    pop bc
    ; E was not altered
    call vram_memset

    ; Call the example's function
    call main
    ; Wait, do nothing
1:
    halt
    jr 1b

    ; Helpers routines

    ; Clear the memory pointed by HL of size BC, with byte in E
vram_memset:
    push bc
1:
    ld a, b
    or c
    jr z, 2f
    ld (hl), e
    inc hl
    dec bc
    jp 1b
2:
    pop bc
    ret

    ; Sleep for a given amount of ms
    ;   DE - ms count to sleep for
msleep:
    ; If DE is 0, we can return directly.
    ld a, d
    or e
    ret z
    push de
    push bc
1:
    ; Divide by 1000 to get the number of T-states per milliseconds
    ; 24 is the number of T-states below
    ld bc, CONFIG_CPU_FREQ / 1000 / 24
2:
    ; 24 T-states for the following, until 'jp nz, _zos_waste_time'
    dec bc
    ld a, b
    or c
    jp nz, 2b
    ; If we are here, a milliseconds has elapsed
    dec de
    ld a, d
    or e
    jp nz, 1b
    pop bc
    pop de
    xor a
    ret
