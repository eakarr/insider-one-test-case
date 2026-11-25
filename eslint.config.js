import skipFormattingConfig from '@vue/eslint-config-prettier/skip-formatting'
import { vueTsConfigs, withVueTs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'

export default withVueTs(
  {
    name: 'app/ignores',
    ignores: ['.yarn/**', 'coverage/**', 'dist/**', 'playwright-report/**', 'test-results/**'],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    name: 'app/component-names',
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  skipFormattingConfig,
)
