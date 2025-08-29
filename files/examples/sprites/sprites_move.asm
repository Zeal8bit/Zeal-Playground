    ; Bouncing Sprites Example - A screensaver-style sprite demo
    ; Based on the original sprites.asm example but modified to have
    ; sprites that move around the screen automatically
    .include "examples/launcher.asm"
    .include "zvb_lib_h.asm"

    ; location of sprite data in RAM
    .equ SPRITE_HEAD_ADDR, VIRT_PAGE1 + VID_MEM_SPRITE_OFFSET
    .equ SPRITE_HEAD_IDX, 1

    ; constants
    .equ MOVE_SPEED,    2    ; Slower movement - 1 pixel per frame
    .equ SCREEN_WIDTH,  320
    .equ SCREEN_HEIGHT, 240
    .equ SPRITE_WIDTH,  16
    .equ SPRITE_HEIGHT, 32
    .equ SPRITE_START_X, 16
    .equ SPRITE_START_Y, 16

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

    ; Main game loop
game_loop:
    call update_sprite
    call wait_for_vblank
    call draw_sprites
    call wait_end_vblank
    jr game_loop
;

draw_sprites:
    ; Copy sprite data to sprite attributes table
    ld de, SPRITE_HEAD_ADDR
    ld hl, sprite_char
    ld bc, GFX_SPRITE_SIZE
    ldir
    ret
;

update_sprite:
_update_sprite_y:
    ; Load the sprite Y position from RAM
    ld hl, (sprite_char + GFX_SPRITE_Y)
    ld a, (sprite_y_dir)
    ld e, a
    rlca
    sbc a, a
    ld d, a
    ; Y += direction
    add hl, de
    ; Store back
    ld (sprite_char + GFX_SPRITE_Y), hl
    ; Check for the border limit and save the new direction.
    ; If HL is at (screen_height - 32), reverse direction (A register).
    ; Bottom border is (screen_height + 16) since sprites are positioned
    ; relative to top-left corner (16,16).
    ld bc, SCREEN_HEIGHT + 16 - SPRITE_HEIGHT
    ld a, (sprite_y_dir)
    call check_edge
    ld (sprite_y_dir), a
_update_sprite_x:
    ; Do the same thing for the X position
    ld hl, (sprite_char + GFX_SPRITE_X)
    ld a, (sprite_x_dir)
    ld e, a
    rlca
    sbc a, a
    ld d, a
    add hl, de
    ld (sprite_char + GFX_SPRITE_X), hl
    ; Calculate BC similarly, for the right border. The sprite width is 16 here and not 32.
    ld bc, SCREEN_WIDTH + 16 - SPRITE_WIDTH
    ld a, (sprite_x_dir)
    call check_edge
    ld (sprite_x_dir), a
    ret
;

    ; Parameters:
    ;   HL - New position of the sprite
    ;   BC - Border position
    ;   A  - Current direction (1 or -1)
    ; Returns:
    ;   A - New direction
check_edge:
    ; Save direction in D
    ld d, a
    ; If HL is at the top or left border (16), reverse direction (A register)
    ld a, h
    or h
    jr nz, 1f
    ld a, l
    ; We need to check that L is <= 16, so use 17 as a comparator
    cp 17
    ; On carry, HL is smaller or equal to 16, invert the direciton and return it!
    jr c, 2f
1: ; _check_edge__not_top_left:
    ; Check the border given as a parameter
    or a ; clear flags
    sbc hl, bc
    ; If carry flag is set, the sprite hasn't reached the border, return
    ld a, d
    ret c
2: ; _check_edge__return:
    ; Swap the direction
    ld a, d
    neg
    ret
;

    .section .data

sprite_x_dir: .db MOVE_SPEED
sprite_y_dir: .db MOVE_SPEED*2

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
    ; Zeal Tileset
chars_zts:
    .incbin "examples/assets/chars.zts"
chars_zts_end:

    ; Zeal Palette
chars_ztp:
    .incbin "examples/assets/chars.ztp"
chars_ztp_end:
