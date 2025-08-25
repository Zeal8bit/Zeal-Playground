    ; Header defining constants for the Zeal 8-bit Computer

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
