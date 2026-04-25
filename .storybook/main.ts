import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { StorybookConfig } from '@storybook/react-vite'

const here = dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(ts|tsx|mdx)', '../docs/storybook/**/*.mdx'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    check: false,
  },
  // Stub Next.js-only modules zodat shared components (Header, Footer) ook
  // in Storybook (Vite) werken. Productie blijft de echte next/link gebruiken.
  viteFinal: async (vConfig) => {
    vConfig.resolve = vConfig.resolve ?? {}
    vConfig.resolve.alias = {
      ...vConfig.resolve.alias,
      'next/link': resolve(here, './next-link-stub.tsx'),
    }
    return vConfig
  },
}

export default config
