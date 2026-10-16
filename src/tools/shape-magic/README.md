# Shape Magic thumbnails

The mark gallery and shape picker use committed WebP images. They do not create a renderer or compile shaders in the visitor's browser. Fill thumbnails still render the current mark when the materials gallery is open.

After changing presets, primitive definitions, or their rendering, regenerate the images before building:

```sh
npm run shape-magic:thumbs
```

This uses the same local Vite/Chrome workflow as `npm run shape-magic:swatches`. It requires Node 22 or newer and Chrome or Chromium. Set `CHROME_PATH` if the binary is not found automatically. The gallery generator uses SwiftShader to keep generation independent of the host GPU.

The command writes lossless images and a source-hash manifest to `public/assets/shape-magic`. Commit the generated files with the source change. Regular site builds copy these assets and do not launch Chrome. Mark thumbnails include both themes; shape icons retain their white silhouette.

To regenerate selected marks or icons, or reuse an existing dev server:

```sh
npm run shape-magic:thumbs -- --only m-bite,shape:circle
npm run shape-magic:thumbs -- --site http://localhost:5173
npm run shape-magic:thumbs -- --force
```

The preview awaits `prepareScene(scene, style)` before drawing so shader preparation can poll `KHR_parallel_shader_compile`. Synchronous drawing and field reads also compile a missing variant as a compatibility fallback. That fallback can block on drivers that compile synchronously.
