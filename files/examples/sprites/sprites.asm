    ; Example showing how to use the tileset to create tiles and
    ; dispose them on screen.

    .include "examples/launcher.asm"
    .include "zvb_lib_h.asm"

    ; location of sprite data in RAM
    .equ SPRITES_ADDR, VIRT_PAGE1 + VID_MEM_SPRITE_OFFSET
    .equ SPRITE_HEAD_IDX, 1 ; first tile is "blank/empty"

    ; constants
    .equ SCREEN_WIDTH,  320
    .equ SCREEN_HEIGHT, 240
    .equ SPRITE_WIDTH,  16
    .equ SPRITE_HEIGHT, 32
    .equ SPRITE_START_X, (SCREEN_WIDTH / 2) - (SPRITE_WIDTH / 2) + 16
    .equ SPRITE_START_Y, (SCREEN_HEIGHT / 2) - (SPRITE_HEIGHT / 2) + 16

    .section .text
    ; When `main` routine is called, the tilemaps are all reset to 0,
    ; and tile 0 is also all 0s. The Z80 memory is mapped as follows:
    ; 0x0000 - ROM (current code)
    ; 0x4000 - VRAM's first 16KB
    ; 0x8000 - 16KB of RAM
    ; 0xc000 - another 16KB of RAM
    ; SP is already pointing to RAM. Check the `launcher.asm` file for
    ; more details.
main:
    ; Switch to 8-bit GFX 320x240 mode
    SET_VIDEO_MODE VID_MODE_GFX_320_8BIT

    ; Map the first 16KB of the tileset memory in 0x4000.
    MAP_PHYS_ADDR MMU_PAGE1_IO, VID_MEM_TILESET_ADDR

    ; create a blank tile
    ld hl, VIRT_PAGE1
    ld bc, 256
    ld e, 0
    call memset

    ; copy the tileset to VRAM
    ex de, hl
    ld hl, chars_zts
    ld bc, chars_zts_end - chars_zts
    ldir

    ; The tileset is ready, tiles 1 to 16 contains the colored tiles
    ; Map the tilemaps back to page1 (0x4000)
    MAP_PHYS_ADDR MMU_PAGE1_IO, VID_MEM_LAYER0_ADDR

    ; load the palette into VRAM
    ld hl, chars_ztp
    ld de, VIRT_PAGE1 + VID_MEM_PALETTE_OFFSET
    ld bc, chars_ztp_end - chars_ztp
    ldir

    ; fill layer0 with the blank tile
    ld hl, VIRT_PAGE1 + VID_MEM_LAYER0_OFFSET
    ld bc, 3200
    ld e, 0
    call memset

    ; fill layer0 with the blank tile
    ld hl, VIRT_PAGE1 + VID_MEM_LAYER1_OFFSET
    ld bc, 3200
    ld e, 0
    call memset

    call draw_sprites

    jr $
;

draw_sprites:
    ; Copy sprite data to sprite attributes table
    ld de, SPRITES_ADDR
    ld hl, sprite_char
    ld bc, GFX_SPRITE_SIZE
    ldir
    ret
;


    .section .data

    ; Sprite - Head and body will be handled together by marking
    ; the sprite size as 16x32.
    ; Initial Data
sprite_char:
    .dw SPRITE_START_Y ; Y
    .dw SPRITE_START_X ; X
    .db SPRITE_HEAD_IDX ; tile
    .db 0 ; Flags
    .dw GFX_SPRITE_OPTIONS_HEIGHT_32 ; Options


    .section .rodata
chars_zts:
    .incbin "examples/assets/chars.zts"
chars_zts_end:

chars_ztp:
    .incbin "examples/assets/chars.ztp"
chars_ztp_end:
