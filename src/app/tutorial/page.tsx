import AuthGuard from "@/components/auth/auth-guard";
import MainScreen from "@/components/layout/main-screen";
import TutorialEntry from "@/components/tutorial/tutorial-entry";

export default function TutorialPage() {
  return (
    <AuthGuard>
      <MainScreen overlay={<TutorialEntry />} />
    </AuthGuard>
  );
}
