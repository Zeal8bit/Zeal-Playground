  ; Hello World Example
  ;
  ; This example shows how to write text to the screen
  ; using PRINT_CHAR register and DO_NL bit of CTRL

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

start:
  ld hl, message
print_loop:
  ld a, (hl)
  or a
  jr z, print_done
  cp 0x0A   ; newline
  jr nz, print
  ld a, CTRL_DO_NL
  out (CTRL), a
  jr print_next
print:
  out (PRINT_CHAR), a
print_next:
  inc hl
  jr print_loop
print_done:
  jr $  ; loop forever

  ; Place your message here
  ; The message should null-terminated
  ; and can contain \n characters
message: .cstr "hello\nworld"
