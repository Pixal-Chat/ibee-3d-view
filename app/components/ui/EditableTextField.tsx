import { useEffect, useState } from "react";

import { IconButton } from "~/components/ui/IconButton";

interface EditableTextFieldProps {
  value: string;
  label: string;
  onSave: (nextValue: string) => void;
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12.5 4.167L15.833 7.5M5 15l2.533-.211a2 2 0 001.197-.547l7.436-7.436a1.667 1.667 0 000-2.357l-.776-.776a1.667 1.667 0 00-2.357 0L5.598 11.109a2 2 0 00-.547 1.197L5 15z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EditableTextField({ value, label, onSave }: EditableTextFieldProps) {
  const [draft, setDraft] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function handleSave() {
    const trimmed = draft.trim();
    onSave(trimmed || value);
    setIsEditing(false);
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</label>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={handleSave}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSave();
            }

            if (event.key === "Escape") {
              setDraft(value);
              setIsEditing(false);
            }
          }}
          readOnly={!isEditing}
          className="h-11 w-full rounded-xl border border-outline bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-orange-200 read-only:bg-slate-50"
        />
        <IconButton
          icon={<PencilIcon />}
          label={isEditing ? "Save field" : "Edit field"}
          onClick={() => {
            if (isEditing) {
              handleSave();
              return;
            }

            setIsEditing(true);
          }}
          className={isEditing ? "border-primary text-primary" : undefined}
        />
      </div>
    </div>
  );
}
