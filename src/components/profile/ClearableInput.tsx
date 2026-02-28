import { XIcon } from "@phosphor-icons/react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type ClearableInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
};

export function ClearableInput({
  value,
  onChange,
  onClear,
  ...props
}: ClearableInputProps) {
  function handleClear() {
    if (onClear) {
      onClear();
    } else {
      onChange("");
    }
  }

  return (
    <InputGroup>
      <InputGroupInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            variant="ghost"
            size="icon-xs"
            onClick={handleClear}
            aria-label="Clear"
            className="cursor-pointer"
          >
            <XIcon size={14} />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}