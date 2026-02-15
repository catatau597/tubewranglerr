'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export function SortableItem(props: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center gap-4 bg-muted p-3 rounded-md border touch-none"
    >
      <button 
        {...attributes} 
        {...listeners} 
        className="cursor-grab"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      {props.children}
    </div>
  );
}
