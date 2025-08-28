    ; Example showing how to use the layer0 and layer1 in text mode to
    ; output any string with any given color.
    .include "examples/launcher.asm"

    .section .text
    ; Check the `launcher.asm` file for more details about the
    ; `main` routine entry state.
main:
    ; Write a message to layer 0, like:
    ; layer0[0] = 'H';
    ; layer0[1] = 'e';
    ; layer0[2] = 'l';
    ; layer0[3] = 'l';
    ; layer0[4] = 'o';
    ld hl, 0x4000 + VID_MEM_LAYER0_OFFSET + 0
    ld (hl), 'H'
    inc hl
    ld (hl), 'e'
    inc hl
    ld (hl), 'l'
    inc hl
    ld (hl), 'l'
    inc hl
    ld (hl), 'o'

    ; Now set the colors for these characters, like:
    ; layer1[0] = 0xf1;
    ; layer1[1] = 0xf2;
    ; layer1[2] = 0xf3;
    ; layer1[3] = 0xf4;
    ; layer1[4] = 0xf5;
    ld hl, 0x4000 + VID_MEM_LAYER1_OFFSET + 0
    ld (hl), 0xf1
    inc hl
    ld (hl), 0xf2
    inc hl
    ld (hl), 0xf3
    inc hl
    ld (hl), 0xf4
    inc hl
    ld (hl), 0xf5

    ret
