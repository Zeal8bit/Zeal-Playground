  ; Hello World Example
  ;
  ; This example shows how to write text to the screen
  ; using TEXT_CTRL_PRINT_CHAR register and
  ; TEXT_CTRL_CTRL_NEXTLINE bit of TEXT_CTRL_CTRL

  .include "examples/launcher.asm"
  .include "zvb_hardware_h.asm"
  .include "zvb_lib_h.asm"

  .text
  .global _start
main:
  SET_TEXT_COLOR TEXT_COLOR_RED
  ld hl, message1
  call print_str

  SET_TEXT_COLOR TEXT_COLOR_BLACK, TEXT_COLOR_WHITE
  SET_CURSOR_XY 0, 10
  ld hl, message2
  call print_str

  jr $  ; loop forever

;------------------------------------------------------------
; print_str
;
; Prints a null-terminated string from memory.
;
; Input:
;   HL = pointer to null-terminated string
;
; Output:
;   Characters sent to text output device
;
; Registers:
;   Uses A and HL
;   Destroys A, HL is incremented until null terminator
;
;------------------------------------------------------------
  .global print_str
print_str:
.loop:
  ld a, (hl)
  or a
  jr z, .done
  cp 0x0A   ; newline
  jr nz, .print
  ld a, 1 << TEXT_CTRL_CTRL_NEXTLINE
  out (TEXT_CTRL_CTRL), a
  jr .next
.print:
  out (TEXT_CTRL_PRINT_CHAR), a
.next:
  inc hl
  jr .loop
.done:
  ret


  ; Place your message here
  ; The message should null-terminated
  ; and can contain \n characters
message1: .asciz "Hello World!\nThis is a new line.\n"
message2: .asciz "Good bye!\n"
