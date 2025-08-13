  ; Hello World Example
  ;
  ; This example shows how to write text to the screen
  ; using PRINT_CHAR register and DO_NL bit of CTRL

.include "examples/zvb_h.asm"

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
