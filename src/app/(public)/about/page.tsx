import { PRESS_INFO, SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

export const metadata = {
  title: `회사소개 - ${SITE_NAME}`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">회사소개</h1>

      <div className="space-y-8 text-sm leading-7 text-gray-700">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{SITE_NAME}는</h2>
          <p>{SITE_DESCRIPTION}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">발행 목적</h2>
          <p>
            {SITE_NAME}는 전남 함평 지역 주민의 알 권리를 보장하고 지역 사회의 건강한
            여론 형성에 기여하는 것을 목적으로 합니다. 지역 밀착 취재를 바탕으로 정확하고
            공정한 보도를 지향하며, 독자와 함께 소통하는 신뢰받는 언론이 되고자 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">취재·편집 원칙</h2>
          <p>
            {SITE_NAME}는 사실에 근거한 보도, 취재원 보호, 정정·반론의 신속한 반영을
            원칙으로 합니다. 광고와 기사를 명확히 구분하며, 독자가 오인하지 않도록
            광고에는 &apos;광고&apos; 표시를 합니다.
          </p>
        </section>

        <section className="pt-2 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">언론사 정보</h2>
          <ul className="space-y-1 text-gray-600">
            <li>언론사명: {SITE_NAME}</li>
            <li>주소: {PRESS_INFO.address}</li>
            <li>등록번호: {PRESS_INFO.registrationNumber}</li>
            {PRESS_INFO.registrationDate && <li>등록일자: {PRESS_INFO.registrationDate}</li>}
            {PRESS_INFO.foundingDate && <li>창간일자: {PRESS_INFO.foundingDate}</li>}
            <li>대표·발행인: {PRESS_INFO.publisher}</li>
            <li>편집인: {PRESS_INFO.editor}</li>
            {PRESS_INFO.youthProtectionOfficer && (
              <li>청소년보호책임자: {PRESS_INFO.youthProtectionOfficer}</li>
            )}
            <li>연락처: {PRESS_INFO.phone}</li>
            <li>이메일: {PRESS_INFO.email}</li>
            <li>사업자등록번호: {PRESS_INFO.businessNumber}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
