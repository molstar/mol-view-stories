
const struct = _2v0m
.component({selector: 'protein'})
.representation({ type: 'cartoon' })
.color({ color: colors['2v0m']})

hem
.representation({ type: 'ball_and_stick', ref: 'hem'})
.color({ color: colors.hem, ref: 'hem-color'})

const anim = builder.animation({ 
  custom: {
    molstar_trackball: {
      name: 'rock',
      params: { speed: 0.15 } 
    }
  }
})

const primitives = builder.primitives({
    label_attachment: 'middle-center',
    label_background_color: 'grey',

    custom: {
        molstar_markdown_commands: {
            'apply-snapshot': 'B' // go to second scene
        }
    }
});


primitives.label({
    position: [40,-20,90],
    text: 'Start Tour',
    label_size: 15.0,
    label_offset: 1.0   // Offset to avoid overlap with the residue  
  })