import postcss from 'postcss'
import trim_1 from '@vue/component-compiler-utils/dist/stylePlugins/trim'
import scoped_1 from '@vue/component-compiler-utils/dist/stylePlugins/scoped'


// const styleProcessors_1 = require("./styleProcessors");
export function compileStyle(options) {
    return doCompileStyle(Object.assign(Object.assign({}, options), { isAsync: false }));
}
export function compileStyleAsync(options) {
    return Promise.resolve(doCompileStyle(Object.assign(Object.assign({}, options), { isAsync: true })));
}
export function doCompileStyle(options) {
    const { filename, id, scoped = true, trim = true, postcssOptions, postcssPlugins } = options;
    const map = options.map;
    const source = options.source;
    const plugins = (postcssPlugins || []).slice();
    if (trim) {
        plugins.push(trim_1());
    }
    if (scoped) {
        plugins.push(scoped_1(id));
    }
    const postCSSOptions = Object.assign(Object.assign({}, postcssOptions), { to: filename, from: filename });
    if (map) {
        postCSSOptions.map = {
            inline: false,
            annotation: false,
            prev: map
        };
    }
    let result, code, outMap;
    const errors = [];
    try {
        result = postcss(plugins).process(source, postCSSOptions);
        // In async mode, return a promise.
        if (options.isAsync) {
            return result
                .then((result) => ({
                code: result.css || '',
                map: result.map && result.map.toJSON(),
                errors,
                rawResult: result
            }))
                .catch((error) => ({
                code: '',
                map: undefined,
                errors: [...errors, error.message],
                rawResult: undefined
            }));
        }
        // force synchronous transform (we know we only have sync plugins)
        code = result.css;
        outMap = result.map;
    }
    catch (e) {
        errors.push(e);
    }
    return {
        code: code || ``,
        map: outMap && outMap.toJSON(),
        errors,
        rawResult: result
    };
}
