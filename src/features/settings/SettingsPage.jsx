import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileJson, HardDrive, KeyRound, RefreshCw, ShieldCheck, Upload } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';
const KEY_STORAGE = 'shivshakti_backup_key';
const panel = 'border border-slate-300 bg-white';
const input = 'h-9 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100';
const button = 'inline-flex h-9 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';
const primary = 'inline-flex h-9 items-center justify-center gap-2 border border-[#1d477b] bg-[#244f86] px-3 text-xs font-semibold text-white hover:bg-[#1b3f6e] disabled:cursor-not-allowed disabled:opacity-50';

async function requestWithKey(path, key, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'x-backup-key': key, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    });
  } catch {
    throw new Error('Cannot reach the backend. Check that the Express server is running.');
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { message = (await response.json()).error || message; } catch { /* no JSON error body */ }
    throw new Error(message);
  }
  return response;
}

export default function SettingsPage() {
  const [backupKey, setBackupKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) || '');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState(null);
  const [backup, setBackup] = useState(null);
  const [confirmText, setConfirmText] = useState('');

  const counts = useMemo(() => backup?.collections ? Object.fromEntries(Object.entries(backup.collections).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])) : null, [backup]);
  const totalDocs = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : 0;

  const saveKey = (value) => {
    setBackupKey(value);
    if (value) sessionStorage.setItem(KEY_STORAGE, value);
    else sessionStorage.removeItem(KEY_STORAGE);
  };

  const downloadBackup = async () => {
    setError(''); setSuccess('');
    if (!backupKey.trim()) return setError('Enter the backup key configured in server/.env first.');
    setBusy('backup');
    try {
      const response = await requestWithKey('/backup/export', backupKey.trim());
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `shivshakti-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
      URL.revokeObjectURL(url);
      setSuccess('Backup downloaded. Store the JSON file somewhere safe, outside this computer if possible.');
    } catch (e) { setError(e.message); }
    finally { setBusy(''); }
  };

  const selectBackup = async (picked) => {
    setError(''); setSuccess(''); setFile(picked || null); setBackup(null); setConfirmText('');
    if (!picked) return;
    try {
      const parsed = JSON.parse(await picked.text());
      if (parsed?.format !== 'shivshakti-billing-backup' || parsed?.version !== 1 || !parsed.collections) throw new Error('This is not a supported Shivshakti backup file.');
      for (const name of ['parties', 'items', 'transactions', 'units']) if (!Array.isArray(parsed.collections[name])) throw new Error(`Backup is missing the ${name} collection.`);
      setBackup(parsed);
    } catch (e) { setFile(null); setError(e.message || 'Could not read this backup file.'); }
  };

  const restoreBackup = async () => {
    setError(''); setSuccess('');
    if (!backupKey.trim()) return setError('Enter the backup key configured in server/.env first.');
    if (!backup || !file) return setError('Choose a valid Shivshakti backup file first.');
    if (confirmText !== 'RESTORE') return setError('Type RESTORE exactly to confirm replacing the current data.');
    setBusy('restore');
    try {
      const response = await requestWithKey('/backup/restore', backupKey.trim(), { method: 'POST', body: JSON.stringify(backup) });
      const result = await response.json();
      setSuccess(`Restore completed. ${Object.entries(result.restored || {}).map(([name, n]) => `${name}: ${n}`).join(' · ')}. Refresh other open app pages to load restored data.`);
      setConfirmText('');
    } catch (e) { setError(e.message); }
    finally { setBusy(''); }
  };

  return <div className="mx-auto max-w-4xl space-y-4">
    <div className="flex items-end justify-between gap-3">
      <div><h1 className="text-[18px] font-semibold text-[#1b2f4a]">Settings</h1><p className="text-xs text-slate-500">Application configuration and database safety tools.</p></div>
    </div>

    <section className={`${panel} p-4`}>
      <div className="mb-3 flex items-center gap-2"><KeyRound size={17} className="text-[#244f86]"/><div><h2 className="text-sm font-semibold text-slate-800">Backup security key</h2><p className="text-xs text-slate-500">Enter the same key you set in the backend environment.</p></div></div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Backup / Restore Key</label>
      <input className={input} type="password" value={backupKey} onChange={e=>saveKey(e.target.value)} placeholder="Enter BACKUP_RESTORE_KEY" autoComplete="off" />
      <p className="mt-1 text-[11px] text-slate-500">The key is kept only in this browser session and is sent to the backend only when you perform a backup or restore.</p>
    </section>

    {error && <div role="alert" className="flex items-start gap-2 border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800"><AlertTriangle size={15} className="mt-0.5 shrink-0"/>{error}</div>}
    {success && <div role="status" className="flex items-start gap-2 border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 size={15} className="mt-0.5 shrink-0"/>{success}</div>}

    <section className={`${panel} p-4`}>
      <div className="mb-3 flex items-center gap-2"><HardDrive size={18} className="text-[#244f86]"/><div><h2 className="text-sm font-semibold">Create database backup</h2><p className="text-xs text-slate-500">Download a complete copy of your Shivshakti business data.</p></div></div>
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        {['Customers and suppliers','Items and units','Purchase, Sale, Debit and Credit vouchers','Object IDs and dates preserved'].map(x=><div key={x} className="flex items-center gap-2 text-xs text-slate-600"><CheckCircle2 size={13} className="text-emerald-600"/>{x}</div>)}
      </div>
      <button className={primary} disabled={!!busy} onClick={downloadBackup}>{busy==='backup'?<RefreshCw size={14} className="animate-spin"/>:<Download size={14}/>} {busy==='backup'?'Creating backup…':'Download Backup (.json)'}</button>
    </section>

    <section className={`${panel} p-4`}>
      <div className="mb-3 flex items-center gap-2"><Upload size={18} className="text-[#244f86]"/><div><h2 className="text-sm font-semibold">Restore database backup</h2><p className="text-xs text-slate-500">Restore business data from a previously downloaded Shivshakti JSON backup.</p></div></div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Select backup file</label>
      <input className="block w-full text-xs text-slate-600 file:mr-3 file:border file:border-slate-300 file:bg-slate-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-100" type="file" accept=".json,application/json" onChange={e=>selectBackup(e.target.files?.[0] || null)} disabled={!!busy}/>
      {backup && <div className="mt-3 border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700"><FileJson size={15}/> Backup preview</div>
        <p className="text-[11px] text-slate-500">File: {file?.name} · Created: {backup.createdAt ? new Date(backup.createdAt).toLocaleString() : 'Unknown'} · Source database: {backup.database || 'Unknown'}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.entries(counts || {}).map(([name,n])=><div key={name} className="border border-slate-200 bg-white p-2"><div className="text-[10px] uppercase text-slate-500">{name}</div><div className="text-base font-semibold tabular-nums text-slate-800">{n}</div></div>)}</div>
        <p className="mt-2 text-xs font-semibold text-slate-700">Total documents: {totalDocs}</p>
      </div>}
      <div className="mt-3 border border-rose-300 bg-rose-50 p-3">
        <div className="flex items-start gap-2 text-xs font-semibold text-rose-800"><AlertTriangle size={15} className="mt-0.5 shrink-0"/> Restore replaces current data</div>
        <p className="mt-1 text-[11px] leading-5 text-rose-800">The current parties, items, transactions and units will be replaced by the selected backup. This cannot be undone. Create a fresh backup of the current database before restoring.</p>
        <label className="mb-1 mt-3 block text-[11px] font-semibold uppercase tracking-wide text-rose-800">Type RESTORE to confirm</label>
        <input className="h-9 w-full border border-rose-300 bg-white px-3 text-sm outline-none focus:border-rose-500" value={confirmText} onChange={e=>setConfirmText(e.target.value)} placeholder="RESTORE" disabled={!backup || !!busy}/>
        <button className="mt-3 inline-flex h-9 items-center justify-center gap-2 border border-rose-700 bg-rose-700 px-3 text-xs font-semibold text-white hover:bg-rose-800 disabled:opacity-50" disabled={!backup || confirmText!=='RESTORE' || !!busy} onClick={restoreBackup}>{busy==='restore'?<RefreshCw size={14} className="animate-spin"/>:<ShieldCheck size={14}/>} {busy==='restore'?'Restoring data…':'Restore Backup'}</button>
      </div>
    </section>
    <p className="text-[11px] leading-5 text-slate-500">For production, set BACKUP_RESTORE_KEY in Render's environment variables and use HTTPS. Keep downloaded backup files private: they contain customer, supplier and transaction information.</p>
  </div>;
}
