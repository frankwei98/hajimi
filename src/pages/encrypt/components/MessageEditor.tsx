import { Type, FileText } from 'lucide-react';

interface MessageEditorProps {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  titleLimit: number;
  contentLimit: number;
}

export function MessageEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  titleLimit,
  contentLimit,
}: MessageEditorProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <Type className="w-4 h-4" />
          标题
        </label>
        <div className="relative mt-1">
          <input
            type="text"
            id="title"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border pr-16"
            placeholder="例如：周五会议纪要"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className={`text-xs ${title.length >= titleLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {title.length}/{titleLimit}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
          <FileText className="w-4 h-4" />
          内容
        </label>
        <div className="relative mt-1">
          <textarea
            id="content"
            rows={10}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border pb-8"
            placeholder="在此输入需要加密的敏感内容..."
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
          />
          <div className="absolute bottom-2 right-3 pointer-events-none">
            <span className={`text-xs ${content.length >= contentLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {content.length}/{contentLimit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
