import { PRESET_MODELS } from '@domain'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
  disabled?: boolean
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-7 w-45 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRESET_MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id} className="text-xs">
            {model.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
