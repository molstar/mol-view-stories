## Camera and canvas settings

### Focus

Position and orientation of the camera can also be set with respect to a specific structure component.

```js
struct
  .component({ selector: { label_comp_id: 'SWF' } })
  .focus({ 
    direction: [0.71, 0, -0.71],
    up: [0, 1, 0],
    radius_factor: 1.2,
  });
```

[Documentation for camera and canvas settings](https://molstar.org/mol-view-spec-docs/camera-settings/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
