import Link from "next/link";
import { PRESS_INFO, SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `저작권 정책 - ${SITE_NAME}`,
  description: `${SITE_NAME} 콘텐츠의 저작권 및 이용에 관한 안내입니다.`,
  alternates: { canonical: "/copyright" },
};

export default function CopyrightPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">저작권 정책</h1>

      <div className="space-y-8 text-sm leading-7 text-gray-700">
        <section>
          <p>
            {SITE_NAME}가 제작한 기사, 사진, 그래픽, 편집물 등 모든 콘텐츠의 저작권은
            {SITE_NAME} 또는 정당한 권리자에게 있습니다. 저작권법에 따라 보호받으며,
            무단 전재·복제·배포·전송 및 2차적 저작물 작성을 금지합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">인용 및 이용</h2>
          <p>
            보도·비평·교육·연구 등을 위한 정당한 범위 안에서 출처({SITE_NAME})를
            명시하여 인용할 수 있습니다. 그 외 상업적 이용이나 전문(全文) 게재는 사전
            동의가 필요합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">제휴·전재 문의</h2>
          <p>
            콘텐츠 전재·제휴·이용 허락이 필요하신 경우 아래로 문의해 주시기 바랍니다.
          </p>
          <ul className="mt-3 space-y-1 text-gray-600">
            <li>이메일: {PRESS_INFO.email}</li>
            <li>전화: {PRESS_INFO.phone}</li>
          </ul>
          <p className="mt-3">
            <Link href="/contact" className="text-blue-600 hover:underline">
              온라인 문의 바로가기 →
            </Link>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">제3자 콘텐츠</h2>
          <p>
            통신사·기고자 등 제3자가 제공한 콘텐츠의 저작권은 해당 권리자에게 있으며,
            출처 표기가 있는 기사는 원 저작권자의 정책을 따릅니다.
          </p>
        </section>
      </div>
    </div>
  );
}
