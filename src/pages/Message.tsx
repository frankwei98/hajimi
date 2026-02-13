import { useParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Loader2, AlertCircle, FileText, Calendar, ShieldCheck } from 'lucide-react';
import type { Id } from '../../convex/_generated/dataModel';

export function Message() {
  const { messageId } = useParams();
  
  // Fetch message from Convex
  const message = useQuery(api.messages.getMessage, { 
    messageId: messageId as Id<'message'>,
  });

  // Loading state
  if (message === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-gray-500 animate-pulse">正在从云端调取加密消息...</p>
      </div>
    );
  }

  // Not found state (404)
  if (message === null) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white shadow sm:rounded-lg overflow-hidden border-t-4 border-red-500">
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">未找到该消息</h2>
            <p className="text-gray-500 mb-6">
              抱歉，该消息可能已被删除，或者链接有误。
            </p>
            <a 
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              返回首页
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              已获取加密消息
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              消息已成功从数据库加载，请使用本地私钥进行解密。
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              创建时间: {new Date(message._creationTime).toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              ID: {messageId}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              密文 JSON 数据
            </label>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto font-mono text-xs leading-relaxed max-h-[500px]">
                {JSON.stringify(message, (key, value) => {
                  if (key.startsWith('_')) return undefined; // Hide Convex internal fields for display
                  return value;
                }, 2)}
              </pre>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  💡 <strong>提示：</strong> 这是一个长文分享链接。你可以复制上方的密文 JSON，前往「解密工坊」并使用你的私钥查看原始内容。
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              onClick={() => {
                const cleanData = JSON.stringify(message, (key, value) => {
                  if (key.startsWith('_')) return undefined;
                  return value;
                }, 2);
                navigator.clipboard.writeText(cleanData);
              }}
            >
              复制密文 JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
