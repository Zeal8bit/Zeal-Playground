    ;;;;;;;   Video Modes  ;;;;;;;

    ; Video modes that can be given to IO_CTRL_VID_MODE register
    .equ VID_MODE_TEXT_640,         0
    .equ VID_MODE_TEXT_320,         1
    .equ VID_MODE_BITMAP_256_MODE,  2
    .equ VID_MODE_BITMAP_320_MODE,  3
    .equ VID_MODE_GFX_640_8BIT,     4
    .equ VID_MODE_GFX_320_8BIT,     5
    .equ VID_MODE_GFX_640_4BIT,     6
    .equ VID_MODE_GFX_320_4BIT,     7

    ; Macros for text-mode
    .equ VID_640480_WIDTH,   640
    .equ VID_640480_HEIGHT,  480
    .equ VID_640480_X_MAX,   80
    .equ VID_640480_Y_MAX,   40
    .equ VID_640480_TOTAL,   VID_640480_X_MAX * VID_640480_Y_MAX

    ; Physical address for the I/O components.
    ; The video mapper is responsible for mapping the I/O component in the I/O bank
    ; starting at address 0xA0, up to 0xAF (16 registers)
    ; It also contains the current firmware version of the video board.
    .equ VID_IO_MAPPER,      0x80
    .equ IO_MAPPER_REV,      VID_IO_MAPPER + 0x0
    .equ IO_MAPPER_MIN,      VID_IO_MAPPER + 0x1
    .equ IO_MAPPER_MAJ,      VID_IO_MAPPER + 0x2
    ; [0x3;0xD] - Reserved
    .equ IO_MAPPER_BANK,     VID_IO_MAPPER + 0xE ; I/O device bank, accessible in 0xA0
    .equ IO_MAPPER_PHYS,     VID_IO_MAPPER + 0xF ; Physical address start of the video chip


    ;;;;;;; Memory related ;;;;;;;

    ; Physical addresses for the video memory
    .equ VID_MEM_PHYS_ADDR_START, 0x100000

    .equ VID_MEM_LAYER0_OFFSET,     0x0000
    .equ VID_MEM_PALETTE_OFFSET,    0x0E00
    .equ VID_MEM_LAYER1_OFFSET,     0x1000
    .equ VID_MEM_SPRITE_OFFSET,     0x2800
    .equ VID_MEM_FONT_OFFSET,       0x3000
    .equ VID_MEM_TILESET_OFFSET,    0x10000

    .equ VID_MEM_LAYER0_ADDR,       VID_MEM_PHYS_ADDR_START + VID_MEM_LAYER0_OFFSET
    .equ VID_MEM_PALETTE_ADDR,      VID_MEM_PHYS_ADDR_START + VID_MEM_PALETTE_OFFSET
    .equ VID_MEM_LAYER1_ADDR,       VID_MEM_PHYS_ADDR_START + VID_MEM_LAYER1_OFFSET
    .equ VID_MEM_SPRITE_ADDR,       VID_MEM_PHYS_ADDR_START + VID_MEM_SPRITE_OFFSET
    .equ VID_MEM_FONT_ADDR,         VID_MEM_PHYS_ADDR_START + VID_MEM_FONT_OFFSET
    .equ VID_MEM_TILESET_ADDR,      VID_MEM_PHYS_ADDR_START + VID_MEM_TILESET_OFFSET

    ; Sprites organization
    .equ SPRITES_MEM_POS_Y_LOW,     0x0
    .equ SPRITES_MEM_POS_Y_HIGH,    0x1
    .equ SPRITES_MEM_POS_X_LOW,     0x2
    .equ SPRITES_MEM_POS_X_HIGH,    0x3
    .equ SPRITES_MEM_TILE,          0x4
    .equ SPRITES_MEM_FLAGS,         0x5
    .equ SPRITES_MEM_OPTIONS_LOW,   0x6
    .equ SPRITES_MEM_OPTIONS_HIGH,  0x7

    ;;;;;;; I/O related ;;;;;;;

    ; System configuration
    .equ SYSTEM_CONF_REV,               0x80
    .equ SYSTEM_CONF_MINOR,             0x81
    .equ SYSTEM_CONF_MAJOR,             0x82
    .equ SYSTEM_CONF_SCRATCH0,          0x88
    .equ SYSTEM_CONF_SCRATCH1,          0x89
    .equ SYSTEM_CONF_SCRATCH2,          0x8a
    .equ SYSTEM_CONF_SCRATCH3,          0x8b
    .equ SYSTEM_CONF_MAPPED_DEVICE,     0x8e
    .equ SYSTEM_CONF_PHYS_ADDR,         0x8f

    ; Video configuration
    .equ VIDEO_CONF_V_CURSOR_LOW,              0x90
    .equ VIDEO_CONF_V_CURSOR_HIGH,             0x91
    .equ VIDEO_CONF_H_CURSOR_LOW,              0x92
    .equ VIDEO_CONF_H_CURSOR_HIGH,             0x93
    .equ VIDEO_CONF_LAYER0_SCROLL_Y_LOW,       0x94
    .equ VIDEO_CONF_LAYER0_SCROLL_Y_HIGH,      0x95
    .equ VIDEO_CONF_LAYER0_SCROLL_X_LOW,       0x96
    .equ VIDEO_CONF_LAYER0_SCROLL_X_HIGH,      0x97
    .equ VIDEO_CONF_LAYER1_SCROLL_Y_LOW,       0x98
    .equ VIDEO_CONF_LAYER1_SCROLL_Y_HIGH,      0x99
    .equ VIDEO_CONF_LAYER1_SCROLL_X_LOW,       0x9a
    .equ VIDEO_CONF_LAYER1_SCROLL_X_HIGH,      0x9b
    .equ VIDEO_CONF_VIDEO_MODE,                0x9c
    .equ VIDEO_CONF_VIDEO_STATUS,              0x9d
    .equ VIDEO_CONF_VIDEO_INT_STATUS,          0x9e
    .equ VIDEO_CONF_VIDEO_INT_CLEAR,           0x9f

    ; Text controller
    .equ TEXT_CTRL_IDX,                        0x00
    .equ TEXT_CTRL_PRINT_CHAR,                 0xa0
    .equ TEXT_CTRL_CURSOR_Y,                   0xa1
    .equ TEXT_CTRL_CURSOR_X,                   0xa2
    .equ TEXT_CTRL_SCROLL_Y,                   0xa3
    .equ TEXT_CTRL_SCROLL_X,                   0xa4
    .equ TEXT_CTRL_CURRENT_COLOR,              0xa5
    .equ TEXT_CTRL_CURSOR_BLINK_TIMING,        0xa6
    .equ TEXT_CTRL_CURSOR_CHARACTER,           0xa7
    .equ TEXT_CTRL_CURSOR_COLORS,              0xa8
    .equ TEXT_CTRL_CTRL,                       0xa9
    .equ TEXT_CTRL_CTRL_SAVE_CURSOR_BIT,       7
    .equ TEXT_CTRL_CTRL_RESTORE_CURSOR_BIT,    6
    .equ TEXT_CTRL_CTRL_AUTO_SCROLL_X_BIT,     5
    .equ TEXT_CTRL_CTRL_AUTO_SCROLL_Y_BIT,     4
    .equ TEXT_CTRL_CTRL_WAIT_ON_WRAP_BIT,      3
    .equ TEXT_CTRL_CTRL_SCROLL_Y_OCCUR_BIT,    0
    .equ TEXT_CTRL_CTRL_NEXTLINE,              0

    ; SPI controller
    .equ SPI_CTRL_IDX,          0x01
    .equ SPI_CTRL_CTRL0,        0xa0
    .equ SPI_CTRL_CTRL,         0xa1
    .equ SPI_CTRL_CLK_DIV,      0xa2
    .equ SPI_CTRL_RAM_LEN,      0xa3
    .equ SPI_CTRL_RAM_FIFO,     0xa7
    .equ SPI_CTRL_RAM_FROM,     0xa8
    .equ SPI_CTRL_RAM_TO,       0xaf

    ; CRC32 controller
    .equ CRC32_CTRL_IDX,            0x02
    .equ CRC32_CTRL_CTRL,           0xa0
    .equ CRC32_CTRL_DATAIN,         0xa1
    .equ CRC32_CTRL_CRC32_BYTE0,    0xa4
    .equ CRC32_CTRL_CRC32_BYTE1,    0xa5
    .equ CRC32_CTRL_CRC32_BYTE2,    0xa6
    .equ CRC32_CTRL_CRC32_BYTE3,    0xa7

    ; Sound controller
    .equ SOUND_CTRL_IDX,                    0x03
    .equ SOUND_CTRL_FREQUENCY_LOW,          0xa0
    .equ SOUND_CTRL_FREQUENCY_HIGH,         0xa1
    .equ SOUND_CTRL_WAVEFORM,               0xa2
    .equ SOUND_CTRL_VOLUME,                 0xa3
    .equ SOUND_CTRL_ST_FIFO,                0xa0
    .equ SOUND_CTRL_ST_SRATE_DIV,           0xa1
    .equ SOUND_CTRL_ST_STATUS,              0xa2
    .equ SOUND_CTRL_MASTER_LEFT_CHANNEL,    0xab
    .equ SOUND_CTRL_MASTER_RIGHT_CHANNEL,   0xac
    .equ SOUND_CTRL_MASTER_HOLD,            0xad
    .equ SOUND_CTRL_MASTER_VOLUME,          0xae
    .equ SOUND_CTRL_MASTER_ENABLE,          0xaf

    ; DMA controller
    .equ DMA_CTRL_IDX,           0x04
    .equ DMA_CTRL_CTRL,          0xa0
    .equ DMA_CTRL_DESC_ADDR0,    0xa1
    .equ DMA_CTRL_DESC_ADDR1,    0xa2
    .equ DMA_CTRL_DESC_ADDR2,    0xa3
    .equ DMA_CTRL_CLK_DIV,       0xa9

    ; Timer controller
    .equ TIMER_CTRL_IDX,         0x05
    .equ TIMER_CTRL_CTRL,        0xa0
    .equ TIMER_CTRL_DIV_LO,      0xa1
    .equ TIMER_CTRL_DIV_HI,      0xa2
    .equ TIMER_CTRL_REL_LO,      0xa3
    .equ TIMER_CTRL_REL_HI,      0xa4
    .equ TIMER_CTRL_CNT_LO,      0xa5
    .equ TIMER_CTRL_CNT_HI,      0xa6

