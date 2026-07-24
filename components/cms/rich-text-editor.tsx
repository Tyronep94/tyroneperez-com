"use client";

import { useEffect } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import type { RichTextNode } from "@/types/cms";

type Props = {
  value: RichTextNode;
  onChange: (value: RichTextNode) => void;
};

export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false }),
      Image.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Youtube.configure({ controls: true, nocookie: true }),
    ],
    content: value,
    editorProps: { attributes: { class: "cms-editor__surface", "aria-label": "Page content" } },
    onUpdate: ({ editor: instance }) => onChange(instance.getJSON() as RichTextNode),
  });

  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) editor.commands.setContent(value);
  }, [editor, value]);

  if (!editor) return <div className="cms-editor__loading">Loading editor…</div>;

  const promptLink = () => {
    const href = window.prompt("Link URL");
    if (href) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };
  const promptImage = () => {
    const src = window.prompt("Image URL");
    if (src) editor.chain().focus().setImage({ src }).run();
  };
  const promptVideo = () => {
    const src = window.prompt("YouTube URL");
    if (src) editor.chain().focus().setYoutubeVideo({ src }).run();
  };

  return (
    <div className="cms-editor">
      <div className="cms-editor__toolbar" role="toolbar" aria-label="Content formatting">
        <button type="button" className={editor.isActive("heading", { level: 2 }) ? "active" : ""} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className={editor.isActive("heading", { level: 3 }) ? "active" : ""} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <button type="button" className={editor.isActive("bold") ? "active" : ""} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></button>
        <button type="button" className={editor.isActive("italic") ? "active" : ""} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></button>
        <button type="button" onClick={promptLink}>Link</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}>List</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}>Rule</button>
        <button type="button" onClick={promptImage}>Image</button>
        <button type="button" onClick={promptVideo}>YouTube</button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code</button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
