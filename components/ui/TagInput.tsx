'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  initialTags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagInput({ initialTags, onTagsChange, disabled }: TagInputProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        onTagsChange(newTags);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    onTagsChange(newTags);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background p-2">
      {tags.map((tag) => (
        <div key={tag} className="flex items-center gap-1 bg-muted text-muted-foreground rounded px-2 py-1 text-sm">
          <span>{tag}</span>
          <button onClick={() => removeTag(tag)} disabled={disabled} className="rounded-full hover:bg-muted-foreground/20 disabled:opacity-50">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Adicione e pressione Enter..."
        disabled={disabled}
        className="flex-1 bg-transparent p-1 text-sm outline-none"
      />
    </div>
  );
}
