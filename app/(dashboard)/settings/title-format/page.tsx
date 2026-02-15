'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { SortableItem } from '@/components/ui/SortableItem';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

// Definindo a estrutura de um item do formato de título
export interface TitleComponent {
  id: string;
  label: string;
  enabled: boolean;
}

interface TitleFormatConfig {
  components: TitleComponent[];
  useBrackets: boolean;
}


export default function TitleFormatPage() {
  const [components, setComponents] = useState<TitleComponent[]>([]);
  const [useBrackets, setUseBrackets] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/settings/title-format');
        if (!res.ok) throw new Error('Falha ao carregar configuração');
        const data: TitleFormatConfig = await res.json();
        setComponents(data.components);
        setUseBrackets(data.useBrackets);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  const toggleComponent = (id: string) => {
    setComponents(components.map(c => c.id === id ? {...c, enabled: !c.enabled} : c));
  };

  const generatePreview = () => {
    const example = {
        status: 'AO VIVO',
        channelName: 'CazéTV',
        eventName: 'Final da Copa',
        dateTime: '15/02 21:00',
        youtubePlaylist: 'Cortes'
    };
    
    const activeComponents = components.filter(c => c.enabled);
    if (activeComponents.length === 0) return 'Nenhum componente ativo.';
    
    let preview = activeComponents.map(c => {
        const text = example[c.id as keyof typeof example] || c.label;
        return useBrackets ? `[${text}]` : text;
    }).join(' ');
    
    return preview;
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const config: TitleFormatConfig = { components, useBrackets };
    
    const promise = fetch('/api/settings/title-format', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    toast.promise(promise, {
      loading: 'Salvando configuração...',
      success: 'Configuração salva com sucesso!',
      error: 'Falha ao salvar configuração.',
    });

    try {
      await promise;
    } catch (error) {
       // O toast já trata o erro
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Formato de Título</h1>
         <button 
            onClick={handleSaveChanges} 
            disabled={isSaving}
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
         >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Coluna de Configuração */}
        <div className="rounded-md border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Componentes e Ordem</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Arraste os itens para reordenar. Ative ou desative os componentes que aparecerão no título final.
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                {components.map(component => (
                  <SortableItem key={component.id} id={component.id}>
                    <div className='flex items-center justify-between w-full'>
                      <span className="font-medium">{component.label}</span>
                      <Switch
                        checked={component.enabled}
                        onCheckedChange={() => toggleComponent(component.id)}
                      />
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <hr className="my-6" />

          <div className="flex items-center space-x-2">
            <Switch id="use-brackets" checked={useBrackets} onCheckedChange={setUseBrackets} />
            <Label htmlFor="use-brackets">Usar marcadores [ ]</Label>
          </div>
        </div>

        {/* Coluna de Pré-visualização */}
        <div className="rounded-md border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Pré-visualização</h2>
           <div className="bg-muted p-4 rounded-md min-h-[60px]">
                <p className="font-mono text-sm break-all">{generatePreview()}</p>
           </div>
           <p className="text-xs text-muted-foreground mt-2">
             Nota: A playlist do YouTube só aparecerá se a informação estiver disponível na API para o evento específico.
           </p>
        </div>
      </div>
    </div>
  );
}
