    ; Header defining constants for the Zeal 8-bit Computer

    ; Define usable sections
    .section .text
    .section .data
    .section .rodata
    .section .bss

    .equ CONFIG_CPU_FREQ, 10000000

    ; The 64KB address space is divided into 4 pages of 16KB
    .equ VIRT_PAGE_SIZE, 16384
    .equ VIRT_PAGE0, 0x0000
    .equ VIRT_PAGE1, 0x4000
    .equ VIRT_PAGE2, 0x8000
    .equ VIRT_PAGE3, 0xc000

    ; RAM starts at physical address 512KB
    .equ RAM_PHYS_ADDR_START, 524288
    .equ RAM_PHYS_PAGE0, RAM_PHYS_ADDR_START / VIRT_PAGE_SIZE

    ; MMU I/O configuration registers
    .equ MMU_PAGE0_IO, 0xf0
    .equ MMU_PAGE1_IO, 0xf1
    .equ MMU_PAGE2_IO, 0xf2
    .equ MMU_PAGE3_IO, 0xf3

    ; Map a physical address (page) to a virtual page
    .macro MAP_PHYS_ADDR mmu_page_io, phys_addr
        ld a, \phys_addr >> 14
        out (\mmu_page_io), a
    .endm

    ; Get the MMU configuration for a page declared at compile time.
    .macro MMU_GET_PAGE_NUMBER page
        ld a, \page << 6 & 0xff
        in a, (\page)
    .endm

    ; Set the MMU configuration for a page declared at compile time.
    .macro MMU_SET_PAGE_NUMBER page
        out (\page), a
    .endm

    ; Z80 PIO I/O registers
    ; Data/Ctrl selection is bit 1
    ; Port A/B selection is bit 0
    .equ PIO_DATA_A, 0xd0
    .equ PIO_DATA_B, 0xd1
    .equ PIO_CTRL_A, 0xd2
    .equ PIO_CTRL_B, 0xd3
    ; PIO Modes
    .equ PIO_MODE0, 0x0f
    .equ PIO_MODE1, 0x4f
    .equ PIO_MODE2, 0x8f
    .equ PIO_MODE3, 0xcf
    .equ PIO_OUTPUT,  IO_PIO_MODE0
    .equ PIO_INPUT,   IO_PIO_MODE1
    .equ PIO_BIDIR,   IO_PIO_MODE2
    .equ PIO_BITCTRL, IO_PIO_MODE3

    ; Keyboard I/O address (RO)
    .equ KB_DATA_IO, 0xE8

    .section .data
;------------------------------------------------------------
; memset
;
; Fills a block of memory with a constant byte value.
;
; Input:
;   HL = start address of memory region
;   BC = number of bytes to fill
;   E  = byte value to write
;
; Output:
;   Memory at [HL..HL+BC-1] set to E
;
; Registers:
;   Uses A, B, C, HL
;   Destroys A, B, C, HL
;
; Notes:
;   - Pushes BC at start and pops at end to preserve original BC.
;   - Loops until BC bytes have been written.
;   - Assumes HL points to writable memory region.
;------------------------------------------------------------
    .globl memset
memset:
    push bc
1:
    ld a, b
    or c
    jr z, 2f
    ld (hl), e
    inc hl
    dec bc
    jp 1b
2:
    pop bc
    ret


;------------------------------------------------------------
; msleep
;
; Delays execution for a specified number of milliseconds.
;
; Input:
;   DE = number of milliseconds to wait
;
; Output:
;   Busy-waits for DE milliseconds (approximate, depends on CONFIG_CPU_FREQ)
;
; Registers:
;   Uses A, B, C, DE
;   Destroys A
;   Preserves BC, DE
;
; Notes:
;   - CONFIG_CPU_FREQ must be defined as the CPU clock frequency in Hz.
;   - Timing is approximate and assumes no interrupts.
;   - Busy-waits using instruction loops; CPU is blocked during delay.
;------------------------------------------------------------
msleep:
    ; If DE is 0, we can return directly.
    ld a, d
    or e
    ret z
    push de
    push bc
1:
    ; Divide by 1000 to get the number of T-states per milliseconds
    ; 24 is the number of T-states below
    ld bc, CONFIG_CPU_FREQ / 1000 / 24
2:
    ; 24 T-states for the following, until 'jp nz, _zos_waste_time'
    dec bc
    ld a, b
    or c
    jp nz, 2b
    ; If we are here, a milliseconds has elapsed
    dec de
    ld a, d
    or e
    jp nz, 1b
    pop bc
    pop de
    xor a
    ret
