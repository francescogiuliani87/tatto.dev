# Third-party notices

## Tact — offline Braille storybook generator

Source: https://github.com/thatsfaso/tact
License: MIT

The following code and assets in this project are ported/adapted from Tact:

- `src/lib/tact/braille.ts` — Grade 1 Braille translation for Italian and
  English (ported from `index.html` in the upstream repo).
- `src/lib/tact/stl.ts` — binary STL writer for a printable Braille page
  with a raised tactile illustration (ported from `index.html`).
- `src/lib/tact/shapes.ts` — shape keyword-matching tables
  (ported from `index.html`).
- `public/tact-shapes/**` — the ~90 hand-drawn tactile shape SVGs and their
  `index.json` manifest (copied unchanged from `shapes/` in the upstream repo).

```
MIT License

Copyright (c) thatsfaso and Tact contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
