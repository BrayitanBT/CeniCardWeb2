import * as IoIcons from 'react-icons/io5'

function toPascalCase(name) {
  return name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
}

export function renderIcon(iconName, size = 24) {
  if (!iconName) return null
  const componentName = `Io${toPascalCase(iconName)}`
  const Icon = IoIcons[componentName]
  if (!Icon) return null
  return <Icon size={size} />
}
