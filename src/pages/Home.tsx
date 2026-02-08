export function Home() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">没有人知道哈基米是什么意思</h1>
        <p className="text-lg text-gray-600 mb-4">
          下一代跨平台隐私通信协议 —— 让加密消息混入在普通对话中。
        </p>
        <div className="prose max-w-none text-gray-500">
          <p>
            哈基米是一个基于浏览器的端到端加密（E2EE）通信增强工具。它旨在解决传统社交软件无法保证绝对隐私、且 PGP 密文特征过于明显易被拦截/限流的问题。
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">现代加密</h3>
          <p className="text-gray-500">弃用臃肿的 PGP 体系，全面采用新思维去考虑实战问题。</p>
        </div>
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">抗风控混淆</h3>
          <p className="text-gray-500">支持将密文编码为 Emoji 或古诗词，规避社交平台的过滤。</p>
        </div>
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">可本地使用</h3>
          <p className="text-gray-500">前端+弱后端项目，代码公开。密钥对生成、加密、解密可完全在浏览器本地完成。</p>
        </div>
      </div>
    </div>
  );
}
