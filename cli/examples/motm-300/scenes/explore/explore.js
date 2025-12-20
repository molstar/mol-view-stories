builder.extendRootCustomState({
  molstar_on_load_markdown_commands: {
    'play-audio': 'mom300_part3.mp3',
  }
});

const struct = builder
        .download({ url: '6YKM.bcif' })
        .parse({ format: 'bcif' })
        .modelStructure();
//motA
//motB
//aspartate seletion

struct
  .component({ ref: 'asp', selector: [{ label_asym_id: 'F', label_seq_id: 22 }, { label_asym_id: 'G', label_seq_id: 22 }] })
  .representation({ ref: 'D22', type: 'spacefill', custom: { molstar_representation_params: { emissive: 0.0, sizeFactor: 2.00 } } })
  .color({ color: 'white' });

struct
  .component({ref:'mota', selector: [{label_asym_id:'A'},
  {label_asym_id:'B'},{label_asym_id:'C'},{label_asym_id:'D'},{label_asym_id:'E'}] })
  .transform({ref:'motatr'})
  .representation({ ref: 'motA', type: 'backbone', custom: {molstar_representation_params: {emissive: 0.0, sizeFactor:0.50}}})
 .color(createChainColorTheme([16737896, 16744577]));

struct
  .component({ref:'motb', selector: [{label_asym_id:'F'},
  {label_asym_id:'G'}] })
  .representation({ ref: 'motB', type: 'backbone', custom: {molstar_representation_params: {emissive: 0.0, sizeFactor:2.00}}})
  .color(createChainColorTheme([16698727, 16757608]));

struct
  .primitives({
  label_attachment: 'middle-left',
  label_show_tether: true,
  label_tether_length: 2,
    label_background_color: '#FECD67',
})
  .label({
    position:  { label_asym_id: 'G', label_seq_id: 55 },  //[111.3, 60.0, 126.3],
    text: 'MotB',
    label_size: 10.0,
    label_offset: 2.0
  })

struct.primitives({
  label_attachment: 'middle-left',
  label_show_tether: true,
  label_tether_length: 2,
  label_background_color: '#FF6668',
})
  .label({
    position: 
      { label_asym_id: 'B', label_seq_id: 72 }, //[97.7, 77.5, 156.8], 
    text: 'MotA',
    label_size: 10.0,
    label_offset: 2.0
  })

struct.primitives({
  label_attachment: 'middle-left',
  label_show_tether: true,
  label_tether_length: 3,
  label_background_color: 'grey',
})
  .label({
    position: { label_asym_id: 'F', label_seq_id: 22 }, 
    text: 'aspartate',
    label_size: 10.0,
    label_offset: 2.0
  })

builder.primitives({
  label_background_color: 'black',
  snapshot_key: 'start',
}).label({
  ref:'next',
  position: [-258.9, -138.0, 0],
  text: 'Go back to Start',
  label_size: 10.0,
  label_offset: 2.0
});

//rotate motB arround motB
const anim = builder.animation({});
// (-258.40, -77.74, -5.04)
const axis = Vec3.create(0,0,1);
const r11 = Mat3.fromRotation(Mat3.zero(), 0, axis);
const r22 = Mat3.fromRotation(Mat3.zero(), Math.PI, axis);

anim.interpolate({
  kind: 'transform_matrix',
  target_ref: 'motatr',
  property: 'matrix',
  pivot: [-258.40, -77.74, -5.04], // is that local ?
  translation_start: [-258.40, -77.74, -5.04],
  rotation_end: r11,
  rotation_start: r22,
  duration_ms: 60000,
  start_ms: 14000,
  rotation_frequency: 10,
}); 

anim.interpolate(makeEmissivePulse('motA', 10000, 6000, 6));
anim.interpolate(makeEmissivePulse('motB', 16000, 6000, 6));
anim.interpolate(makeEmissivePulse('D22', 22000, 6000, 6));

// anim.interpolate(makeEmissivePulse('cringrep2', 48000, 6000, 6));
anim.interpolate({
  kind: 'vec3',
  target_ref: 'next',
  duration_ms: 200,
  start_ms: 60000,
  property: 'position',
  start: [-258.9, -538.0, 0],
  end: [-258.9, -138.0, 0],
});
