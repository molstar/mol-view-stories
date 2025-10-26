## Volumetric data

Volumetric data can be loaded in a variety of formats and displayed as isosurface or grid slice.

```js
builder
  .download({ url: 'https://www.ebi.ac.uk/pdbe/volume-server/x-ray/2e2o/box/0.936,-1.706,46.571/15.133,11.193,61.825?detail=3' })
  .parse({ format: 'bcif' })
  .volume({ channel_id: '2Fo-Fc' })
  .representation({
    type: 'isosurface',
    relative_isovalue: 1.5,
  })
  .color({ color: '#3362b2' })
  .opacity({ opacity: 0.4 });
```

[Documentation for volume](https://molstar.org/mol-view-spec-docs/volumes/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
