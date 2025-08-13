  ; ZVB - Text Controller Constants
PRINT_CHAR:           equ 0xA0
CURSOR_Y:             equ 0xA1
CURSOR_X:             equ 0xA1
SCROLL_Y:             equ 0xA1
SCROLL_X:             equ 0xA1
CURRENT_COLOR:        equ 0xA1
CURSOR_BLINK_TIMING:  equ 0xA1
CURSOR_CHARACTER:     equ 0xA1
CURSOR_COLORS:        equ 0xA1
CTRL:                 equ 0xA9

  ; ZVB - CTRL Bit Constants
CTRL_DO_NL:           equ 0x01
CTRL_WAIT_AND_WRAP:   equ 0x03
CTRL_AUTO_SCROLL_Y:   equ 0x04
CTRL_AUTO_SCROLL_X:   equ 0x05
CTRL_RESTORE_CURSOR:  equ 0x06
CTRL_SAVE_CURSOR:     equ 0x07