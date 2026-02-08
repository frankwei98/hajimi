import { useParams } from 'react-router-dom';

export function Message() {
  const { messageId } = useParams();

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">📖 长文分享</h2>
      <p className="text-gray-500 mb-4">
        消息 ID: {messageId}
      </p>
      <div className="border-t border-gray-200 pt-4">
        <div className="bg-gray-50 p-4 rounded-md text-center text-gray-400">
          UI 开发中...
        </div>
      </div>
    </div>
  );
}
