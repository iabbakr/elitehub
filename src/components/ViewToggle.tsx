
'use client';

import { Button } from './ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, setViewMode }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-md bg-muted p-1">
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => setViewMode('grid')}
        className="h-8 w-8"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => setViewMode('list')}
        className="h-8 w-8"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
}
