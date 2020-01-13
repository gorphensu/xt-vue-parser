import { compileStyle } from './compileStyle'

// This is a post loader that handles scoped CSS transforms.
// Injected right before css-loader by the global pitcher (../pitch.js)
// for any <style scoped> selection requests initiated from within vue files.
export default function (source, hash) {
  // const query = qs.parse(this.resourceQuery.slice(1))
  const { code, map, errors } = compileStyle({
    source,
    // filename: this.resourcePath,
    id: `data-xt-id=${hash}`,
    map: false,
    scoped: true,
    // trim: true
  })
  if (errors.length) {
    return {
      code,
      error: errors[0]
    }
  } else {
    return {
      code,
      error: ''
    }
  }
}
