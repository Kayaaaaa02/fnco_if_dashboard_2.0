import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Input } from '@/components/ui/input.jsx';
import { X, Filter } from 'lucide-react';

export default function FilterPanel({ filters = [], values = {}, onChange, onReset }) {
  const activeCount = Object.values(values).filter((v) => v && v !== 'all' && v !== '').length;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="size-4" />
        <span>필터</span>
        {activeCount > 0 && (
          <Badge variant="secondary" className="text-xs">{activeCount}</Badge>
        )}
      </div>

      {filters.map((filter) => {
        if (filter.type === 'select') {
          return (
            <div key={filter.key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{filter.label}</label>
              <Select
                value={values[filter.key] || filter.defaultValue || 'all'}
                onValueChange={(val) => onChange({ ...values, [filter.key]: val })}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        if (filter.type === 'text') {
          return (
            <div key={filter.key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{filter.label}</label>
              <Input
                value={values[filter.key] || ''}
                onChange={(e) => onChange({ ...values, [filter.key]: e.target.value })}
                placeholder={filter.placeholder || ''}
                className="w-[180px] h-9"
              />
            </div>
          );
        }
        return null;
      })}

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" className="h-9 gap-1 text-muted-foreground" onClick={onReset}>
          <X className="size-3" />
          초기화
        </Button>
      )}
    </div>
  );
}
