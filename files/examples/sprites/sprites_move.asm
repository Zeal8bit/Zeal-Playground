    ; Bouncing Sprites Example - A screensaver-style sprite demo
    ; Based on the original sprites.asm example but modified to have
    ; sprites that move around the screen automatically
    .include "examples/launcher.asm"
    .include "zvb_lib_h.asm"
    .include "zos_keyboard.asm"
    .include "zos_sys.asm"

    ; location of sprite data in RAM
    .equ SPRITE_HEAD_ADDR, VIRT_PAGE1 + VID_MEM_SPRITE_OFFSET
    .equ SPRITE_HEAD_IDX, 1
    .equ SPRITE_BODY_ADDR, SPRITE_HEAD_ADDR + GFX_SPRITE_SIZE
    .equ SPRITE_BODY_IDX, 2

    ; Movement constants
    .equ MOVE_SPEED, 1    ; Slower movement - 1 pixel per frame
    .equ SCREEN_WIDTH, 320
    .equ SCREEN_HEIGHT, 240
    .equ SPRITE_SIZE, 16  ; assuming 16x16 sprites

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

    ; Map sprite memory to page1 for sprite display
    MAP_PHYS_ADDR MMU_PAGE1_IO, VID_MEM_SPRITE_ADDR

    ; Main game loop
.game_loop:
    call update_sprite
    call wait_for_vblank
    call draw_sprites
    call wait_end_vblank
    jr .game_loop
;

draw_sprites:
    ; Copy head sprite data
    ld de, SPRITE_HEAD_ADDR
    ld hl, .sprite_head
    ld bc, GFX_SPRITE_SIZE
    ldir

    ; Copy body sprite data
    ld de, SPRITE_BODY_ADDR
    ld hl, .sprite_body
    ld bc, GFX_SPRITE_SIZE
    ldir
    ret
;

update_sprite:
.update_y.load:
    ld hl, .sprite_head + GFX_SPRITE_Y
    ld e, (hl)
    inc hl
    ld d, (hl)
    dec hl

.update_y.add:
    ld a, (.sprite_y_dir)
    add a, e
    ld (hl), a
    ld a, d
    adc a, 0
    inc hl
    ld (hl), a

.update_y.write:
    ld hl, .sprite_body + GFX_SPRITE_Y
    ld e, (hl)
    inc hl
    ld d, (hl)
    dec hl
    ld a, (.sprite_y_dir)
    add a, e
    ld (hl), a
    ld a, d
    adc a, 0
    inc hl
    ld (hl), a

.update_x:
    ld hl, .sprite_head + GFX_SPRITE_X
    ld e, (hl)
    inc hl
    ld d, (hl)
    dec hl

.update_x.add:
    ld a, (.sprite_x_dir)
    add a, e
    ld (hl), a
    ld a, d
    adc a, 0
    inc hl
    ld (hl), a

.update_x.write:
    ld hl, .sprite_body + GFX_SPRITE_X
    ld e, (hl)
    inc hl
    ld d, (hl)
    dec hl
    ld a, (.sprite_x_dir)
    add a, e
    ld (hl), a
    ld a, d
    adc a, 0
    inc hl
    ld (hl), a

    ret
;

    .section .data

.sprite_x_dir: .db 1
.sprite_y_dir: .db 1

    .equ START_X, 16
    .equ START_Y, 16

    ; Sprite - Head Initial Data
.sprite_head:
    .dw START_Y ; Y
    .dw START_X ; X
    .db SPRITE_HEAD_IDX ; tile
    .db 0 ; Flags
    .dw 0 ; Options

    ; Sprite - Body Initial Data
.sprite_body:
    .dw START_Y + SPRITE_SIZE ; Y
    .dw START_X ; X
    .db SPRITE_BODY_IDX ; tile
    .db 0 ; Flags
    .dw 0 ; Options
.sprite_end:

    .section .rodata
    ; Zeal Tileset
chars_zts:
    .incbin "examples/assets/chars.zts"
chars_zts_end:

    ; Zeal Palette
chars_ztp:
    .incbin "examples/assets/chars.ztp"
chars_ztp_end:
