import { Array, Static, String } from 'runtypes'

import defaults from './defaults'

/**
 * Toggler configuration.
 */
let configuration: ToggleConfiguration | undefined

nova.commands.register('toggler.toggle', () => {
  void loadConfiguration()
})

/**
 * Loads the configuration.
 */
async function loadConfiguration() {
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
    const notificationRequest = new NotificationRequest('toggler-custom-toggles')

    notificationRequest.title = 'Toggler'
    notificationRequest.body =
      'Could not parse custom toggles. Make sure to use the proper format in your Nova settings.'
    notificationRequest.actions = ['Ok', 'Open Settings']

    const { actionIdx } = await nova.notifications.add(notificationRequest)

    if (actionIdx === 1) {
      nova.openConfig()
    }
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
