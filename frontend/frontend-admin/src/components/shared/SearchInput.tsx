import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  className,
  debounceMs = 300,
}: SearchInputProps) {
  const [internal, setInternal] = useState(value);

  // Sync external value → internal
  useEffect(() => {
    setInternal(value);
  }, [value]);

  // Debounce internal → external
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(internal);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [internal, debounceMs, onChange]);

  return (
    <div className={cn("relative w-full md:w-48 md:focus-within:w-72 transition-all duration-300 ease-in-out flex-none", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9 rounded-[8px] w-full"
      />
      {internal && (
        <button
          type="button"
          onClick={() => {
            setInternal("");
            onChange("");
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
