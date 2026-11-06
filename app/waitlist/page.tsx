import type { Metadata } from "next"

import { WaitlistPage } from "@/components/waitlist/waitlist-page"

export const metadata: Metadata = {
  title: "acttub 비공개 테스터 사전 등록",
  description: "AI 질문으로 배우 연기 의도를 구체화하는 acttub 테스트 알림 신청",
}

export default function Waitlist() {
  return <WaitlistPage />
}
