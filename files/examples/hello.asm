  ; Hello World Example


start:
  ld hl, message
print_loop:
  ld a, (hl)
  or a
  jr z, print_done
  cp 0x0A   ; newline
  jr nz, print_char
  ld a, 0x01
  out (0xA9), a
  jr print_next
print_char:
  out (0xA0), a
print_next:
  inc hl
  jr print_loop
print_done:
  jr $

message: .cstr "hello\nworld"