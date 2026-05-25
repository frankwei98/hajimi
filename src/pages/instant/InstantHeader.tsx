export function InstantHeader() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-amber-900 mb-1">即用即走</h2>
      <p className="text-sm text-amber-700">
        打开即生成临时密钥，不落盘，不留存。适合临时接收密文或分享链接。
      </p>
      <p className="text-xs text-amber-600 mt-1">
        刷新页面后，临时私钥将丢失，届时无法再解密发给当前公钥的消息。
      </p>
    </div>
  );
}
