import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from './Input'
import { SearchInput } from './SearchInput'

const meta: Meta = {
  title: 'UI/Form',
}
export default meta

export const InputDefault: StoryObj<typeof Input> = {
  name: 'Input — default',
  render: () => <Input label="Naam" placeholder="Bijv. Loodgietersbedrijf Van der Meer" />,
}

export const InputWithHelper: StoryObj = {
  name: 'Input — met helper-tekst',
  render: () => (
    <Input
      label="Postcode"
      placeholder="1234 AB"
      helperText="Optioneel — om u nauwkeurig te tonen op de kaart"
    />
  ),
}

export const InputWithError: StoryObj = {
  name: 'Input — met fout',
  render: () => (
    <Input
      label="Telefoon"
      placeholder="06-12345678"
      defaultValue="06-INVALID"
      errorText="Vul een geldig Nederlands telefoonnummer in"
    />
  ),
}

export const SearchInputDefault: StoryObj = {
  name: 'SearchInput — vak + plaats',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <SearchInput />
    </div>
  ),
}
