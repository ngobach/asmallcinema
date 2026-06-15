import { defineConfig, presetUno, presetAttributify } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(), // Tailwind CSS compatible preset
    presetAttributify(), // Optional, allows using css attributes directly
  ],
});
