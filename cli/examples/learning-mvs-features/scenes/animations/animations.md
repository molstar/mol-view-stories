## Animations

Animations can be added to a snapshot by specifying how the value of a property should be interpolated. Multiple properties can be interpolated within the animation.

```js
const ligandHEC = struct
  .component({ ref: 'hec', selector: { label_comp_id: 'HEC' } })
  .representation({ type: 'surface' })
  .color({ color: '#ffce2d', ref: 'hec_color' });

builder
  .animation({ include_camera: true })
  .interpolate({
    target_ref: 'hec_color',
    property: 'color',
    kind: 'color',
    start: '#ffce2d',
    end: '#008800',
    duration_ms: 20_000,
    easing: 'quad-in-out',
    alternate_direction: true,
    frequency: 20,
  })
```

[Documentation for animations](https://molstar.org/mol-view-spec-docs/animations/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
