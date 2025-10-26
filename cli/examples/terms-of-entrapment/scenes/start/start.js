
builder.canvas({
   custom: {
    molstar_postprocessing: {
        background: {
            name: 'image',
            params: {
              source: { name: 'url', params: 'Calibrate.png' } // image from assets
            }
        }
    }
   }
})

const primitives = builder.primitives({
    label_attachment: 'bottom-left',
    label_show_tether: false,
    label_tether_length: 2,
    label_background_color: 'black',
    custom: {
        molstar_markdown_commands: {
            'apply-snapshot': 'title',
            'play-audio': 'part_01.mp3',
        }
    }
});


primitives.label({
    position: [0,0,0],
    text: 'Start Tour',
    label_size: 50.0,
    label_offset: 2.0   // Offset to avoid overlap with the residue  
  })
