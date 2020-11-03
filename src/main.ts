import { Array, Static, String } from 'runtypes'

import defaults from './defaults'

/**
 * Toggler configuration.
 */
let configuration: ToggleConfiguration | undefined

nova.commands.register('toggler.toggle', () => {
  loadConfiguration()
})

/**
 * Loads the configuration.
 */
function loadConfiguration() {
  if (configuration) {
    return
  }

  const useDefaultToggles = nova.config.get('toggler.useDefaultToggles', 'boolean') ?? true

  let customToggles: ToggleConfiguration = []
  const customTogglesStr = nova.config.get('toggler.toggles', 'string') ?? '[]'

  try {
    const parsedCustomToggles: unknown = JSON.parse(customTogglesStr)

    customToggles = ToggleConfiguration.check(parsedCustomToggles)
  } catch (error) {
    // TODO
    console.log('error ', error)
  }

  configuration = useDefaultToggles ? customToggles.concat(defaults) : customToggles
}

/**
 * Toggle types.
 */
const Toggle = Array(String)
type Toggle = Static<typeof Toggle>

const ToggleConfiguration = Array(Toggle)
type ToggleConfiguration = Static<typeof ToggleConfiguration>
