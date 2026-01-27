"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link as LinkIcon,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

import { Editor } from "@tiptap/react";

const MenuBar = ({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) => {
  if (!editor) return null;

  const toggleLink = () => {
    const url = window.prompt("Enter URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
  };

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-1 p-1 border-b bg-slate-50/50",
      disabled && "opacity-50 pointer-events-none"
    )}>
      <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("p-1.5 rounded-md hover:bg-slate-200 transition-colors", editor.isActive("bold") && "bg-slate-200 text-blue-600")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("p-1.5 rounded-md hover:bg-slate-200 transition-colors", editor.isActive("italic") && "bg-slate-200 text-blue-600")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn("p-1.5 rounded-md hover:bg-slate-200 transition-colors", editor.isActive("underline") && "bg-slate-200 text-blue-600")}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn("p-1.5 rounded-md hover:bg-slate-200 transition-colors", editor.isActive("heading", { level: 1 }) && "bg-slate-200 text-blue-600")}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn("p-1.5 rounded-md hover:bg-slate-200 transition-colors", editor.isActive("heading", { level: 2 }) && "bg-slate-200 text-blue-600")}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn("p-1.5 rounded-md hover:bg-slate-200 transition-colors", editor.isActive("blockquote") && "bg-slate-200 text-blue-600")}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("p-1.5 rounded-md hover:bg-slate-200 transition-colors", editor.isActive("bulletList") && "bg-slate-200 text-blue-600")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("p-1.5 rounded-md hover:bg-slate-200 transition-colors", editor.isActive("orderedList") && "bg-slate-200 text-blue-600")}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={cn("p-1.5 rounded-md hover:bg-slate-200 transition-colors", editor.isActive({ textAlign: "left" }) && "bg-slate-200 text-blue-600")}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={cn("p-1.5 rounded-md hover:bg-slate-200 transition-colors", editor.isActive({ textAlign: "center" }) && "bg-slate-200 text-blue-600")}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={cn("p-1.5 rounded-md hover:bg-slate-200 transition-colors", editor.isActive({ textAlign: "right" }) && "bg-slate-200 text-blue-600")}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-0.5 ml-auto">
        <button
          type="button"
          onClick={toggleLink}
          className={cn("p-1.5 rounded-md hover:bg-slate-200 transition-colors", editor.isActive("link") && "bg-slate-200 text-blue-600")}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-30"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-30"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export function RichTextEditor({ value, onChange, placeholder, disabled, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: placeholder || "Tulis di sini...",
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[150px] p-4",
          disabled && "bg-slate-50 text-muted-foreground"
        ),
      },
    },
  });

  // Update content when value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className={cn(
      "relative rounded-xl border bg-white shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all",
      disabled && "bg-slate-50 border-slate-200",
      className
    )}>
      <MenuBar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} />
      
      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #e2e8f0;
          padding-left: 1rem;
          font-style: italic;
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
