export function formatEquipmentType(label: string) {
  return label.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}
