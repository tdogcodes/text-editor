'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { ScrollArea } from '../../components/ui/scroll-area';
import Link from 'next/link';
import { cn } from '../../lib/utils'; // Assuming you have a cn utility

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

export default function ViewPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedData = localStorage.getItem('columnData');
    if (savedData) {
      try {
        const parsedData: Block[] = JSON.parse(savedData);
         // Filter out empty text blocks unless it's the only block
        const filteredData = parsedData.filter((block, index, arr) => {
            if (block.type === 'text' && block.content.trim() === '') {
                // Keep if it's the only block OR if the next block is also text and empty (avoids removing multiple empty lines)
                // Or more simply, just remove all truly empty text blocks unless it's the *only* thing present
                 return arr.length === 1;
             }
            return true;
        });
        setBlocks(filteredData);
      } catch (error) {
        console.error("Error parsing column data:", error);
        // Handle error, maybe show a message to the user
      }
    }
    setIsLoading(false);
  }, []);

  const renderBlock = (block: Block) => {
    const styleProps: React.CSSProperties = {
        fontSize: block.style?.fontSize ? `${block.style.fontSize}px` : undefined,
        color: block.style?.color,
        textAlign: block.style?.textAlign,
        fontWeight: block.style?.fontWeight,
        fontStyle: block.style?.fontStyle,
        textDecoration: block.style?.textDecoration,
        whiteSpace: 'pre-wrap', // Preserve whitespace and newlines
        wordBreak: 'break-word', // Prevent long words from overflowing
    };

    switch (block.type) {
        case 'text':
          const Tag = block.style?.format === 'h1' ? 'h1' :
                      block.style?.format === 'h2' ? 'h2' :
                      block.style?.format === 'h3' ? 'h3' :
                      block.style?.format === 'ul' ? 'li' : // Render as list item if 'ul' format
                      block.style?.format === 'code' ? 'pre' :
                      'p';

          const content = block.content;
          const className = cn(
             'my-2', // Add some default margin
             block.style?.format === 'h1' && 'text-3xl font-bold',
             block.style?.format === 'h2' && 'text-2xl font-semibold',
             block.style?.format === 'h3' && 'text-xl font-medium',
             block.style?.format === 'ul' && 'ml-6', // Indent list items
             block.style?.format === 'code' && 'font-mono bg-muted p-2 rounded text-sm', // Style code blocks
          );

           if (Tag === 'li') {
             // If it's a list item, wrap it in a ul if the previous wasn't ul, or just render the li
             const previousBlock = blocks[blocks.findIndex(b => b.id === block.id) - 1];
             const needsUlWrapper = !previousBlock || previousBlock.style?.format !== 'ul';
             return needsUlWrapper ? <ul className="list-disc pl-6"><Tag style={styleProps} className={className}>{content}</Tag></ul> : <Tag style={styleProps} className={className}>{content}</Tag>;
           }

          return <Tag style={styleProps} className={className}>{content}</Tag>;

        case 'image':
            return <img src={block.content} alt="User uploaded content" className="max-w-full h-auto rounded-md my-4" />;
        case 'divider':
            return <Separator className="my-6" />;
        case 'link':
            return (
                 <a href={block.url} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80 my-2 block break-words">
                    {block.content || block.url}
                 </a>
            );
        default:
            return null;
    }
};


  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading content...</div>;
  }

  if (!blocks || blocks.length === 0) {
    return (
        <div className="container mx-auto p-4 text-center">
            <p className="mb-4">No content found. Go back to edit.</p>
            <Link href="/">
                <Button variant="outline">Back to Editor</Button>
            </Link>
        </div>
    )
  }


  return (
    <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold">Generated Column</h1>
             <Link href="/">
                <Button variant="outline">Back to Editor</Button>
             </Link>
        </div>
        <ScrollArea className="h-[calc(100vh-150px)]">
         <div className="bg-card p-6 md:p-8 rounded-lg shadow-sm border max-w-3xl mx-auto">
            {blocks.map(block => (
                <div key={block.id}>{renderBlock(block)}</div>
            ))}
         </div>
        </ScrollArea>
    </div>
  );
}
