import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { addContact, getContactByPublicKey } from '../lib/storage/contactsStore';
import type { Contact } from '../lib/storage/types';
import { hasBackend, requireBackend } from '../lib/backend/convexClient';

type ProfileUser = {
  handle: string;
  publicKeyBech32: string;
  publicSigningKeyBech32?: string;
  avatarUrl?: string;
  createdAt: number;
};

export function UserProfile() {
  const { userHandle } = useParams<{ userHandle: string }>();
  const [isAdded, setIsAdded] = useState(false);
  const [addNotice, setAddNotice] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [user, setUser] = useState<ProfileUser | null | undefined>(hasBackend ? undefined : null);

  useEffect(() => {
    if (!userHandle || !hasBackend) {
      return;
    }
    let cancelled = false;
    requireBackend()
      .query(api.users.getUserByHandle, { handle: userHandle })
      .then((result) => {
        if (!cancelled) setUser(result as ProfileUser | null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userHandle]);

  useEffect(() => {
    if (user?.publicKeyBech32) {
      getContactByPublicKey(user.publicKeyBech32).then((c: Contact | null) => {
        if (c) setIsAdded(true);
      }).catch((err) => console.warn('检查联系人状态失败', err));
    }
  }, [user]);

  const handleAdd = useCallback(async () => {
    if (!user) return;
    setAddError(null);
    setAddNotice(null);
    try {
      const existing = await getContactByPublicKey(user.publicKeyBech32);
      if (existing) { setIsAdded(true); setAddNotice('该联系人已在通讯录中'); return; }
      await addContact({ id: crypto.randomUUID(), handle: user.handle, publicKeyBech32: user.publicKeyBech32, avatarUrl: user.avatarUrl, addedAt: new Date().toISOString() });
      setIsAdded(true);
      setAddNotice('已添加到通讯录');
    } catch {
      setAddError('添加联系人失败');
    }
  }, [user]);

  if (!userHandle) return <div className="text-center text-gray-500 p-12">无效的用户地址</div>;
  if (!hasBackend) return <div className="text-center text-gray-500 p-12">未配置后端地址，用户主页不可用</div>;
  if (user === undefined) return <div className="text-center text-gray-500 p-12">正在加载...</div>;
  if (user === null) return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white shadow sm:rounded-lg p-6 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">用户不存在</h2>
        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">返回首页</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">{user.handle[0]?.toUpperCase()}</div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">@{user.handle}</h2>
            <p className="text-xs text-gray-400">注册于 {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">公钥</label>
          <div className="font-mono text-xs bg-gray-50 p-3 rounded border border-gray-200 break-all">{user.publicKeyBech32}</div>
        </div>
        {addNotice && <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{addNotice}</div>}
        {addError && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{addError}</div>}
        <div className="flex items-center justify-between pt-2">
          <Link to="/encrypt" className="text-sm text-gray-500 hover:text-gray-700">去加密消息</Link>
          <button type="button" onClick={handleAdd} disabled={isAdded} className="inline-flex items-center rounded-md bg-gray-900 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:opacity-60">
            {isAdded ? '已在通讯录' : '添加到通讯录'}
          </button>
        </div>
      </div>
    </div>
  );
}
