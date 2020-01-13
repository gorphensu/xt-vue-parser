var parser = require('../dist/index.js')

const code = `
<style>
 .idetestcomponent{
		border: 1px solid red
	}
.idetestcomponent .inner {
  color: yellow;
</style>

<script>
 window.Vue.extend({
  name: 'idetestcomponent',
  mixins: [window.XtWeb.UIEngine.UI.View],
  render(h) {
    const {code} = this.viewRule;
    return (
    	<div class="idetestcomponent">hello 我是二开控件，代码保存在ide喔，还支持jsx语法 code: {code}<br>
  			<div class="inner">inner</div>
  		</div>
    )
  }
})
</script>
`

const res = parser(code)
console.log('res', res)