import { Array, Static, String } from 'runtypes'

import defaults from './defaults'

/**
 * Toggler configuration keys.
 */
enum TogglerConfiguration {
  Toggles = 'toggler.toggles',
  UseDefaultToggles = 'toggler.useDefaultToggles',
}

/**
 * Toggler configuration.
 */
let configuration: ToggleConfiguration | undefined

/**
 * Event listeners used to listen to configuration changes.
 */
const configurationListeners: Disposable[] = []

/**
 * Toggle command.
 */
nova.commands.register('toggler.toggle', () => {
  void loadConfiguration()
})

/**
 * Triggered when the extension is activated.
 */
export function activate(): void {
  nova.config.onDidChange(TogglerConfiguration.Toggles, () => {
    void loadConfiguration(true)
  })

  nova.config.onDidChange(TogglerConfiguration.UseDefaultToggles, () => {
    void loadConfiguration(true)
  })
}

/**
 * Triggered when the extension is deactivated.
 */
export function deactivate(): void {
  configurationListeners.forEach((listener) => {
    listener.dispose()
  })
}

/**
 * Loads the configuration.
 * @param reload - Defines if the configuration should be reloaded or not.
 */
async function loadConfiguration(reload = false) {
  if (configuration && !reload) {
    return
  }

  const useDefaultToggles = nova.config.get(TogglerConfiguration.UseDefaultToggles, 'boolean') ?? true

  let customToggles: ToggleConfiguration = []
  const customTogglesStr = nova.config.get(TogglerConfiguration.Toggles, 'string') ?? '[]'

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
