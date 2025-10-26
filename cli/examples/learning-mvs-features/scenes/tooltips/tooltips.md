## Tooltips

Interactive tooltips can be added in a similar way.

Hover over the structure to display tooltips in the bottom right corner.

```js
struct
  .component({ selector: { label_asym_id: 'A' } })
  .tooltip({ text: 'Orange chain' });
struct
  .component({ selector: { label_asym_id: 'B' } })
  .tooltip({ text: 'Blue chain' });
struct
  .component({ selector: { label_asym_id: 'C' } })
  .tooltip({ text: 'Green chain' });
struct
  .component({ selector: { label_asym_id: 'D' } })
  .tooltip({ text: 'Red chain' });
```

[Documentation for tooltip](https://molstar.org/mol-view-spec-docs/tree-schema/#tooltip)

[Documentation for selectors](https://molstar.org/mol-view-spec-docs/selectors/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
