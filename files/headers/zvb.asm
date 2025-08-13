    ;;;;;;;   Video Modes  ;;;;;;;

    VID_MODE_TEXT_640        .equ 0
    VID_MODE_TEXT_320        .equ 1
    VID_MODE_BITMAP_256_MODE .equ 2
    VID_MODE_BITMAP_320_MODE .equ 3
    VID_MODE_GFX_640_8BIT    .equ 4
    VID_MODE_GFX_320_8BIT    .equ 5
    VID_MODE_GFX_640_4BIT    .equ 6
    VID_MODE_GFX_320_4BIT    .equ 7

    ;;;;;;; Memory related ;;;;;;;

    ; Physical addresses for the video memory
    VID_MEM_PHYS_ADDR_START    .equ 0x100000

    VID_MEM_LAYER0_OFFSET      .equ 0x0000
    VID_MEM_PALETTE_OFFSET     .equ 0x0E00
    VID_MEM_LAYER1_OFFSET      .equ 0x1000
    VID_MEM_SPRITE_OFFSET      .equ 0x2800
    VID_MEM_FONT_OFFSET        .equ 0x3000
    VID_MEM_TILESET_OFFSET     .equ 0x10000

    VID_MEM_LAYER0_ADDR        .equ VID_MEM_PHYS_ADDR_START + VID_MEM_LAYER0_OFFSET
    VID_MEM_PALETTE_ADDR       .equ VID_MEM_PHYS_ADDR_START + VID_MEM_PALETTE_OFFSET
    VID_MEM_LAYER1_ADDR        .equ VID_MEM_PHYS_ADDR_START + VID_MEM_LAYER1_OFFSET
    VID_MEM_SPRITE_ADDR        .equ VID_MEM_PHYS_ADDR_START + VID_MEM_SPRITE_OFFSET
    VID_MEM_FONT_ADDR          .equ VID_MEM_PHYS_ADDR_START + VID_MEM_FONT_OFFSET
    VID_MEM_TILESET_ADDR       .equ VID_MEM_PHYS_ADDR_START + VID_MEM_TILESET_OFFSET

    ; Sprites organization
    SPRITES_MEM_POS_Y_LOW    .equ 0x0
    SPRITES_MEM_POS_Y_HIGH   .equ 0x1
    SPRITES_MEM_POS_X_LOW    .equ 0x2
    SPRITES_MEM_POS_X_HIGH   .equ 0x3
    SPRITES_MEM_TILE         .equ 0x4
    SPRITES_MEM_FLAGS        .equ 0x5
    SPRITES_MEM_OPTIONS_LOW  .equ 0x6
    SPRITES_MEM_OPTIONS_HIGH .equ 0x7

    ;;;;;;; I/O related ;;;;;;;

    ; System configuration
    SYSTEM_CONF_REV           .equ 0x80
    SYSTEM_CONF_MINOR         .equ 0x81
    SYSTEM_CONF_MAJOR         .equ 0x82
    SYSTEM_CONF_SCRATCH0      .equ 0x88
    SYSTEM_CONF_SCRATCH1      .equ 0x89
    SYSTEM_CONF_SCRATCH2      .equ 0x8a
    SYSTEM_CONF_SCRATCH3      .equ 0x8b
    SYSTEM_CONF_MAPPED_DEVICE .equ 0x8e
    SYSTEM_CONF_PHYS_ADDR     .equ 0x8f

    ; Video configuration
    VIDEO_CONF_V_CURSOR_LOW         .equ 0x90
    VIDEO_CONF_V_CURSOR_HIGH        .equ 0x91
    VIDEO_CONF_H_CURSOR_LOW         .equ 0x92
    VIDEO_CONF_H_CURSOR_HIGH        .equ 0x93
    VIDEO_CONF_LAYER0_SCROLL_Y_LOW  .equ 0x94
    VIDEO_CONF_LAYER0_SCROLL_Y_HIGH .equ 0x95
    VIDEO_CONF_LAYER0_SCROLL_X_LOW  .equ 0x96
    VIDEO_CONF_LAYER0_SCROLL_X_HIGH .equ 0x97
    VIDEO_CONF_LAYER1_SCROLL_Y_LOW  .equ 0x98
    VIDEO_CONF_LAYER1_SCROLL_Y_HIGH .equ 0x99
    VIDEO_CONF_LAYER1_SCROLL_X_LOW  .equ 0x9a
    VIDEO_CONF_LAYER1_SCROLL_X_HIGH .equ 0x9b
    VIDEO_CONF_VIDEO_MODE           .equ 0x9c
    VIDEO_CONF_VIDEO_STATUS         .equ 0x9d
    VIDEO_CONF_VIDEO_INT_STATUS     .equ 0x9e
    VIDEO_CONF_VIDEO_INT_CLEAR      .equ 0x9f

    ; Text controller
    TEXT_CTRL_IDX                 .equ 0x00
    TEXT_CTRL_PRINT_CHAR          .equ 0xa0
    TEXT_CTRL_CURSOR_Y            .equ 0xa1
    TEXT_CTRL_CURSOR_X            .equ 0xa2
    TEXT_CTRL_SCROLL_Y            .equ 0xa3
    TEXT_CTRL_SCROLL_X            .equ 0xa4
    TEXT_CTRL_CURRENT_COLOR       .equ 0xa5
    TEXT_CTRL_CURSOR_BLINK_TIMING .equ 0xa6
    TEXT_CTRL_CURSOR_CHARACTER    .equ 0xa7
    TEXT_CTRL_CURSOR_COLORS       .equ 0xa8
    TEXT_CTRL_CTRL                .equ 0xa9
        TEXT_CTRL_CTRL_SAVE_CURSOR_BIT    .equ 7
        TEXT_CTRL_CTRL_RESTORE_CURSOR_BIT .equ 6
        TEXT_CTRL_CTRL_AUTO_SCROLL_X_BIT  .equ 5
        TEXT_CTRL_CTRL_AUTO_SCROLL_Y_BIT  .equ 4
        TEXT_CTRL_CTRL_WAIT_ON_WRAP_BIT   .equ 3
        TEXT_CTRL_CTRL_SCROLL_Y_OCCUR_BIT .equ 0
        TEXT_CTRL_CTRL_NEXTLINE           .equ 0

    ; SPI controller
    SPI_CTRL_IDX      .equ 0x01
    SPI_CTRL_CTRL0    .equ 0xa0
    SPI_CTRL_CTRL     .equ 0xa1
    SPI_CTRL_CLK_DIV  .equ 0xa2
    SPI_CTRL_RAM_LEN  .equ 0xa3
    SPI_CTRL_RAM_FIFO .equ 0xa7
    SPI_CTRL_RAM_FROM .equ 0xa8
    SPI_CTRL_RAM_TO   .equ 0xaf

    ; CRC32 controller
    CRC32_CTRL_IDX         .equ 0x02
    CRC32_CTRL_CTRL        .equ 0xa0
    CRC32_CTRL_DATAIN      .equ 0xa1
    CRC32_CTRL_CRC32_BYTE0 .equ 0xa4
    CRC32_CTRL_CRC32_BYTE1 .equ 0xa5
    CRC32_CTRL_CRC32_BYTE2 .equ 0xa6
    CRC32_CTRL_CRC32_BYTE3 .equ 0xa7

    ; Sound controller
    SOUND_CTRL_IDX                  .equ 0x03
    SOUND_CTRL_FREQUENCY_LOW        .equ 0xa0
    SOUND_CTRL_FREQUENCY_HIGH       .equ 0xa1
    SOUND_CTRL_WAVEFORM             .equ 0xa2
    SOUND_CTRL_VOLUME               .equ 0xa3
    SOUND_CTRL_ST_FIFO              .equ 0xa0
    SOUND_CTRL_ST_SRATE_DIV         .equ 0xa1
    SOUND_CTRL_ST_STATUS            .equ 0xa2
    SOUND_CTRL_MASTER_LEFT_CHANNEL  .equ 0xab
    SOUND_CTRL_MASTER_RIGHT_CHANNEL .equ 0xac
    SOUND_CTRL_MASTER_HOLD          .equ 0xad
    SOUND_CTRL_MASTER_VOLUME        .equ 0xae
    SOUND_CTRL_MASTER_ENABLE        .equ 0xaf

    ; DMA controller
    DMA_CTRL_IDX        .equ 0x04
    DMA_CTRL_CTRL       .equ 0xa0
    DMA_CTRL_DESC_ADDR0 .equ 0xa1
    DMA_CTRL_DESC_ADDR1 .equ 0xa2
    DMA_CTRL_DESC_ADDR2 .equ 0xa3
    DMA_CTRL_CLK_DIV    .equ 0xa9

    ; Timer controller
    TIMER_CTRL_IDX    .equ 0x05
    TIMER_CTRL_CTRL   .equ 0xa0
    TIMER_CTRL_DIV_LO .equ 0xa1
    TIMER_CTRL_DIV_HI .equ 0xa2
    TIMER_CTRL_REL_LO .equ 0xa3
    TIMER_CTRL_REL_HI .equ 0xa4
    TIMER_CTRL_CNT_LO .equ 0xa5
    TIMER_CTRL_CNT_HI .equ 0xa6

