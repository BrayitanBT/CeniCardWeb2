export const formatearNombreCompleto = (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido) => {
  const segundoNombre = segundo_nombre ? ` ${segundo_nombre}` : ''
  const segundoApellido = segundo_apellido ? ` ${segundo_apellido}` : ''
  return `${primer_nombre}${segundoNombre} ${primer_apellido}${segundoApellido}`.trim()
}
