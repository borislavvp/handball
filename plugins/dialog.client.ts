// ================================
// plugins/dialog.client.ts
// ================================
import { reactive } from 'vue'

export default defineNuxtPlugin(() => {
  const state = reactive({
    open: false,
    type: 'alert', // 'alert' | 'confirm' | 'prompt'
    title: '',
    message: '',
    placeholder: '',
    defaultValue: '',
    okText: '',
    cancelText: '',
    resolve: null as null | ((value: any) => void),
    reject: null as null | (() => void)
  })

  const close = () => {
    state.open = false
  }

  const alert = (options: { title?: string; message?: string, okText?: string;  }) => {
    return new Promise<void>((resolve) => {
      Object.assign(state, {
        open: true,
        type: 'alert',
        title: options.title ?? 'Alert',
        message: options.message ?? '',
        okText: options.okText ?? 'OK',
        resolve
      })
    })
  }

  const confirm = (options: { title?: string; message?: string }) => {
    return new Promise<boolean>((resolve, reject) => {
      Object.assign(state, {
        open: true,
        type: 'confirm',
        title: options.title ?? 'Confirm',
        message: options.message ?? '',
        resolve,
        reject
      })
    })
  }

  const prompt = (options: {
    title?: string
    message?: string
    placeholder?: string
    defaultValue?: string
  }) => {
    return new Promise<string | null>((resolve, reject) => {
      Object.assign(state, {
        open: true,
        type: 'prompt',
        title: options.title ?? 'Prompt',
        message: options.message ?? '',
        placeholder: options.placeholder ?? '',
        defaultValue: options.defaultValue ?? '',
        resolve,
        reject
      })
    })
  }

  const dialog = {
    state,
    alert,
    confirm,
    prompt,
    close
  }

  return {
    provide: {
      dialog
    }
  }
})