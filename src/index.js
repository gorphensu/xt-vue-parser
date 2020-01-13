import * as Babel from '@babel/standalone'
import vueBabelPresetJsx from '@vue/babel-preset-jsx'
import traverse from '@babel/traverse'
import styleCompile from './styleCompile-esm'

Babel.registerPreset('@vue/babel-preset-jsx', vueBabelPresetJsx)

const code = `
  <style>
  .idetestcomponent {
      border: 1px solid red
    }
  .idetestcomponent .inner {
    color: yellow;
  }
  </style>

  <script>
  window.Vue.extend({
    name: 'idetestcomponent',
    mixins: [window.XtWeb.UIEngine.UI.View],
    render(h) {
      const {code} = this.viewRule;
      return (
        <div class="idetestcomponent" data-xt-id="abccc">
          <span>hello world code: {code}</span>
          <div class="inner">inner
            <div>no class no value</div>
            <div class>has class no value</div>
            </div>
        </div>
      )
    }
  })
  </script>

`

const devideCode = (code) => {
  let scriptReg = new RegExp('(?<=<script(.)*?>)([\\s\\S](?!<script))*?(?=</script>)', 'i')
  let styleReg = new RegExp('(?<=<style(.)*?>)([\\s\\S](?!<style))*?(?=</style>)', 'i')
  let script = code.match(scriptReg)
  let style = code.match(styleReg)
  script = script && script[0] || ''
  style = style && style[0] || ''
  return {
    script,
    style
  }
}

const tranformJs = (code, hash) => {
  let res = Babel.transform(code, {
    ast: true,
    // sourceMap: 'inline',
    presets: [
      '@vue/babel-preset-jsx'
    ],
    plugins: [
    ],
    comments: false
  })
  const ast = res.ast
  const script = res.code

  const createXidNode = (hash) => {
    return {
      type: 'ObjectProperty',
      key: {
        type: 'StringLiteral',
        value: 'data-xt-id'
      },
      value: {
        type: 'StringLiteral',
        value: hash
      }
    }
  }

  const createAttrsNode = (hash) => {
    return {
      type: 'ObjectExpression',
      properties: [{
        type: 'ObjectProperty',
        key: {
          type: 'StringLiteral',
          value: 'attrs'
        },
        value: {
          type: 'ObjectExpression',
          properties: [createXidNode(hash)],
          // properties: []
        }
      }]
    }
  }

  const createAttrsProperty = (hash) => {
    return {
      type: 'ObjectProperty',
      key: {
        type: 'StringLiteral',
        value: 'attrs'
      },
      value: {
        type: 'ObjectExpression',
        properties: [createXidNode(hash)]
      }
    }
  }

  traverse(ast, {
    CallExpression({ node }) {
      if (node.callee.type === 'Identifier' && node.callee.name === 'h') {
        if (node.arguments) {
          // 判断第二个字段是不是 ObjectExpression
          if (node.arguments[1]) {
            if (node.arguments[1].type === 'ObjectExpression') {
              // 如有
              // 判断有没有Properties
              const properties = node.arguments[1].properties || []
              // 找出attrs
              let attrsProperty = properties.find(property => {
                return property.type === 'ObjectProperty' && property.key && property.key.value === 'attrs'
              })
              // 有attrs
              if (attrsProperty) {
                if (attrsProperty.value.type === 'ObjectExpression') {
                  const idProperty = (attrsProperty.value.properties || []).find(property => {
                    return property.type === 'ObjectProperty' && property.key && property.key.value === 'data-xt-id'
                  })
                  if (idProperty) {
                    if (idProperty.value && idProperty.value.value) {
                      idProperty.value.value = hash
                      if (idProperty.value.type === 'BooleanLiteral') {
                        idProperty.value.type = 'StringLiteral'
                        idProperty.value.value = hash
                      }
                    }
                  } else {
                    // 没有设置过值data-x-id的
                    properties.push(createXidNode(hash))
                  }
                }
              } else {
                properties.push(createAttrsProperty(hash))
              }
            } else {
              let attrsNode = createAttrsNode(hash)
              node.arguments.splice(1, 0, attrsNode)
            }
          } else {
            // 没有设置属性
            node.arguments[1] = createAttrsNode(hash)
          }
        }
      }
    }
  })
  res = Babel.transformFromAst(ast, null, {
    sourceMap: 'inline',
    presets: [
      '@vue/babel-preset-jsx'
    ],
    plugins: [
    ],
    comments: false
  })
  return res
}

const transformStyle = (code, hash) => {
  let res = styleCompile(code, hash)
  if (res.error) {
    console.error('transformStyle:::', res.error)
  }
  return res.code
  return code
}

const createStyleNode = (code) => {
  return  `
    ;(function(){
      let styleNode = document.createElement('style');
      styleNode.type = 'text/css';
      styleNode.innerHTML = ${JSON.stringify(code)};
      document.head.appendChild(styleNode);
    })();
  `
}

const createJsBlock = (code) => {
  return `
    ;${code};
  `
}

const transformModule = (code) => {
  let hash = Math.random().toString(36).substr(3, 16)
  let codeObj = devideCode(code)
  const scriptObj = tranformJs(codeObj.script, hash)
  const style = transformStyle(codeObj.style, hash)
  return {
    script: scriptObj.code,
    style
  }
}


export const execute = (code) => {
  let { script, style } = transformModule(code)
  return `
    ;${createStyleNode(style)};
    ;${createJsBlock(script)}
  `
}

// let runCode = execute(code)
// console.log('result', runCode)
export default execute