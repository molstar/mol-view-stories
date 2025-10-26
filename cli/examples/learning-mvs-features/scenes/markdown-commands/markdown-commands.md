## Stories

### Markdown commands

Markdown description can also contain special commands to highlight or focus parts of the scene, adjust camera, control playback, play audio etc., like this:

---

Molecules:

- [Cytochrome P450 2C9](!highlight-refs=polymer&focus-refs=polymer)
- [Heme C](!highlight-refs=hec&focus-refs=hec)
- [S-warfarin](!highlight-refs=swf&focus-refs=swf)

---

MolViewSpec code:

```js
const polymer = struct
  .component({ ref: 'polymer', selector: 'polymer' })
  .representation({ type: 'cartoon' });
const ligandHEC = struct
  .component({ ref: 'hec', selector: { label_comp_id: 'HEC' } })
  .representation({ type: 'spacefill' })
  .color({ color: '#ffce2d' });
const ligandSWF = struct
  .component({ ref: 'swf', selector: { label_comp_id: 'SWF' } })
  .representation({ type: 'spacefill' })
  .color({ color: '#2d5eff' });
  
const snapshotC = builder.getSnapshot({
  key: 'snapshot_C',
  title: 'Snapshot C',
  description:
    'Molecules:\n\n' + 
    + '- [Cytochrome P450 2C9](!highlight-refs=polymer&focus-refs=polymer)\n'
    + '- [Heme C](!highlight-refs=hec&focus-refs=hec)\n'
    + '- [S-warfarin](!highlight-refs=swf&focus-refs=swf)\n',
  linger_duration_ms: 5000,
  transition_duration_ms: 1000,
});
```

[Documentation for markdown extensions](https://molstar.org/docs/plugin/managers/markdown-extensions/)

---

[&#x2B05; Back to *Basic workflow*](#intro)
