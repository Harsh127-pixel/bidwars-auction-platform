<!-- FILE: frontend/src/components/MediaUpload.vue -->
<script setup>
import { ref } from 'vue'
import api from '../services/api'
import { useNotification } from '../services/notification'

const props = defineProps({
  modelValue: String,
  label: { type: String, default: 'Media' },
  accept: { type: String, default: 'image/*' },
  placeholder: { type: String, default: 'https://...' },
  mode: { type: String, default: 'image' } // 'image' or 'pdf'
})

const emit = defineEmits(['update:modelValue'])
const notification = useNotification()
const uploading = ref(false)
const inputMode = ref('upload') // 'upload' or 'link'
const fileInput = ref(null)

const handleFileUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  uploading.value = true
  try {
    const res = await api.post('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    emit('update:modelValue', res.data.url)
    notification.add('Uploaded successfully', 'success')
  } catch (err) {
    notification.add('Upload failed: ' + (err.response?.data?.error || err.message), 'error')
  } finally {
    uploading.value = false
  }
}

const clear = () => {
  emit('update:modelValue', '')
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="media-upload">
    <div class="d-flex align-center justify-space-between mb-2">
      <label class="field-label">{{ label }}</label>
      <div class="mode-toggle">
        <button type="button" :class="{ active: inputMode === 'upload' }" @click="inputMode = 'upload'">Upload</button>
        <button type="button" :class="{ active: inputMode === 'link' }" @click="inputMode = 'link'">Link</button>
      </div>
    </div>

    <div v-if="inputMode === 'upload'" class="upload-area" :class="{ 'has-file': modelValue }">
      <template v-if="!modelValue">
        <v-btn
          @click="fileInput.click()"
          :loading="uploading"
          variant="outlined"
          prepend-icon="mdi-upload"
          block
          class="upload-btn"
        >
          Choose {{ mode === 'image' ? 'Image' : 'File' }}
        </v-btn>
        <input
          ref="fileInput"
          type="file"
          :accept="accept"
          class="hidden"
          @change="handleFileUpload"
        />
      </template>
      <div v-else class="preview-wrap">
        <div v-if="mode === 'image'" class="image-preview">
          <img :src="modelValue" alt="Preview" />
          <div class="overlay">
            <v-btn icon="mdi-delete" color="error" size="small" @click="clear"></v-btn>
          </div>
        </div>
        <div v-else class="pdf-preview">
          <v-icon color="success">mdi-file-check</v-icon>
          <span class="text-truncate">{{ modelValue.split('/').pop() }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="clear"></v-btn>
        </div>
      </div>
    </div>

    <div v-else class="link-area">
      <div class="d-flex gap-2">
        <input
          :value="modelValue"
          @input="emit('update:modelValue', $event.target.value)"
          class="field"
          :placeholder="placeholder"
        />
        <v-btn v-if="modelValue" icon="mdi-close" variant="text" size="small" @click="clear" class="mt-1"></v-btn>
      </div>
      <div v-if="mode === 'image' && modelValue" class="mt-2 preview-mini">
        <img :src="modelValue" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.hidden { display: none; }
.mode-toggle { display: flex; background: var(--bg-raised); border-radius: 6px; padding: 2px; }
.mode-toggle button {
  font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 4px 8px;
  border-radius: 4px; border: none; background: transparent; color: var(--text-3); cursor: pointer;
}
.mode-toggle button.active { background: var(--gold); color: white; }

.upload-area {
  border: 1px dashed var(--border-md); border-radius: 8px; padding: 12px;
  display: flex; align-items: center; justify-content: center; min-height: 48px;
}
.upload-area.has-file { border-style: solid; border-color: var(--gold-border); background: var(--gold-dim); }

.preview-wrap { width: 100%; }
.image-preview { position: relative; width: 100%; height: 120px; border-radius: 6px; overflow: hidden; }
.image-preview img { width: 100%; height: 100%; object-fit: cover; }
.image-preview .overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s;
}
.image-preview:hover .overlay { opacity: 1; }

.pdf-preview { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-2); }

.preview-mini { height: 60px; border-radius: 4px; overflow: hidden; border: 1px solid var(--border); }
.preview-mini img { width: 100%; height: 100%; object-fit: cover; }

.upload-btn { text-transform: none; font-weight: 600; letter-spacing: 0; }
</style>
