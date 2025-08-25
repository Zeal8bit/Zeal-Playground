    ; Example showing how to use the tileset to create tiles and
    ; dispose them on screen.
    .include "examples/launcher.asm"

    ; When `main` routine is called, the tilemaps are all reset to 0,
    ; and tile 0 is also all 0s. The Z80 memory is mapped as follows:
    ; 0x0000 - ROM (current code)
    ; 0x4000 - VRAM's first 16KB
    ; 0x8000 - 16KB of RAM
    ; 0xc000 - another 16KB of RAM
    ; SP is already pointing to RAM. Check the `launcher.asm` file for
    ; more details.
main:
    ; In this example we will 16 colored tiles and fill randomly the scren from
    ; top to bottom using these tiles.
    ; Before switching to graphics mode, let's populate the tileset.
    ; Map the first 16KB of the tileset memory in 0x4000.
    MAP_PHYS_ADDR MMU_PAGE1_IO, VID_MEM_TILESET_ADDR
    call create_color_tiles
    ; The tileset is ready, tiles 1 to 16 contains the colored tiles
    ; Map the tilemaps back to page1 (0x4000)
    MAP_PHYS_ADDR MMU_PAGE1_IO, VID_MEM_LAYER0_ADDR
    ; Switch to 640x480 8-bit GFX mode
    ld a, VID_MODE_GFX_640_8BIT
    out (VIDEO_CONF_VIDEO_MODE), a
    ; Populate the layer0 with the tiles (layer1 is transparent already)
fill_again:
    call fill_screen
    ; Do the screen fill in an infinite loop
    jp fill_again


create_color_tiles:
    ; Create the 16 colored tiles, using the colors 0x40 to 0x4F from the palette.
    ; Layer1 is filled with tile0, which is transparent, so let's keep that tile0
    ; as it is now and start filling at tile1. Each tile is 256-byte big in 8-bit
    ; GFX mode, so let's start populating tiles at offset 256.
    ; Let's create a loop:
    ld d, 16              ; Iterations
    ld e, 0x40            ; First color to fill
    ld bc, 256            ; Number of bytes to write
    ld hl, 0x4000 + 256   ; Destination, skip first tile
_create_tile:
    ; This routine doesn't alter BC nor DE, it only increments HL
    ; by BC bytes. So after executing it, it HL already points to
    ; the next tile in memory.
    call vram_memset
    ; Increment to the next color
    inc e
    ; Decrement the iterator and check if it's the end of the loop
    dec d
    jr nz, _create_tile
    ; Iterator is 0, return
    ret


fill_screen:
    ; Write the layer0 with any of the 16 colored tiles created above.
    ; In this mode (640x480), we have 40x30 tile visible, for a total
    ; of 80x40 tiles. This means that we should not linearly write to
    ; the layer0 (tilemap), we should skip 40 tiles for each line.
    ld hl, 0x4000   ; Point to layer1's first byte
    ld c, 30        ; Number of lines to draw
_fill_next_line:
    ; Let's simplify the code by creating an intermediate routines
    call fill_line
    ; Decrement the number of lines to draw
    dec c
    ; If it's 0, we already drew the whole screen
    jp nz, _fill_next_line
    ret


    ; Parameters:
    ;   HL - Tile in the layer to start filling from
    ; Returns:
    ;   HL - First byte on the next line to fill
    ; Alters:
    ;   A, B, DE, HL
fill_line:
    ld b, 40        ; Number of tiles to draw on the current line
_fill_line_loop:
    ; Use Z80's `R` register as a pseudo-random value.
    ld a, r
    ; Make it between 0 and 15 (included)
    and 0xf
    ; Make it between 1 and 16 (included)
    inc a
    ; Write to the tilemap
    ld (hl), a
    inc hl
    ; Sleep for 5ms
    ld de, 5
    call msleep
    ; Decrement the number of tile
    dec b
    jr nz, _fill_line_loop
    ; Reached the end of the line, add 40 to HL (to skip non-visible tiles)
    ld de, 40
    add hl, de
    ret
