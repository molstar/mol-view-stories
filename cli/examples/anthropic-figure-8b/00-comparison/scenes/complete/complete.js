builder.canvas({ background_color: '#ffffff' });
panels.forEach((p, i) => drawPanel(p, 'complete', (i - 1) * 360));
builder.camera({ target: [0, 58, 0], position: [0, 58, 1300], up: [0, 1, 0] });
