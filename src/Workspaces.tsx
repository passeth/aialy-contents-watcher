import { useEffect, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { api, type WorkspaceInfo } from "./model";

export function WorkspacePicker({ spaces, current, close }: {
  spaces: WorkspaceInfo[]; current: string; close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    dialog.current?.showModal();
    return () => previous?.focus();
  }, []);
  function switchTo(id: string) {
    if (busy) return;
    // A full navigation discards old dialogs, filters and in-flight UI responses.
    const params = new URLSearchParams({ page: "discover", workspace: id });
    window.location.assign("?" + params);
  }
  return <dialog ref={dialog} className="modal workspace-modal" aria-labelledby="workspace-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) close(); }}
    onClick={(event) => { if (event.target === dialog.current && !busy) close(); }}>
    <div className="modal-header">
      <div><span className="eyebrow">YOUR RESEARCH SPACES</span><h2 id="workspace-title">워크스페이스</h2></div>
      <button className="icon-btn" aria-label="닫기" disabled={busy} onClick={close}><X size={20} /></button>
    </div>
    <div className="workspace-picker-body">
      <p>브랜드나 카테고리별로 조사 공간을 나누세요. 관심 계정, 수집 콘텐츠, 추적 조건, 북마크를 각각 관리합니다.</p>
      <div className="workspace-options">
        {spaces.map((space) => <button key={space.id} className={current === space.id ? "workspace-option active" : "workspace-option"}
          aria-pressed={current === space.id} disabled={busy} onClick={() => switchTo(space.id)}>
          <span>{space.name}</span>{current === space.id && <Check size={18} />}
        </button>)}
      </div>
      <form onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setError("");
        try {
          const space = await api<WorkspaceInfo>("/workspaces", "POST", { name });
          window.location.assign("?" + new URLSearchParams({ page: "discover", workspace: space.id }));
        } catch (cause) { setError((cause as Error).message); setBusy(false); }
      }}>
        <label htmlFor="workspace-name">새 워크스페이스 이름</label>
        <input id="workspace-name" value={name} onChange={(event) => setName(event.target.value)}
          placeholder="예: 스킨케어, 바디케어, 헤어케어" maxLength={60} required disabled={busy} />
        <div className="workspace-suggestions">{["스킨케어", "바디케어", "헤어케어"].map((example) =>
          <button key={example} className="secondary" type="button" disabled={busy} onClick={() => setName(example)}>{example}</button>)}</div>
        <small>새 공간에는 자료가 복사되지 않습니다. Instagram 연결도 공간별로 설정합니다.</small>
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="primary" disabled={busy || !name.trim()}><Plus size={16} />{busy ? "만드는 중…" : "워크스페이스 만들기"}</button>
      </form>
    </div>
  </dialog>;
}
