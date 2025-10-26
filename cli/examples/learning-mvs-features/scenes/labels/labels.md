## Labels

3D labels can be added to parts of the structure.

```js
struct
  .component({ selector: { label_asym_id: 'A' } })
  .label({ text: 'Orange chain' });
struct
  .component({ selector: { label_asym_id: 'B' } })
  .label({ text: 'Blue chain' });
struct
  .component({ selector: { label_asym_id: 'C' } })
  .label({ text: 'Green chain' });
struct
  .component({ selector: { label_asym_id: 'D' } })
  .label({ text: 'Red chain' });
```

[Documentation for label](https://molstar.org/mol-view-spec-docs/tree-schema/#label)

[Documentation for selectors](https://molstar.org/mol-view-spec-docs/selectors/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
