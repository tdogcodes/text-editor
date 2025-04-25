'use client';

import type React from 'react';
import { useState, useCallback, useRef } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  Minus,
  Palette,
  Strikethrough,
  Underline,
  Upload,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { useRouter } from 'next/navigation';
import { toast } from '../hooks/use-toast';
import { cn } from '../lib/utils'; // Import the cn function


interface Block {
  id: string;
  type: 'text' | 'image' | 'divider' | 'link';
  content: string;
  style?: {
    fontSize?: number;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline' | 'line-through';
    format?: 'p' | 'h1' | 'h2' | 'h3' | 'ul' | 'code';
  };
  url?: string; // For link type
}

export function TextColumnEditor() {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: crypto.randomUUID(), type: 'text', content: '', style: { fontSize: 16, color: '#000000', textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', format: 'p'} },
  ]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(blocks[0]?.id ?? null); // Select first block initially
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getBlockById = (id: string): Block | undefined => blocks.find(b => b.id === id);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      )
    );
  }, []);

   const updateBlockStyle = useCallback((id: string, styleUpdates: Partial<Block['style']>) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) => {
        if (block.id === id && block.type === 'text') {
           const currentStyle = block.style || { fontSize: 16, color: '#000000', textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', format: 'p' };
           return { ...block, style: { ...currentStyle, ...styleUpdates } };
        }
        return block;
      })
    );
  }, []);

  const addBlock = useCallback((type: Block['type'], content: string = '', style?: Block['style'], url?: string) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      content,
      style: type === 'text' ? (style || { fontSize: 16, color: '#000000', textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', format: 'p'}) : undefined,
      url: type === 'link' ? url : undefined,
    };
    setBlocks((prevBlocks) => {
      const currentIndex = prevBlocks.findIndex(b => b.id === selectedBlockId);
      const newBlocks = [...prevBlocks];
      if (currentIndex !== -1) {
        newBlocks.splice(currentIndex + 1, 0, newBlock);
      } else {
        newBlocks.push(newBlock);
      }
       // Add a new empty text block after adding non-text blocks for continued typing
       if (type !== 'text') {
         const emptyTextBlock: Block = { id: crypto.randomUUID(), type: 'text', content: '', style: { fontSize: 16, color: '#000000', textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', format: 'p' } };
         if (currentIndex !== -1) {
           newBlocks.splice(currentIndex + 2, 0, emptyTextBlock);
         } else {
            newBlocks.push(emptyTextBlock);
         }
          // Select the new empty text block after inserting a non-text block
          setSelectedBlockId(emptyTextBlock.id);
          return newBlocks;
       }
       // Select the newly added text block
       setSelectedBlockId(newBlock.id);
       return newBlocks;
    });
  }, [selectedBlockId]);

   const handleTextChange = (id: string, newContent: string) => {
     updateBlock(id, { content: newContent });
   };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>, id: string) => {
     if (event.key === 'Enter' && !event.shiftKey) {
       event.preventDefault();
       const currentBlock = getBlockById(id);
       addBlock('text', '', currentBlock?.style);
     }
   };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
         addBlock('image', base64String);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
   };

   const triggerImageUpload = () => {
     fileInputRef.current?.click();
   };


  const handleSubmit = () => {
    // Filter out empty text blocks before saving, unless it's the only block
    const blocksToSave = blocks.filter((block, index, arr) => {
        if (block.type === 'text' && block.content.trim() === '') {
            return arr.length === 1; // Keep if it's the only block
        }
        return true;
    });

    if (blocksToSave.length === 0 && blocks.length > 0) {
      // If filtering results in no blocks, but there was initial content (even if just empty lines)
      // ensure at least one empty block is saved to avoid errors on the view page
      localStorage.setItem('columnData', JSON.stringify([{ id: crypto.randomUUID(), type: 'text', content: '', style: { fontSize: 16, color: '#000000', textAlign: 'left', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', format: 'p'} }]));
    } else {
       localStorage.setItem('columnData', JSON.stringify(blocksToSave));
    }

    router.push('/view');
    toast({
      title: "Content Saved",
      description: "Your column content has been saved and the view page is ready.",
    });
  };

  const selectedBlock = selectedBlockId ? getBlockById(selectedBlockId) : null;

  const StyleButton = ({ icon: Icon, styleKey, value, activeValue, defaultValue }: { icon: React.ElementType, styleKey: keyof NonNullable<Block['style']>, value: any, activeValue: any, defaultValue?: any }) => (
     <Button
       variant={activeValue === value ? 'secondary' : 'ghost'}
       size="icon"
       onClick={() => selectedBlockId && updateBlockStyle(selectedBlockId, { [styleKey]: activeValue === value ? defaultValue : value })}
       disabled={!selectedBlockId || selectedBlock?.type !== 'text'}
       className="h-8 w-8"
       aria-label={`Toggle ${styleKey} ${value}`}
     >
       <Icon className="h-4 w-4" />
     </Button>
   );

    const FormatButton = ({ icon: Icon, format }: { icon: React.ElementType, format: NonNullable<Block['style']>['format'] }) => (
    <Button
      variant={selectedBlock?.style?.format === format ? 'secondary' : 'ghost'}
      size="icon"
      onClick={() => selectedBlockId && updateBlockStyle(selectedBlockId, { format: selectedBlock?.style?.format === format ? 'p' : format })} // Toggle back to 'p'
      disabled={!selectedBlockId || selectedBlock?.type !== 'text'}
      className="h-8 w-8"
      aria-label={`Set format to ${format}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );


  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="flex-1 w-full md:max-w-3xl mx-auto">
        <ScrollArea className="h-[calc(100vh-200px)] border rounded-md p-4 shadow-sm bg-card">
          <div className="space-y-2">
            {blocks.map((block) => (
              <div key={block.id} onClick={() => setSelectedBlockId(block.id)} className="relative group">
                 {/* Block specific rendering */}
                 {block.type === 'text' && (
                  <textarea
                    value={block.content}
                    onChange={(e) => handleTextChange(block.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, block.id)}
                    placeholder="Type something..."
                    className={cn(
                      'w-full p-2 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[40px] overflow-hidden block', // Ensure it's block for proper layout
                      block.style?.format === 'h1' && 'text-3xl font-bold',
                      block.style?.format === 'h2' && 'text-2xl font-semibold',
                      block.style?.format === 'h3' && 'text-xl font-medium',
                      block.style?.format === 'ul' && 'ml-6 list-item', // Use list-item for bullet point (requires parent ul implicitly or explicitly)
                      block.style?.format === 'code' && 'font-mono bg-muted p-2 rounded text-sm whitespace-pre', // Use whitespace-pre for code
                      selectedBlockId === block.id && 'ring-2 ring-primary'
                    )}
                    style={{
                      fontSize: `${block.style?.fontSize || 16}px`,
                      color: block.style?.color || 'hsl(var(--foreground))', // Use theme color
                      textAlign: block.style?.textAlign || 'left',
                      fontWeight: block.style?.fontWeight || 'normal',
                      fontStyle: block.style?.fontStyle || 'normal',
                      textDecoration: block.style?.textDecoration || 'none',
                      // Dynamically set list style type if format is 'ul'
                      listStyleType: block.style?.format === 'ul' ? 'disc' : 'none',
                      display: block.style?.format === 'ul' ? 'list-item' : 'block', // Crucial for list rendering
                    }}
                     // Auto-resize textarea height
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                    rows={1} // Start with one row
                    ref={el => { // Auto focus the selected block's textarea
                        if (el && selectedBlockId === block.id) {
                            // Check if element isn't already focused to prevent loops
                            if (document.activeElement !== el) {
                                const len = el.value.length;
                                // Delay focus slightly to ensure DOM is ready
                                setTimeout(() => el.setSelectionRange(len, len), 0);
                                setTimeout(() => el.focus(), 0);
                            }
                             // Also ensure textarea height is recalculated on focus/selection
                             el.style.height = 'auto';
                             el.style.height = `${el.scrollHeight}px`;
                        }
                    }}
                  />
                )}
                {block.type === 'image' && (
                   <div className={cn("my-2 relative", selectedBlockId === block.id && 'ring-2 ring-primary rounded-md')}>
                     <img src={block.content} alt="Uploaded content" className={'max-w-full h-auto rounded-md block'} />
                   </div>
                )}
                {block.type === 'divider' && (
                   <div className={cn("my-4 relative", selectedBlockId === block.id && 'ring-2 ring-primary rounded-md')}>
                     <Separator />
                   </div>
                )}
                 {block.type === 'link' && (
                   <div className={cn("my-2 relative", selectedBlockId === block.id && 'ring-2 ring-primary rounded-md p-1')}>
                     <a href={block.url?.startsWith('http') ? block.url : `https://${block.url}`} target="_blank" rel="noopener noreferrer" className={'text-primary underline hover:opacity-80 block break-words'}>
                       {block.content || block.url}
                     </a>
                   </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
         <div className="mt-4 flex justify-end">
          <Button onClick={handleSubmit}>Submit & View</Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="w-full md:w-64 sticky top-4 bg-card p-4 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Formatting</h3>
        <div className="space-y-4">
          {/* Text Formatting */}
           <div className="flex flex-wrap gap-1">
             <FormatButton icon={Heading1} format="h1" />
             <FormatButton icon={Heading2} format="h2" />
             <FormatButton icon={Heading3} format="h3" />
             <FormatButton icon={List} format="ul" />
             <FormatButton icon={Code} format="code" />
             <StyleButton icon={Bold} styleKey="fontWeight" value="bold" activeValue={selectedBlock?.style?.fontWeight} defaultValue="normal" />
             <StyleButton icon={Italic} styleKey="fontStyle" value="italic" activeValue={selectedBlock?.style?.fontStyle} defaultValue="normal" />
             <StyleButton icon={Underline} styleKey="textDecoration" value="underline" activeValue={selectedBlock?.style?.textDecoration} defaultValue="none"/>
              <StyleButton icon={Strikethrough} styleKey="textDecoration" value="line-through" activeValue={selectedBlock?.style?.textDecoration} defaultValue="none"/>
           </div>

           <div className="flex flex-wrap gap-1">
             <StyleButton icon={AlignLeft} styleKey="textAlign" value="left" activeValue={selectedBlock?.style?.textAlign} defaultValue="left"/>
             <StyleButton icon={AlignCenter} styleKey="textAlign" value="center" activeValue={selectedBlock?.style?.textAlign} defaultValue="left"/>
             <StyleButton icon={AlignRight} styleKey="textAlign" value="right" activeValue={selectedBlock?.style?.textAlign} defaultValue="left"/>
           </div>


          {/* Font Size */}
          <div>
            <label htmlFor="fontSizeSlider" className="text-sm font-medium mb-2 block">Font Size</label>
            <div className="flex items-center gap-2">
              <Slider
                id="fontSizeSlider"
                value={[selectedBlock?.style?.fontSize || 16]}
                onValueChange={(value) => selectedBlockId && updateBlockStyle(selectedBlockId, { fontSize: value[0] })}
                min={8}
                max={72}
                step={1}
                disabled={!selectedBlockId || selectedBlock?.type !== 'text'}
                aria-label="Font size"
              />
              <span className="text-sm w-8 text-right tabular-nums">{selectedBlock?.style?.fontSize || 16}px</span>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label htmlFor="colorPickerInput" className="text-sm font-medium mb-2 block">Color</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={!selectedBlockId || selectedBlock?.type !== 'text'}
                  aria-label="Select text color"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded border !bg-center !bg-cover transition-all"
                      style={{ background: selectedBlock?.style?.color || 'hsl(var(--foreground))' }} // Use theme color
                    ></div>
                    <div className="truncate flex-1">
                      {selectedBlock?.style?.color || 'Default'}
                    </div>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                 <input
                   id="colorPickerInput"
                   type="color"
                   value={selectedBlock?.style?.color || '#000000'} // Input needs hex
                   onChange={(e) => selectedBlockId && updateBlockStyle(selectedBlockId, { color: e.target.value })}
                   className="w-full h-10 border-none cursor-pointer p-0"
                   aria-label="Color picker"
                 />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Block Actions */}
          <div className="flex flex-wrap gap-2">
             <Button variant="outline" size="sm" onClick={triggerImageUpload} aria-label="Add image">
               <ImageIcon className="mr-2 h-4 w-4" /> Image
             </Button>
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
              aria-hidden="true"
             />
             <Button variant="outline" size="sm" onClick={() => {
                 const url = prompt("Enter link URL (e.g., https://example.com):");
                 if (url) {
                   const text = prompt("Enter link text (optional, defaults to URL):");
                   addBlock('link', text || url, undefined, url);
                 }
             }} aria-label="Add link">
               <LinkIcon className="mr-2 h-4 w-4" /> Link
             </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock('divider')} aria-label="Add divider">
              <Minus className="mr-2 h-4 w-4" /> Divider
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
