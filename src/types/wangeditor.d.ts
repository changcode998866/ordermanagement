// 包内自带类型，但 package.json 的 exports 未声明 types 字段，bundler 解析模式下无法找到
declare module '@wangeditor/editor-for-vue' {
  import type { DefineComponent } from 'vue'
  import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

  export const Editor: DefineComponent<{
    modelValue?: string
    defaultConfig?: Partial<IEditorConfig>
    mode?: 'default' | 'simple'
    onOnCreated?: (editor: IDomEditor) => void
    'onUpdate:modelValue'?: (value: string) => void
  }>
  export const Toolbar: DefineComponent<{
    editor?: IDomEditor
    defaultConfig?: Partial<IToolbarConfig>
    mode?: 'default' | 'simple'
  }>
}
