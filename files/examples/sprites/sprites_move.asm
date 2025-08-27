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

    .text
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

    call create_sprites

    ; Map sprite memory to page1 for sprite display
    MAP_PHYS_ADDR MMU_PAGE1_IO, VID_MEM_SPRITE_ADDR

    ; Main game loop
game_loop:
    call wait_for_vblank
    call update_sprite_position
    call wait_end_vblank
    jr game_loop

create_sprites:
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

; Update sprite position with simple movement
update_sprite_position:
    ; Load current sprite position
    ld hl, SPRITE_HEAD_ADDR + GFX_SPRITE_Y
    ld e, (hl)
    inc hl
    ld d, (hl)  ; DE = current Y
    ld hl, SPRITE_HEAD_ADDR + GFX_SPRITE_X
    ld c, (hl)
    inc hl
    ld b, (hl)  ; BC = current X

    ; Simple movement - move right and down slowly
    ; Add X movement (1 pixel per frame)
    ld a, c
    add a, MOVE_SPEED
    ld c, a
    jr nc, .no_x_carry
    inc b
.no_x_carry:

    ; Add Y movement (1 pixel per frame)
    ld a, e
    add a, MOVE_SPEED
    ld e, a
    jr nc, .no_y_carry
    inc d
.no_y_carry:

    ; Simple boundary checking - wrap around
    ; Check X boundary
    ld a, b
    cp (SCREEN_WIDTH - 16) >> 8
    jr c, .x_ok
    ld a, c
    cp (SCREEN_WIDTH - 16) & 0xFF
    jr c, .x_ok
    ld bc, 0  ; Reset to left edge
.x_ok:

    ; Check Y boundary
    ld a, d
    cp (SCREEN_HEIGHT - 32) >> 8  ; Account for body sprite
    jr c, .y_ok
    ld a, e
    cp (SCREEN_HEIGHT - 32) & 0xFF
    jr c, .y_ok
    ld de, 0  ; Reset to top edge
.y_ok:

    ; Update head sprite Y position
    ld hl, SPRITE_HEAD_ADDR + GFX_SPRITE_Y
    ld (hl), e
    inc hl
    ld (hl), d

    ; Update head sprite X position
    ld hl, SPRITE_HEAD_ADDR + GFX_SPRITE_X
    ld (hl), c
    inc hl
    ld (hl), b

    ; Update body sprite Y position (16 pixels below head)
    ld hl, SPRITE_BODY_ADDR + GFX_SPRITE_Y
    ld a, e
    add a, 16
    ld (hl), a
    inc hl
    ld a, d
    adc a, 0
    ld (hl), a

    ; Update body sprite X position (same as head)
    ld hl, SPRITE_BODY_ADDR + GFX_SPRITE_X
    ld (hl), c
    inc hl
    ld (hl), b

    ret

    .section .rodata, "a",@progbits
.sprite_head:
    .dw 32 ; Y
    .dw 32 ; X
    .db SPRITE_HEAD_IDX ; tile
    .db 0 ; Flags
    .dw 0 ; Options

.sprite_body:
    .dw 48 ; Y
    .dw 32 ; X
    .db SPRITE_BODY_IDX ; tile
    .db 0 ; Flags
    .dw 0 ; Options
.sprite_end:


chars_zts:
    .incbin "examples/assets/chars.zts"
chars_zts_end:

chars_ztp:
    .incbin "examples/assets/chars.ztp"
chars_ztp_end:
