"use client";

import CenterDialog from "@/components/common/center-dialog";
import CreatePlaylistForm from "./create-playlist-form";

export default function CreatePlaylistDialog({ onClose }: { onClose: () => void }) {
  return (
    <CenterDialog title="새 플레이리스트" onClose={onClose}>
      <CreatePlaylistForm autoFocus onCreated={onClose} />
    </CenterDialog>
  );
}
