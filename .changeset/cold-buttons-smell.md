---
"yeoman-ui": patch
---

Fix yeoman-ui bug: run a generator and its composed sub-generators on a compatible yeoman-environment

Generators are now instantiated on the legacy yeoman-environment (v3) runtime first, falling back to the modern (v6)
runtime only when a generator can't run on v3. Because a generator and its composed sub-generators must share one
runtime, probing the lowest compatible version first keeps the whole composition on a runtime every generator
supports.
