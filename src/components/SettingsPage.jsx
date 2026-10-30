import { useRef, useState } from 'react';
import { ArrowLeft, Camera, Check, Download, LogOut, Upload } from 'lucide-react';
import { AddedBy, Avatar } from './Person';
import PhotoCropper from './PhotoCropper';
import PhotoViewer from './PhotoViewer';
import { ACCENTS, FONTS, NAME_COLORS, applyAccent, photoToSource } from '../lib/customize';
import { downloadBackup, downloadCsv, parseBackup } from '../lib/backup';
import { FEATURES } from '../config';
import { supabase } from '../lib/supabase';

const STATUS = [
  ['to-watch', 'To watch'],
  ...(FEATURES.episodeTracking ? [['watching', 'Watching']] : []),
  ['watched', 'Watched'],
  ['all', 'All'],
];
const SORTS = [
  ['shortest', 'Shortest first'], ['rating', 'Highest rated'], ['alpha', 'A to Z'],
  ['newest', 'Recently added'], ['likes', 'Most wanted'], ['watched', 'Recently watched'],
];

function Section({ title, hint, children }) {
  return (
    <section className="rounded-3xl bg-plum p-5">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {hint && <p className="mb-4 mt-1 text-sm text-mist">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </section>
  );
}

const chip = (on) =>
  `rounded-full border px-4 py-2.5 text-sm transition ${on ? 'border-blush bg-blush/10 text-blush' : 'border-velvet text-mist'}`;

export default function SettingsPage({ user, me, profile, movies, prefs, onSavePrefs, onSave, onImport, onOpenProfile, onBack, onSignOut }) {
  const fileRef = useRef(null);
  const backupRef = useRef(null);
  const savedFont = profile?.name_font ?? 'classic';
  const savedColor = profile?.name_color ?? null;
  const savedAvatar = profile?.avatar ?? null;
  const savedBio = profile?.bio ?? '';

  const [name, setName] = useState(me.name);
  const [avatar, setAvatar] = useState(savedAvatar);
  const [bio, setBio] = useState(savedBio);
  const [avatarLarge, setAvatarLarge] = useState(null); // sharper copy, shown when the photo is enlarged
  const [viewing, setViewing] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(null); // the larger original, kept so the photo can be re-adjusted
  const [crop, setCrop] = useState(null); // photo currently open in the cropper
  const [restore, setRestore] = useState(null);
  const [backupMsg, setBackupMsg] = useState({ text: '', bad: false });
  const [font, setFont] = useState(savedFont);
  const [color, setColor] = useState(savedColor);
  const [accent, setAccent] = useState(profile?.accent ?? localStorage.getItem('accent') ?? 'rose');
  const [msg, setMsg] = useState({ text: '', bad: false });
  const [saving, setSaving] = useState(false);

  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwMsg, setPwMsg] = useState({ text: '', bad: false });

  const dirty = name.trim() !== me.name || bio.trim() !== savedBio || avatar !== savedAvatar || font !== savedFont || color !== savedColor;
  const preview = { name: name.trim() || 'You', avatar, name_font: font, name_color: color };

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { setCrop(await photoToSource(file)); setMsg({ text: '', bad: false }); }
    catch { setMsg({ text: "That file couldn't be read as a photo. Try a JPG or PNG.", bad: true }); }
  };

  const adjustPhoto = async () => {
    if (avatarSrc) { setCrop(avatarSrc); return; }
    const { data } = await supabase.from('profiles').select('avatar_src').eq('id', user.id).maybeSingle();
    setCrop(data?.avatar_src || avatar);
  };

  const pickBackup = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { setRestore(parseBackup(await file.text())); setBackupMsg({ text: '', bad: false }); }
    catch (err) { setRestore(null); setBackupMsg({ text: err.message, bad: true }); }
  };

  const doRestore = async () => {
    try {
      const n = await onImport(restore);
      setBackupMsg({ text: n ? `Added ${n} new ${n === 1 ? 'title' : 'titles'}.` : 'Everything in that file is already on your list.', bad: false });
    } catch (err) { setBackupMsg({ text: `Couldn't restore: ${err.message}`, bad: true }); }
    setRestore(null);
  };

  const saveProfile = async () => {
    setSaving(true); setMsg({ text: '', bad: false });
    try {
      const fields = { name: name.trim(), bio: bio.trim(), avatar, name_font: font, name_color: color };
      if (avatar !== savedAvatar) {
        fields.avatar_src = avatar ? avatarSrc : null;
        fields.avatar_large = avatar ? avatarLarge : null;
      }
      await onSave(fields);
      setMsg({ text: 'Saved. Your partner will see this too.', bad: false });
    } catch {
      setMsg({ text: "Couldn't save. Run supabase-upgrade-v3.sql in Supabase first (see the README).", bad: true });
    }
    setSaving(false);
  };

  const pickAccent = (id) => {
    setAccent(id); applyAccent(id);
    try { localStorage.setItem('accent', id); } catch { /* ignore */ }
    onSave({ accent: id }).catch(() => {}); // the colour still works on this device if the table is missing
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.length < 6) return setPwMsg({ text: 'Use at least 6 characters.', bad: true });
    if (pw !== pw2) return setPwMsg({ text: "Those two don't match.", bad: true });
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setPwMsg({ text: error.message, bad: true });
    setPw(''); setPw2('');
    return setPwMsg({ text: 'Password changed.', bad: false });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pb-20 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3 pt-2">
        <button onClick={onBack} aria-label="Back to the list" className="btn btn-ghost !h-11 !w-11 !px-0"><ArrowLeft size={18} /></button>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
      </header>

      <Section title="Your profile" hint="This is how you show up on the titles you add and want.">
        <div className="flex items-center gap-4">
          {avatar ? (
            <button onClick={() => setViewing(true)} aria-label="View photo larger" title="View larger" className="rounded-full ring-2 ring-transparent transition hover:ring-blush">
              <Avatar person={preview} size={80} />
            </button>
          ) : <Avatar person={preview} size={80} />}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => fileRef.current?.click()} className="btn btn-ghost !py-2.5"><Camera size={16} /> {avatar ? 'Change photo' : 'Add a photo'}</button>
            {avatar && <button onClick={adjustPhoto} className="btn btn-ghost !py-2.5">Adjust</button>}
            {avatar && <button onClick={() => setAvatar(null)} className="btn btn-ghost !py-2.5 text-mist">Remove</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
        </div>

        <label className="mt-5 block text-sm text-mist" htmlFor="display-name">Name</label>
        <input id="display-name" className="input mt-1.5" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />

        <label className="mt-5 block text-sm text-mist" htmlFor="bio">About you</label>
        <textarea
          id="bio" rows={2} maxLength={140} value={bio} onChange={(e) => setBio(e.target.value)}
          placeholder="Favourite genre, comfort movie, anything" className="input mt-1.5 resize-none"
        />
        <p className="mt-1 text-right text-xs text-mist">{bio.length}/140</p>

        <p className="mb-2 mt-5 text-sm text-mist">Name style</p>
        <div className="flex flex-wrap gap-2">
          {FONTS.map((f) => (
            <button key={f.id} onClick={() => setFont(f.id)} aria-pressed={font === f.id} className={chip(font === f.id)}
              style={{ fontFamily: f.css, fontWeight: f.weight }}>
              {preview.name}
            </button>
          ))}
        </div>

        <p className="mb-2 mt-5 text-sm text-mist">Name colour</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={() => setColor(null)} aria-pressed={color === null} className={`${chip(color === null)} !py-2`}>Auto</button>
          {NAME_COLORS.map((c) => (
            <button
              key={c} onClick={() => setColor(c)} aria-label={`Use colour ${c}`} aria-pressed={color === c}
              style={{ backgroundColor: c }}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-night ring-offset-2 ring-offset-plum transition ${color === c ? 'ring-2 ring-stone-100' : ''}`}
            >{color === c && <Check size={16} />}</button>
          ))}
          <label className="flex h-9 items-center gap-2 rounded-full border border-velvet px-3 text-sm text-mist">
            Custom
            <input type="color" value={color || '#f0a8b8'} onChange={(e) => setColor(e.target.value)} className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0" />
          </label>
        </div>

        <div className="mt-5 rounded-2xl bg-night p-4">
          <p className="mb-2 text-xs text-mist">Preview</p>
          <AddedBy person={preview} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={saveProfile} disabled={!dirty || saving || !name.trim()} className="btn btn-primary !px-6">{saving ? 'Saving…' : 'Save profile'}</button>
          {msg.text && <p className={`text-sm ${msg.bad ? 'text-red-300' : 'text-mist'}`}>{msg.text}</p>}
        </div>
        <button onClick={() => onOpenProfile(user.id)} className="mt-4 text-sm text-blush underline-offset-4 hover:underline">
          See how your profile page looks
        </button>
      </Section>

      <Section title="Appearance" hint="The accent colour is just for you. Your partner keeps their own.">
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.id} onClick={() => pickAccent(a.id)} aria-pressed={accent === a.id}
              className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-sm transition ${accent === a.id ? 'border-stone-100 text-stone-100' : 'border-velvet text-mist'}`}
            >
              <span style={{ backgroundColor: a.hex }} className="h-7 w-7 rounded-full" />
              {a.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="When the list opens" hint="Saved on this device only.">
        <p className="mb-2 text-sm text-mist">Start on</p>
        <div className="flex flex-wrap gap-2">
          {STATUS.map(([v, label]) => (
            <button key={v} onClick={() => onSavePrefs({ ...prefs, status: v })} aria-pressed={prefs.status === v} className={chip(prefs.status === v)}>{label}</button>
          ))}
        </div>
        <p className="mb-2 mt-5 text-sm text-mist">Sort by</p>
        <div className="flex flex-wrap gap-2">
          {SORTS.map(([v, label]) => (
            <button key={v} onClick={() => onSavePrefs({ ...prefs, sort: v })} aria-pressed={prefs.sort === v} className={chip(prefs.sort === v)}>{label}</button>
          ))}
        </div>
      </Section>

      <Section title="Backup and export" hint="Keep a copy of the whole list: titles, who added and wants what, watch dates, plans, notes and episode progress.">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => downloadBackup(movies)} className="btn btn-ghost"><Download size={16} /> Download backup</button>
          <button onClick={() => downloadCsv(movies)} className="btn btn-ghost"><Download size={16} /> Spreadsheet (CSV)</button>
          <button onClick={() => backupRef.current?.click()} className="btn btn-ghost"><Upload size={16} /> Restore from backup</button>
          <input ref={backupRef} type="file" accept=".json,application/json" onChange={pickBackup} className="hidden" />
        </div>
        {restore && (
          <div className="mt-4 rounded-2xl bg-night p-4">
            <p className="text-sm">Found {restore.length} {restore.length === 1 ? 'title' : 'titles'}. Add the ones that aren't on your list yet? Anything already there stays as it is.</p>
            <div className="mt-3 flex gap-2">
              <button onClick={doRestore} className="btn btn-primary !py-2">Restore</button>
              <button onClick={() => setRestore(null)} className="btn btn-ghost !py-2">Cancel</button>
            </div>
          </div>
        )}
        {backupMsg.text && <p className={`mt-3 text-sm ${backupMsg.bad ? 'text-red-300' : 'text-mist'}`}>{backupMsg.text}</p>}
      </Section>

      <Section title="Account">
        <p className="text-sm text-mist">Signed in as</p>
        <p className="mb-5 break-all font-semibold">{user.email}</p>
        <form onSubmit={changePassword} className="space-y-3">
          <p className="text-sm text-mist">Change password</p>
          <input className="input" type="password" autoComplete="new-password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <input className="input" type="password" autoComplete="new-password" placeholder="Type it again" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-ghost" disabled={!pw}>Update password</button>
            {pwMsg.text && <p className={`text-sm ${pwMsg.bad ? 'text-red-300' : 'text-mist'}`}>{pwMsg.text}</p>}
          </div>
        </form>
        <button onClick={onSignOut} className="btn btn-ghost mt-6 w-full !py-3"><LogOut size={16} /> Sign out</button>
      </Section>

      {viewing && avatar && <PhotoViewer person={{ ...preview, id: user.id }} large={avatarLarge} onClose={() => setViewing(false)} />}

      {crop && (
        <PhotoCropper
          src={crop} onCancel={() => setCrop(null)}
          onDone={({ small, large }) => { setAvatar(small); setAvatarLarge(large); setAvatarSrc(crop); setCrop(null); setMsg({ text: '', bad: false }); }}
        />
      )}
    </div>
  );
}
