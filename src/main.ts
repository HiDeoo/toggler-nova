import defaults from './defaults'

/**
 * Toggler configuration.
 */
let configuration: ToggleConfiguration[] | undefined

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

  let customToggles: ToggleConfiguration[] = []
  const customTogglesStr = nova.config.get('toggler.toggles', 'string') ?? '[]'

  try {
    // TODO Validate & type this
    customToggles = JSON.parse(customTogglesStr) as string[][]
  } catch (error) {
    // TODO
    console.log('error ', error)
  }

  configuration = useDefaultToggles ? customToggles.concat(defaults) : customToggles
}

/**
 * Toggle configuration.
 */
type ToggleConfiguration = string[]
