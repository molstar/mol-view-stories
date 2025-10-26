## Geometrical primitives

Geometrical primitives can be added to the scene, such as spheres, lines, arrows, boxes, ellipses, meshes, labels, distance and angle measurements.

```js
struct
  .primitives({ opacity: 0.5 })
  .ellipsoid({
    center: { label_comp_id: 'HEC' },
    color: '#fcb094',
  })
  .ellipsoid({
    center: { label_comp_id: 'SWF' },
    color: '#b094fc',
  });

struct
  .primitives({ opacity: 1 })
  .distance({
    start: { label_comp_id: 'HEC' },
    end: { label_comp_id: 'SWF' },
    radius: 0.25,
    color: 'black',
    dash_length: 0.25,
    label_size: 3,
  });

```

[Documentation for primitives](https://molstar.org/mol-view-spec-docs/primitives/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
