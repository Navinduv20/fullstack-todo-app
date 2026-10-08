import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  globalCss: {
    html: { colorPalette: 'brand' },
    body: { bg: 'canvas', color: 'navy' },
  },
  theme: {
    tokens: {
      colors: {
        navy: {
          DEFAULT: { value: '#1B2A4A' },
          600: { value: '#24365E' },
          500: { value: '#5A6785' },
        },
        canvas: { value: '#F8F8F6' },
        sky: {
          DEFAULT: { value: '#A8C5F0' },
          soft: { value: '#E9EFF8' },
        },
        ink: { value: '#2B5BA6' },
        surface: { value: '#FFFFFF' },
        line: { value: '#E5E7EB' },
        done: { value: '#6B7591' },
        danger: { value: '#C0392B' },
        success: { value: '#1F7A5C' },
      },
    },
    semanticTokens: {
      colors: {
        // _dark = inside the navy panels (<Theme appearance="dark">)
        fg: {
          DEFAULT: { value: { _light: '{colors.navy}', _dark: '{colors.surface}' } },
          muted: { value: { _light: '{colors.navy.500}', _dark: '{colors.line}' } },
          // danger red is unreadable on navy, so errors there use the sky accent
          error: { value: { _light: '{colors.danger}', _dark: '{colors.sky}' } },
        },
        bg: { panel: { value: '{colors.surface}' } },
        border: {
          DEFAULT: { value: { _light: '{colors.line}', _dark: '{colors.navy.500}' } },
          error: { value: { _light: '{colors.danger}', _dark: '{colors.sky}' } },
        },
        // toast colours
        red: { solid: { value: '{colors.danger}' } },
        green: { solid: { value: '{colors.success}' } },
        brand: {
          solid: { value: { _light: '{colors.navy.600}', _dark: '{colors.sky}' } },
          contrast: { value: { _light: '{colors.surface}', _dark: '{colors.navy}' } },
          fg: { value: { _light: '{colors.navy}', _dark: '{colors.surface}' } },
          muted: { value: { _light: '{colors.sky.soft}', _dark: '{colors.navy.600}' } },
          subtle: { value: { _light: '{colors.sky.soft}', _dark: '{colors.navy.600}' } },
          emphasized: { value: { _light: '{colors.sky}', _dark: '{colors.navy.500}' } },
          border: { value: { _light: '{colors.line}', _dark: '{colors.navy.500}' } },
          focusRing: { value: { _light: '{colors.ink}', _dark: '{colors.sky}' } },
        },
        // checkbox + progress bar
        accent: {
          solid: { value: '{colors.sky}' },
          contrast: { value: '{colors.navy}' },
          fg: { value: { _light: '{colors.ink}', _dark: '{colors.sky}' } },
          muted: { value: '{colors.sky.soft}' },
          subtle: { value: '{colors.sky.soft}' },
          emphasized: { value: '{colors.sky}' },
          border: { value: '{colors.sky}' },
          focusRing: { value: { _light: '{colors.ink}', _dark: '{colors.sky}' } },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
