  ; Hello World Example
  ;
  ; This example shows how to write text to the screen
  ; using PRINT_CHAR register and DO_NL bit of CTRL

; .include "zos_sys.asm"

TEXT_CTRL_CTRL                .equ 0xa9
TEXT_CTRL_PRINT_CHAR          .equ 0xa0
TEXT_CTRL_CTRL_NEXTLINE       .equ 0


  .text
  ; .global _start
_start:
  ld hl, message
print_loop:
  ld a, (hl)
  or a
  jr z, print_done
  cp 0x0A   ; newline
  jr nz, print
  ld a, 1 << TEXT_CTRL_CTRL_NEXTLINE
  out (TEXT_CTRL_CTRL), a
  jr print_next
print:
  out (TEXT_CTRL_PRINT_CHAR), a
print_next:
  inc hl
  jr print_loop
print_done:
  jr $  ; loop forever

  ; Place your message here
  ; The message should null-terminated
  ; and can contain \n characters
message: .asciz "hello\nworld"
