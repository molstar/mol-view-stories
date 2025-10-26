## Stories

Interactive stories are created by adding multiple MolViewSpec views (snapshots) and specifying duration for individual views and for transitions between views.

MolViewSpec code:

```js
const snapshotA = builder.getSnapshot({
  key: 'snapshot_A',
  title: 'Snapshot A',
  description: 'This is Snapshot A.',
  linger_duration_ms: 5000,
  transition_duration_ms: 1000,
});
```

In the MolViewStories builder UI, these values can be specified in the *Scene Options* tab.

---

[&#x2B05; Back to *Basic workflow*](#intro)
