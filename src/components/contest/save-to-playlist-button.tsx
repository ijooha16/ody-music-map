import IconButton from "@/components/common/icon-button";
import { PlaylistAddIcon } from "@/components/common/icons";

interface SaveToPlaylistButtonProps {
  saved: boolean;
  pending: boolean;

  empty: boolean;
  onClick: () => void;
}

export default function SaveToPlaylistButton({ saved, pending, empty, onClick }: SaveToPlaylistButtonProps) {
  return (
    <IconButton label={saved ? "내 플리에 넣었어요" : "내 플리로 가져오기"} active={saved} disabled={saved || pending || empty} onClick={onClick} className="disabled:opacity-45">
      <PlaylistAddIcon size={17} />
    </IconButton>
  );
}
