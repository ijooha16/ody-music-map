import { redirect } from "next/navigation";
import AuthCard from "@/components/auth/auth-card";
import AuthGuard from "@/components/auth/auth-guard";
import NicknameForm from "@/components/auth/nickname-form";
import { ROUTES } from "@/constants";
import { PUBLIC_DEMO } from "@/constants/public-demo";

export default function NicknamePage() {
  if (PUBLIC_DEMO) redirect(ROUTES.home);

  return (
    <AuthGuard requireNickname={false}>
      <AuthCard title="어떻게 부를까요?" sub="지도와 프로필에 이 이름으로 보입니다. 나중에 마이페이지에서 바꿀 수 있어요.">
        <NicknameForm />
      </AuthCard>
    </AuthGuard>
  );
}
