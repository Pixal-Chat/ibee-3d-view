import { EditableTextField } from "~/components/ui/EditableTextField";

interface RackNameEditorProps {
  value: string;
  onSave: (name: string) => void;
}

export function RackNameEditor({ value, onSave }: RackNameEditorProps) {
  return <EditableTextField value={value} label="Rack name" onSave={onSave} />;
}
