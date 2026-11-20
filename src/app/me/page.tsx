import PanelScreen from "@/components/layout/panel-screen";
import FeedPanel from "@/components/panels/feed/feed-panel";

export default function MePage() {
  return (
    <PanelScreen panel="feed">
      <FeedPanel self />
    </PanelScreen>
  );
}
