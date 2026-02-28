import { useState } from "react";
import { XIcon } from "@phosphor-icons/react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { PREDEFINED_SKILLS } from "@/lib/constants";

const MAX_SKILLS = 15;

type SkillsPickerProps = {
  value: string[];
  onChange: (skills: string[]) => void;
};

export function SkillsPicker({ value, onChange }: SkillsPickerProps) {
  const [inputValue, setInputValue] = useState("");

  const atLimit = value.length >= MAX_SKILLS;

  const filtered = PREDEFINED_SKILLS.filter(
    (skill) =>
      !value.includes(skill) &&
      skill.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const trimmed = inputValue.trim();
  const predefinedSet = new Set<string>(PREDEFINED_SKILLS);
  const showCustomOption =
    trimmed &&
    !value.includes(trimmed) &&
    !predefinedSet.has(trimmed) &&
    !filtered.some((s) => s.toLowerCase() === trimmed.toLowerCase());

  function handleSelect(selected: string | null) {
    if (!selected || atLimit) return;
    if (!value.includes(selected)) {
      onChange([...value, selected]);
    }
    setInputValue("");
  }

  function removeSkill(skill: string) {
    onChange(value.filter((s) => s !== skill));
  }

  return (
    <div className="space-y-3">
      {/* Selected skills as chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((skill) => (
            <span
              key={skill}
              className="bg-muted-foreground/10 text-foreground flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-0.5 rounded-full p-0.5 opacity-50 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                <XIcon size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search combobox */}
      {!atLimit && (
        <Combobox
          value={null}
          onValueChange={handleSelect}
          inputValue={inputValue}
          onInputValueChange={setInputValue}
        >
          <ComboboxInput
            placeholder="Search or type a custom skill..."
            showTrigger={false}
          />
          <ComboboxContent>
            <ComboboxList>
              {filtered.map((skill) => (
                <ComboboxItem key={skill} value={skill}>
                  {skill}
                </ComboboxItem>
              ))}

              {showCustomOption && (
                <ComboboxItem value={trimmed}>
                  Add "{trimmed}"
                </ComboboxItem>
              )}

              <ComboboxEmpty>
                No matching skills. Type to add a custom one.
              </ComboboxEmpty>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      )}

      <p className="text-xs text-muted-foreground">
        {value.length}/{MAX_SKILLS} skills selected
      </p>
    </div>
  );
}