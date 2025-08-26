  ; .include "zeal_computer_h.asm"

;------------------------------------------------------------
; RGB565
;
; Converts 8-bit R,G,B color values into a 16-bit RGB565 constant.
;
; Input:
;   r = red (0-255)
;   g = green (0-255)
;   b = blue (0-255)
; Output:
;   Defines a 16-bit constant with name = \name
;   Bit layout: RRRRR GGGGGG BBBBB
;
; Registers:
;   None (assembly-time calculation)
;------------------------------------------------------------
  .macro RGB565 name, r, g, b
      .set \name, (((\r >> 3) & 0x1F) << 11) | (((\g >> 2) & 0x3F) << 5) | ((\b >> 3) & 0x1F)
  .endm

;------------------------------------------------------------
; TEXT_COLOR
;
; Creates an 8-bit text color constant from foreground and background nibbles.
;
; Input:
;   fg = foreground color (0-15)
;   bg = background color (0-15), defaults to 0x0
; Output:
;   Defines a constant with name = \name
;   Format: 0bBBBBFFFF (high nibble = BG, low nibble = FG)
;
; Registers:
;   None (assembly-time calculation)
;------------------------------------------------------------
  .macro TEXT_COLOR name, fg, bg=0x0
      .set \name, (((\bg & 0xF) << 4) | (\fg & 0xF))
  .endm

;------------------------------------------------------------
; SET_TEXT_COLOR
;
; Outputs a text color to the current color register of the text hardware.
;
; Input:
;   fg = foreground color (0-15)
;   bg = background color (0-15), defaults to 0x0
; Output:
;   Sends color to TEXT_CTRL_CURRENT_COLOR port
;
; Registers:
;   Uses A
;   Destroys A
;------------------------------------------------------------
  .macro SET_TEXT_COLOR fg, bg=0x0
      ld a, ((\bg & 0xF) << 4) | (\fg & 0xF)
      out (TEXT_CTRL_CURRENT_COLOR), a
  .endm

;------------------------------------------------------------
; SET_CURSOR_X
;
; Sets the cursor X position for the text hardware.
;
; Input:
;   x = horizontal position (byte)
; Output:
;   Sends X position to TEXT_CTRL_CURSOR_X port
;
; Registers:
;   Uses A
;   Destroys A
;------------------------------------------------------------
  .macro SET_CURSOR_X x
      ld a, \x
      out (TEXT_CTRL_CURSOR_X), a
  .endm

;------------------------------------------------------------
; SET_CURSOR_Y
;
; Sets the cursor Y position for the text hardware.
;
; Input:
;   y = vertical position (byte)
; Output:
;   Sends Y position to TEXT_CTRL_CURSOR_Y port
;
; Registers:
;   Uses A
;   Destroys A
;------------------------------------------------------------
  .macro SET_CURSOR_Y y
      ld a, \y
      out (TEXT_CTRL_CURSOR_Y), a
  .endm

;------------------------------------------------------------
; SET_CURSOR_XY
;
; Sets the cursor X and Y positions for the text hardware.
;
; Input:
;   x = horizontal position
;   y = vertical position
; Output:
;   Sends positions to TEXT_CTRL_CURSOR_X and TEXT_CTRL_CURSOR_Y ports
;
; Registers:
;   Uses A
;   Destroys A
;------------------------------------------------------------
  .macro SET_CURSOR_XY x, y
      SET_CURSOR_X \x
      SET_CURSOR_Y \y
  .endm

;------------------------------------------------------------
; CLEAR_SCREEN
;
; Clears both VRAM layers and resets the text I/O controller.
;
; Input:
;   char  = character code to fill Layer 0 VRAM (default 0)
;   color = attribute value to fill Layer 1 VRAM (default 0x0F)
;
; Output:
;   Layer 0 VRAM filled with 'char'
;   Layer 1 VRAM filled with 'color'
;   Text I/O controller reset (cursor=0,0, scroll=0,0)
;
; Registers:
;   Uses AF, BC, HL
;   Preserves AF (saved/restored)
;------------------------------------------------------------
  .macro CLEAR_SCREEN char=0, color=0x0F
    MMU_GET_PAGE_NUMBER MMU_PAGE1_IO
    push af ; store mmu_page_back

    MAP_PHYS_ADDR MMU_PAGE1_IO, VID_MEM_LAYER0_ADDR
    ld hl, VIRT_PAGE1
    ld bc, VID_640480_TOTAL
    ld e, \char
    call memset
    ld hl, VIRT_PAGE1 + VID_MEM_LAYER1_OFFSET
    ld e, \color
    call memset
    xor a

   ; Map the text I/O controller, which is also 0
    out (IO_MAPPER_BANK), a
    out (TEXT_CTRL_CURSOR_Y), a
    out (TEXT_CTRL_CURSOR_X), a
    out (TEXT_CTRL_SCROLL_Y), a
    out (TEXT_CTRL_SCROLL_X), a

    pop af
    MMU_SET_PAGE_NUMBER MMU_PAGE1_IO
  .endm

;------------------------------------------------------------
; Standard VGA 16-color palette (foreground only, background=0)
; Each constant is a single byte, 0x0F format (low nibble = FG, high nibble = BG)
;------------------------------------------------------------
  TEXT_COLOR TEXT_COLOR_BLACK,        0x0
  TEXT_COLOR TEXT_COLOR_BLUE,         0x1
  TEXT_COLOR TEXT_COLOR_GREEN,        0x2
  TEXT_COLOR TEXT_COLOR_CYAN,         0x3
  TEXT_COLOR TEXT_COLOR_RED,          0x4
  TEXT_COLOR TEXT_COLOR_MAGENTA,      0x5
  TEXT_COLOR TEXT_COLOR_BROWN,        0x6
  TEXT_COLOR TEXT_COLOR_LIGHT_GRAY,   0x7
  TEXT_COLOR TEXT_COLOR_DARK_GRAY,    0x8
  TEXT_COLOR TEXT_COLOR_LIGHT_BLUE,   0x9
  TEXT_COLOR TEXT_COLOR_LIGHT_GREEN,  0xA
  TEXT_COLOR TEXT_COLOR_LIGHT_CYAN,   0xB
  TEXT_COLOR TEXT_COLOR_LIGHT_RED,    0xC
  TEXT_COLOR TEXT_COLOR_LIGHT_MAGENTA,0xD
  TEXT_COLOR TEXT_COLOR_YELLOW,       0xE
  TEXT_COLOR TEXT_COLOR_WHITE,        0xF
