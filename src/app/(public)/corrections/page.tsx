import Link from "next/link";
import { PRESS_INFO, SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: `정정·반론보도 청구 안내 - ${SITE_NAME}`,
  description: `${SITE_NAME}의 정정보도·반론보도 청구 및 고충처리 절차 안내입니다.`,
  alternates: { canonical: "/corrections" },
};

export default function CorrectionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">정정·반론보도 청구 안내</h1>

      <div className="space-y-8 text-sm leading-7 text-gray-700">
        <section>
          <p>
            {SITE_NAME}는 「언론중재 및 피해구제 등에 관한 법률」(언론중재법)에 따라
            사실과 다른 보도로 피해를 입은 분의 정정보도·반론보도·추후보도 청구를
            성실히 처리합니다. 보도 내용에 오류가 있는 경우 신속하게 바로잡겠습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">청구 대상</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>정정보도: 사실적 주장에 관한 보도가 진실하지 아니한 경우</li>
            <li>반론보도: 보도 내용에 대해 반대 또는 해명을 구하는 경우</li>
            <li>추후보도: 범죄 혐의 보도 후 무죄 등이 확정된 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">청구 방법</h2>
          <p>
            아래 연락처로 ① 청구인 성명·연락처, ② 해당 기사의 제목·URL·보도일자,
            ③ 정정·반론을 구하는 내용과 사유를 적어 보내주시면 접수 후 처리 절차를
            안내해 드립니다. 온라인 제보·문의 양식으로도 접수하실 수 있습니다.
          </p>
          <p className="mt-3">
            <Link href="/contact" className="text-blue-600 hover:underline">
              온라인 제보·문의 바로가기 →
            </Link>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">처리 기간</h2>
          <p>
            청구를 받은 날부터 관련 법령이 정하는 기간(통상 3일 이내 수용 여부 통지,
            7일 이내 보도) 내에 처리하며, 사실 확인에 시간이 필요한 경우 별도로
            안내해 드립니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">조정·중재 안내</h2>
          <p>
            당사와의 협의로 해결되지 않는 경우 언론중재위원회(www.pac.or.kr)에 조정 또는
            중재를 신청하거나 법원에 소를 제기할 수 있습니다.
          </p>
        </section>

        <section className="pt-2 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">접수처 (고충처리)</h2>
          <ul className="space-y-1 text-gray-600">
            <li>언론사명: {SITE_NAME}</li>
            <li>편집인: {PRESS_INFO.editor}</li>
            <li>전화: {PRESS_INFO.phone}</li>
            <li>이메일: {PRESS_INFO.email}</li>
            <li>주소: {PRESS_INFO.address}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
