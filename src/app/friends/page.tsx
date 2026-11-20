import PanelScreen from "@/components/layout/panel-screen";
import FriendsPanel from "@/components/panels/friends/friends-panel";

export default function FriendsPage() {
  return (
    <PanelScreen panel="friends">
      <FriendsPanel />
    </PanelScreen>
  );
}
