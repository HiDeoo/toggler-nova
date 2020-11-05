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
 * RegExp special characters.
 */
const RegExpCharacters = /[|\\{}()[\]^$+*?.]/g

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
nova.commands.register('toggler.toggle', (editor: TextEditor) => {
  loadConfiguration()

  toggle(editor)
})

/**
 * Triggered when the extension is activated.
 */
export function activate(): void {
  nova.config.onDidChange(TogglerConfiguration.Toggles, () => {
    loadConfiguration(true)
  })

  nova.config.onDidChange(TogglerConfiguration.UseDefaultToggles, () => {
    loadConfiguration(true)
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
function loadConfiguration(reload = false) {
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
    sendNotificationWithSettingsLink(
      'toggler-error-parse',
      'Could not parse custom toggles. Make sure to use the proper format in your Nova settings.'
    )
  }

  configuration = useDefaultToggles ? customToggles.concat(defaults) : customToggles
}

/**
 * Sends a notification including a button to open the extension settings.
 * @param id - The notification identifier.
 * @param body - The notification body text.
 */
async function sendNotificationWithSettingsLink(id: string, body: string) {
  const notificationRequest = new NotificationRequest(id)

  notificationRequest.title = 'Toggler'
  notificationRequest.body = body
  notificationRequest.actions = ['Ok', 'Open Settings']

  const { actionIdx } = await nova.notifications.add(notificationRequest)

  if (actionIdx === 1) {
    nova.openConfig()
  }
}

/**
 * Toggles words.
 * @param editor - The TextEditor instance.
 */
async function toggle(editor: TextEditor) {
  if (!TextEditor.isTextEditor(editor)) {
    return
  }

  let didFail = false

  await editor.edit((edit) => {
    editor.selectedRanges.forEach((range) => {
      const toggle = getToggle(editor, range)

      if (toggle.new) {
        edit.delete(toggle.range ?? range)
        edit.insert(toggle.range?.start ?? range.start, toggle.new)
      } else {
        didFail = true
      }
    })
  })

  if (didFail) {
    sendNotificationWithSettingsLink(
      'toggler-error-not-found',
      'Could not find a toggle. You can add one in your Nova settings.'
    )
  }
}

/**
 * Returns the result of a toggle operation.
 * @param  editor - The TextEditor instance.
 * @param  range - The range in the editor to find a toggle for.
 * @return The result of the toggle operation.
 */
function getToggle(editor: TextEditor, range: Range): ToggleResult {
  let lineText: string | undefined

  let word = editor.getTextInRange(range)
  const selected = word.length > 0

  const result: ToggleResult = {}

  if (!configuration) {
    return result
  }

  if (!selected) {
    const lineRange = editor.getLineRangeForRange(range)
    lineText = editor.getTextInRange(lineRange)
  }

  for (let i = 0; i < configuration.length; i++) {
    const words = configuration[i]

    for (let j = 0; j < words.length; j++) {
      const currentWord = words[j]
      const nextWordIndex = (j + 1) % words.length

      if (!selected && lineText) {
        const regexp = new RegExp(escapeStringRegExp(currentWord), 'ig')

        let match

        while ((match = regexp.exec(lineText)) !== null) {
          const matchRange = new Range(match.index, regexp.lastIndex)

          if (
            matchRange.containsRange(range) === true ||
            matchRange.start === range.start ||
            matchRange.end === range.start
          ) {
            word = match[0]

            result.range = matchRange

            break
          }
        }
      }

      const lowerCaseCurrentWord = currentWord.toLowerCase()

      if (word.toLowerCase() === lowerCaseCurrentWord) {
        if (word === lowerCaseCurrentWord) {
          result.new = words[nextWordIndex].toLowerCase()
        } else if (word === currentWord.toUpperCase()) {
          result.new = words[nextWordIndex].toUpperCase()
        } else if (word === capitalize(currentWord)) {
          result.new = capitalize(words[nextWordIndex])
        } else {
          result.new = words[nextWordIndex]
        }

        return result
      }
    }
  }

  return result
}

/**
 * Capitalizes a string.
 * @param  aString - The string to capitalize.
 * @return The capitalized string.
 */
function capitalize(aString: string) {
  return aString.charAt(0).toUpperCase() + aString.slice(1)
}

/**
 * Escapes RegExp special characters in a string.
 * @param  aString - The string to escape.
 * @return The escaped string.
 * @see https://github.com/sindresorhus/escape-string-regexp
 */
function escapeStringRegExp(aString: string) {
  return aString.replace(RegExpCharacters, '\\$&')
}

/**
 * Toggle types.
 */
const Toggle = Array(String)
type Toggle = Static<typeof Toggle>

const ToggleConfiguration = Array(Toggle)
type ToggleConfiguration = Static<typeof ToggleConfiguration>

type ToggleResult = {
  // Range of the toggled words when the toggle is based on a cursor position.
  range?: Range
  // The new word if any.
  new?: string
}
