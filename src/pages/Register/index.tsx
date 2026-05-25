import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useRegister } from './useRegister';
import { PinInput } from '../../components/PinInput';
import { MnemonicDisplay } from '../key-center/MnemonicDisplay';

export function Register() {
  const {
    handle, setHandle, pin, setPin, confirmPin, setConfirmPin,
    mnemonic, error, notice, isBusy, handleRegister, turnstileRef,
  } = useRegister();

  if (mnemonic) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 注册成功</h2>
            <p className="text-gray-500">您的 Handle <span className="font-mono font-semibold">@{handle}</span> 已注册。请务必保存以下助记词。</p>
          </div>
          <MnemonicDisplay mnemonic={mnemonic} onCopy={async (_, v) => { await navigator.clipboard.writeText(v).catch(() => undefined); }} copiedField={null} />
          <div className="flex justify-center">
            <Link to="/encrypt" className="inline-flex items-center rounded-md bg-gray-900 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800">
              开始加密消息
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🚀 极速入驻</h2>
          <p className="text-gray-500">设置 Handle 和 PIN，即可生成密钥并开始使用。</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Handle</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="例如：alice"
              className="shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md p-3 border"
            />
            <p className="mt-1 text-xs text-gray-500">仅允许字母、数字、下划线和连字符，长度 3-20</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设置 PIN</label>
            <PinInput value={pin} onChange={setPin} autoFocus />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认 PIN</label>
            <PinInput value={confirmPin} onChange={setConfirmPin} onEnter={handleRegister} />
          </div>
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{notice}</div>}

        <Turnstile ref={turnstileRef} siteKey={import.meta.env.VITE_CF_TURNSTILE_KEY ?? ''} />

        <div className="flex items-center justify-between pt-2">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">返回首页</Link>
          <button
            type="button"
            onClick={handleRegister}
            disabled={isBusy}
            className="inline-flex items-center rounded-md bg-gray-900 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:opacity-60"
          >
            {isBusy ? '注册中...' : '注册'}
          </button>
        </div>
      </div>
    </div>
  );
}
