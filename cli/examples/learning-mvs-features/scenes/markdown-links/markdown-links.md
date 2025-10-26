## Stories

### Markdown links

Markdown description can be added to each snapshot.

This description can contain links to other snapshots, like this:

--- 

This is **Snapshot B**.

[Go to Snapshot A](#snapshot_A).

---

MolViewSpec code:

```js
const snapshotB = builder.getSnapshot({
  key: 'snapshot_B',
  title: 'Snapshot B',
  description:
    'This is **Snapshot B**.\n\n'
    + '[Go to Snapshot A](#snapshot_A).',
  linger_duration_ms: 5000,
  transition_duration_ms: 1000,
});
```

---

[&#x2B05; Back to *Basic workflow*](#intro)
